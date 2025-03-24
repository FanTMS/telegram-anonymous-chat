import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Input } from '../../components/Input'
import { isAdmin, getCurrentUser } from '../../utils/user'
import {
  getPendingModerationMessages,
  getRejectedMessages,
  moderateMessageAction,
  getModerationSettings,
  saveModerationSettings,
  getModerationStats,
  updateBlockedWordsList,
  Message,
  ViolationType,
  ModerationSettings
} from '../../utils/moderation'

// Определим интерфейс для статистики модерации
interface ModerationStats {
  totalMessages: number;
  approvedMessages: number;
  rejectedMessages: number;
  pendingMessages: number;
  violationsByType: Record<ViolationType, number>;
  recentActionsCount: number;
  averageResponseTime: number;
}

export const ModerationPanel = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'pending' | 'rejected' | 'settings' | 'blocked-words'>('pending')
  const [pendingMessages, setPendingMessages] = useState<Message[]>([])
  const [rejectedMessages, setRejectedMessages] = useState<Message[]>([])
  const [moderationSettings, setModerationSettings] = useState<ModerationSettings | null>(null)
  const [violationType, setViolationType] = useState<ViolationType | ''>('')
  const [moderationComment, setModerationComment] = useState('')
  const [blockedWords, setBlockedWords] = useState<string[]>([])
  const [newBlockedWord, setNewBlockedWord] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [stats, setStats] = useState<ModerationStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  // Проверка прав администратора
  useEffect(() => {
    if (!isAdmin()) {
      WebApp.showAlert('У вас нет прав администратора')
      navigate('/')
    }

    loadData()
  }, [navigate])

  // Загрузка всех необходимых данных
  const loadData = () => {
    try {
      // Загружаем сообщения, ожидающие модерации
      const pending = getPendingModerationMessages()
      setPendingMessages(pending)

      // Загружаем отклоненные сообщения
      const rejected = getRejectedMessages()
      setRejectedMessages(rejected)

      // Загружаем настройки модерации
      const settings = getModerationSettings()
      setModerationSettings(settings)
      setBlockedWords(settings.customBlockedWords)

      // Загружаем статистику
      const moderationStats = getModerationStats()
      // Преобразуем данные статистики в соответствии с нашим интерфейсом
      setStats({
        totalMessages: moderationStats.totalModerated,
        pendingMessages: moderationStats.pendingCount,
        approvedMessages: moderationStats.approvedCount,
        rejectedMessages: moderationStats.rejectedTotal,
        violationsByType: moderationStats.violationCounts,
        recentActionsCount: moderationStats.recentActionsCount,
        averageResponseTime: 0 // Фиксированное значение, так как поле отсутствует в исходных данных
      })
    } catch (error) {
      console.error('Ошибка при загрузке данных модерации:', error)
      setMessage('Ошибка при загрузке данных модерации')
      setMessageType('error')
    }
  }

  // Обработчик модерации сообщения
  const handleModerateMessage = (message: Message, action: 'approve' | 'reject') => {
    setLoading(true)

    try {
      const currentUser = getCurrentUser()

      if (!currentUser) {
        setMessage('Ошибка: не удалось получить текущего пользователя')
        setMessageType('error')
        setLoading(false)
        return
      }

      const success = moderateMessageAction(
        message.id,
        message.chatId,
        action,
        currentUser.id,
        action === 'reject' && violationType ? violationType as ViolationType : undefined,
        action === 'reject' && moderationComment ? moderationComment : undefined
      )

      if (success) {
        setMessage(`Сообщение успешно ${action === 'approve' ? 'одобрено' : 'отклонено'}`)
        setMessageType('success')

        // Очищаем форму
        setViolationType('')
        setModerationComment('')
        setSelectedMessage(null)

        // Обновляем данные
        loadData()
      } else {
        setMessage('Ошибка при модерации сообщения')
        setMessageType('error')
      }
    } catch (error) {
      setMessage(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  // Сохранить изменения настроек модерации
  const handleSaveSettings = () => {
    setLoading(true)

    try {
      if (!moderationSettings) return

      const success = saveModerationSettings(moderationSettings)

      if (success) {
        setMessage('Настройки модерации успешно сохранены')
        setMessageType('success')
      } else {
        setMessage('Ошибка при сохранении настроек модерации')
        setMessageType('error')
      }
    } catch (error) {
      setMessage(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  // Добавить новое запрещенное слово
  const handleAddBlockedWord = () => {
    if (!newBlockedWord.trim()) return

    const updatedWords = [...blockedWords, newBlockedWord.trim()]
    setBlockedWords(updatedWords)
    setNewBlockedWord('')

    // Сохраняем новый список
    updateBlockedWordsList(updatedWords)
  }

  // Удалить запрещенное слово
  const handleRemoveBlockedWord = (word: string) => {
    const updatedWords = blockedWords.filter(w => w !== word)
    setBlockedWords(updatedWords)

    // Сохраняем новый список
    updateBlockedWordsList(updatedWords)
  }

  // Форматирование даты/времени
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Фильтрация сообщений по поисковому запросу
  const getFilteredMessages = (messages: Message[]) => {
    if (!searchTerm) return messages

    const lowerSearchTerm = searchTerm.toLowerCase()
    return messages.filter(msg =>
      msg.text.toLowerCase().includes(lowerSearchTerm) ||
      msg.senderId.toString().includes(lowerSearchTerm)
    )
  }

  // Отображение вкладки "Ожидающие модерации"
  const renderPendingTab = () => {
    const filteredMessages = getFilteredMessages(pendingMessages)

    return (
      <div className="flex flex-col gap-4">
        <div className="mb-4">
          <Input
            placeholder="Поиск по тексту сообщения"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            fullWidth
          />
        </div>

        {filteredMessages.length === 0 ? (
          <Card>
            <div className="text-center py-4">
              Нет сообщений, ожидающих модерации
            </div>
          </Card>
        ) : (
          filteredMessages.map(msg => (
            <Card key={msg.id} className={selectedMessage?.id === msg.id ? 'border-2 border-blue-500' : ''}>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between">
                  <div className="font-medium">Отправитель: {msg.senderId}</div>
                  <div className="text-gray-500 text-sm">{formatDate(msg.timestamp)}</div>
                </div>

                <div className="bg-gray-100 rounded p-3">
                  {msg.text}
                </div>

                {selectedMessage?.id === msg.id ? (
                  <div className="flex flex-col gap-3 border-t pt-3">
                    <div className="mt-2">
                      <select
                        className="w-full p-2 border rounded mb-2"
                        value={violationType}
                        onChange={e => setViolationType(e.target.value as ViolationType | '')}
                      >
                        <option value="">Выберите тип нарушения</option>
                        {Object.values(ViolationType).map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>

                      <Input
                        placeholder="Комментарий модератора"
                        value={moderationComment}
                        onChange={e => setModerationComment(e.target.value)}
                        fullWidth
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleModerateMessage(msg, 'approve')}
                        isLoading={loading}
                        className="bg-green-500 hover:bg-green-600 flex-1"
                      >
                        <span className="mr-1">✓</span> Одобрить
                      </Button>

                      <Button
                        onClick={() => handleModerateMessage(msg, 'reject')}
                        isLoading={loading}
                        className="bg-red-500 hover:bg-red-600 flex-1"
                      >
                        <span className="mr-1">✕</span> Отклонить
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => setSelectedMessage(null)}
                        className="flex-1"
                      >
                        Отмена
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setSelectedMessage(msg)}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    <span className="mr-1">👁</span> Модерировать
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    )
  }

  // Отображение вкладки "Отклоненные сообщения"
  const renderRejectedTab = () => {
    const filteredMessages = getFilteredMessages(rejectedMessages)

    return (
      <div className="flex flex-col gap-4">
        <div className="mb-4">
          <Input
            placeholder="Поиск по тексту сообщения"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            fullWidth
          />
        </div>

        {filteredMessages.length === 0 ? (
          <Card>
            <div className="text-center py-4">
              Нет отклоненных сообщений
            </div>
          </Card>
        ) : (
          filteredMessages.map(msg => (
            <Card key={msg.id} className="border-l-4 border-red-500">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between">
                  <div className="font-medium">Отправитель: {msg.senderId}</div>
                  <div className="text-gray-500 text-sm">{formatDate(msg.timestamp)}</div>
                </div>

                <div className="bg-gray-100 rounded p-3">
                  {msg.text}
                </div>

                <div className="text-sm text-gray-500">
                  Отклонено: {msg.moderatedBy}
                  {msg.moderationTimestamp && <span> | {formatDate(msg.moderationTimestamp)}</span>}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    )
  }

  // Отображение вкладки "Настройки модерации"
  const renderSettingsTab = () => {
    if (!moderationSettings) return <div>Загрузка настроек...</div>

    return (
      <div className="flex flex-col gap-4">
        <Card>
          <h3 className="font-bold mb-4">Настройки модерации</h3>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h4 className="font-medium">Автоматическая модерация</h4>
                <p className="text-sm text-gray-600">Проверять сообщения при отправке</p>
              </div>
              <div
                className={`relative inline-block w-12 h-6 rounded-full cursor-pointer transition-colors ${moderationSettings.autoModeration ? 'bg-blue-500' : 'bg-gray-200'}`}
                onClick={() => setModerationSettings(prev => prev ? { ...prev, autoModeration: !prev.autoModeration } : null)}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${moderationSettings.autoModeration ? 'left-7' : 'left-1'}`}
                ></div>
              </div>
            </div>

            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h4 className="font-medium">Фильтр нецензурной лексики</h4>
                <p className="text-sm text-gray-600">Блокировать сообщения с запрещенными словами</p>
              </div>
              <div
                className={`relative inline-block w-12 h-6 rounded-full cursor-pointer transition-colors ${moderationSettings.profanityFilter ? 'bg-blue-500' : 'bg-gray-200'}`}
                onClick={() => setModerationSettings(prev => prev ? { ...prev, profanityFilter: !prev.profanityFilter } : null)}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${moderationSettings.profanityFilter ? 'left-7' : 'left-1'}`}
                ></div>
              </div>
            </div>

            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h4 className="font-medium">Фильтр спама</h4>
                <p className="text-sm text-gray-600">Блокировать сообщения похожие на спам</p>
              </div>
              <div
                className={`relative inline-block w-12 h-6 rounded-full cursor-pointer transition-colors ${moderationSettings.spamFilter ? 'bg-blue-500' : 'bg-gray-200'}`}
                onClick={() => setModerationSettings(prev => prev ? { ...prev, spamFilter: !prev.spamFilter } : null)}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${moderationSettings.spamFilter ? 'left-7' : 'left-1'}`}
                ></div>
              </div>
            </div>

            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h4 className="font-medium">Фильтр личных данных</h4>
                <p className="text-sm text-gray-600">Блокировать сообщения с личными данными</p>
              </div>
              <div
                className={`relative inline-block w-12 h-6 rounded-full cursor-pointer transition-colors ${moderationSettings.personalDataFilter ? 'bg-blue-500' : 'bg-gray-200'}`}
                onClick={() => setModerationSettings(prev => prev ? { ...prev, personalDataFilter: !prev.personalDataFilter } : null)}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${moderationSettings.personalDataFilter ? 'left-7' : 'left-1'}`}
                ></div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Размер очереди модерации</h4>
                <p className="text-sm text-gray-600">Максимальное количество сообщений</p>
              </div>
              <Input
                type="number"
                value={moderationSettings.moderationQueueSize.toString()}
                onChange={e => setModerationSettings(prev => prev ? {
                  ...prev,
                  moderationQueueSize: parseInt(e.target.value) || 10
                } : null)}
                className="w-20"
              />
            </div>
          </div>

          <Button
            onClick={handleSaveSettings}
            isLoading={loading}
            fullWidth
            className="mt-4 bg-blue-500 hover:bg-blue-600"
          >
            <span className="mr-1">💾</span> Сохранить настройки
          </Button>
        </Card>

        {stats && (
          <Card>
            <h3 className="font-bold mb-4">Статистика модерации</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Всего проверено:</p>
                <p className="font-bold">{stats.totalMessages}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ожидают проверки:</p>
                <p className="font-bold">{stats.pendingMessages}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Одобрено:</p>
                <p className="font-bold">{stats.approvedMessages}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Отклонено:</p>
                <p className="font-bold">{stats.rejectedMessages}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">За последние 24 часа:</p>
                <p className="font-bold">{stats.recentActionsCount}</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    )
  }

  // Отображение вкладки "Запрещенные слова"
  const renderBlockedWordsTab = () => {
    return (
      <div className="flex flex-col gap-4">
        <Card>
          <h3 className="font-bold mb-4">Запрещенные слова</h3>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Новое запрещенное слово"
              value={newBlockedWord}
              onChange={e => setNewBlockedWord(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleAddBlockedWord}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <span className="mr-1">+</span> Добавить
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {blockedWords.length === 0 ? (
              <p className="text-gray-500 py-2">Нет запрещенных слов</p>
            ) : (
              blockedWords.map((word, index) => (
                <div
                  key={index}
                  className="bg-gray-100 rounded-full px-3 py-1 flex items-center"
                >
                  <span>{word}</span>
                  <button
                    onClick={() => handleRemoveBlockedWord(word)}
                    className="ml-2 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold mb-4">
        Модерация сообщений
      </h1>

      {message && (
        <div className={`p-3 rounded-md ${messageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      {/* Навигационные табы */}
      <div className="flex overflow-x-auto border-b mb-4">
        <button
          className={`px-4 py-2 whitespace-nowrap ${activeTab === 'pending' ? 'border-b-2 border-blue-500 text-blue-500 font-medium' : 'text-gray-600'}`}
          onClick={() => setActiveTab('pending')}
        >
          Ожидают модерации {pendingMessages.length > 0 && <span className="ml-1 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">{pendingMessages.length}</span>}
        </button>
        <button
          className={`px-4 py-2 whitespace-nowrap ${activeTab === 'rejected' ? 'border-b-2 border-blue-500 text-blue-500 font-medium' : 'text-gray-600'}`}
          onClick={() => setActiveTab('rejected')}
        >
          Отклоненные
        </button>
        <button
          className={`px-4 py-2 whitespace-nowrap ${activeTab === 'settings' ? 'border-b-2 border-blue-500 text-blue-500 font-medium' : 'text-gray-600'}`}
          onClick={() => setActiveTab('settings')}
        >
          Настройки
        </button>
        <button
          className={`px-4 py-2 whitespace-nowrap ${activeTab === 'blocked-words' ? 'border-b-2 border-blue-500 text-blue-500 font-medium' : 'text-gray-600'}`}
          onClick={() => setActiveTab('blocked-words')}
        >
          Запрещенные слова
        </button>
      </div>

      {/* Содержимое активной вкладки */}
      {activeTab === 'pending' && renderPendingTab()}
      {activeTab === 'rejected' && renderRejectedTab()}
      {activeTab === 'settings' && renderSettingsTab()}
      {activeTab === 'blocked-words' && renderBlockedWordsTab()}

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={() => navigate('/direct/admin')}
          fullWidth
        >
          <span className="mr-2">⬅️</span> Назад в админ-панель
        </Button>

        <Button
          variant="outline"
          onClick={() => navigate('/')}
          fullWidth
        >
          <span className="mr-2">🏠</span> На главную
        </Button>
      </div>
    </div>
  )
}
