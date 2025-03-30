import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { Input } from '../../components/Input'
import {
  isAdmin,
  clearDatabase,
  setAdminByTelegramId,
  createAdminUserFromTelegram,
  getCurrentUser,
  getUsers,
  User,
  blockUser,
  unblockUser
} from '../../utils/user'
import { getUserCurrency, addCurrency } from '../../utils/store'

// Интерфейс для статистики системы
interface SystemStats {
  totalUsers: number
  activeUsers: number
  totalMessages: number
  activeChats: number
}

// Интерфейс для пользователя с блокировкой
interface UserWithActions extends User {
  isBlocked: boolean
}

export const AdminPanel = () => {
  const navigate = useNavigate()
  const [adminTelegramId, setAdminTelegramId] = useState<string>('5394381166')
  const [adminName, setAdminName] = useState<string>('Администратор')
  const [loading, setLoading] = useState<boolean>(false)
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [activeTab, setActiveTab] = useState<'users' | 'stats' | 'settings' | 'bot'>('users')
  const [usersList, setUsersList] = useState<UserWithActions[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalMessages: 0,
    activeChats: 0
  })
  const [userToEdit, setUserToEdit] = useState<UserWithActions | null>(null)
  const [editPoints, setEditPoints] = useState<number>(0)

  // В разделе состояний компонента добавим состояния для полей формы
  const [maxChatsLimit, setMaxChatsLimit] = useState<string>("10")
  const [dailyBonus, setDailyBonus] = useState<string>("5")
  const [moderationEnabled, setModerationEnabled] = useState<boolean>(false)
  const [welcomeMessage, setWelcomeMessage] = useState<string>("Привет! Я анонимный чат-бот. Я помогу тебе найти собеседника для анонимного общения.")
  const [keywordsInput, setKeywordsInput] = useState<string>("привет, помощь, начать")
  const [botResponse, setBotResponse] = useState<string>("Привет! Чем я могу помочь? Напиши 'помощь' для получения списка команд.")

  // Проверка прав администратора
  useEffect(() => {
    if (!isAdmin()) {
      WebApp.showAlert('У вас нет прав администратора')
      navigate('/')
    }

    // Загружаем данные пользователей
    loadUsers()

    // Загружаем статистику
    calculateSystemStats()
  }, [navigate])

  // Загрузка пользователей
  const loadUsers = () => {
    try {
      const users = getUsers()

      // Преобразуем пользователей в формат с дополнительными действиями
      const usersWithActions: UserWithActions[] = users.map(user => ({
        ...user,
        isBlocked: user.isBlocked === true // Проверяем, заблокирован ли пользователь
      }))

      setUsersList(usersWithActions)
      setSystemStats(prev => ({
        ...prev,
        totalUsers: users.length
      }))
    } catch (error) {
      console.error('Ошибка при загрузке пользователей:', error)
      setMessage('Ошибка при загрузке пользователей')
      setMessageType('error')
    }
  }

  // Расчет системной статистики
  const calculateSystemStats = () => {
    // В реальном приложении здесь будет запрос к API
    // Для демонстрации используем моковые данные
    const users = getUsers()
    const activeUsers = users.filter(user => {
      // Считаем активными пользователей, которые заходили за последние 7 дней
      const lastWeek = Date.now() - 7 * 24 * 60 * 60 * 1000 // 7 дней назад
      return user.lastActive > lastWeek
    }).length

    // Подсчитываем примерное количество сообщений и чатов
    // В реальном приложении эти данные будут из базы данных
    let totalMessages = 0
    let activeChats = 0

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('messages_')) {
        const messages = JSON.parse(localStorage.getItem(key) || '[]')
        totalMessages += messages.length
        if (messages.length > 0) {
          activeChats++
        }
      }
    }

    setSystemStats({
      totalUsers: users.length,
      activeUsers,
      totalMessages,
      activeChats
    })
  }

  // Переход на страницу сброса базы данных
  const handleClearDatabase = () => {
    navigate('/reset-database')
  }

  // Переход на страницу управления магазином
  const handleGoToStoreManagement = () => {
    navigate('/admin/store-management')
  }

  // Обработчик назначения администратора
  const handleSetAdmin = () => {
    setLoading(true)
    setMessage(null)

    try {
      if (!adminTelegramId) {
        setMessage('Введите Telegram ID')
        setMessageType('error')
        setLoading(false)
        return
      }

      const result = setAdminByTelegramId(adminTelegramId)

      if (result) {
        setMessage(`Пользователь с Telegram ID ${adminTelegramId} назначен администратором`)
        setMessageType('success')
      } else {
        // Если пользователя не существует, создаем нового с правами администратора
        createAdminUserFromTelegram(adminTelegramId, adminName)
        setMessage(`Создан новый администратор с Telegram ID ${adminTelegramId}`)
        setMessageType('success')

        // Обновляем список пользователей
        loadUsers()
      }
    } catch (error) {
      setMessage(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  // Блокировка/разблокировка пользователя
  const handleToggleUserBlock = (userId: string, isCurrentlyBlocked: boolean) => {
    try {
      if (isCurrentlyBlocked) {
        unblockUser(userId)
        setMessage(`Пользователь разблокирован`)
      } else {
        blockUser(userId)
        setMessage(`Пользователь заблокирован`)
      }
      setMessageType('success')

      // Обновляем список пользователей
      loadUsers()
    } catch (error) {
      setMessage(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
      setMessageType('error')
    }
  }

  // Начать редактирование баланса пользователя
  const handleStartEditBalance = (user: UserWithActions) => {
    setUserToEdit(user)

    // Получаем текущий баланс пользователя
    const userCurrency = getUserCurrency(user.id)
    setEditPoints(userCurrency.balance)
  }

  // Сохранить баланс пользователя
  const handleSaveBalance = () => {
    if (!userToEdit) return

    try {
      // Вычисляем разницу для добавления
      const currentBalance = getUserCurrency(userToEdit.id).balance
      const pointsToAdd = editPoints - currentBalance

      // Добавляем очки пользователю
      addCurrency(userToEdit.id, pointsToAdd, `Изменено администратором: ${getCurrentUser()?.name || 'admin'}`)

      setMessage(`Баланс пользователя ${userToEdit.name} изменен`)
      setMessageType('success')
      setUserToEdit(null)
    } catch (error) {
      setMessage(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
      setMessageType('error')
    }
  }

  // Поиск пользователей
  const filteredUsers = usersList.filter(user => {
    const searchTermLower = searchTerm.toLowerCase()
    const nameMatch = user.name.toLowerCase().includes(searchTermLower)
    const telegramMatch = user.telegramData?.telegramId?.toLowerCase().includes(searchTermLower) || false
    const usernameMatch = user.telegramData?.username?.toLowerCase().includes(searchTermLower) || false

    return nameMatch || telegramMatch || usernameMatch
  })

  // Отображение вкладки "Пользователи"
  const renderUsersTab = () => (
    <div className="flex flex-col gap-4">
      <div className="mb-4">
        <Input
          placeholder="Поиск пользователя по имени или Telegram ID"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          fullWidth
        />
      </div>

      {filteredUsers.length === 0 ? (
        <Card>
          <p className="text-center py-4">Пользователи не найдены</p>
        </Card>
      ) : (
        filteredUsers.map(user => (
          <Card key={user.id} className={`${user.isBlocked ? 'bg-red-50' : ''}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-3">
                  {user.name[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold flex items-center">
                    {user.name}
                    {user.isAdmin && (
                      <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                        Админ
                      </span>
                    )}
                    {user.isBlocked && (
                      <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                        Заблокирован
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-600">
                    ID: {user.id.substring(0, 8)}...
                    {user.telegramData?.telegramId ? ` | Telegram: ${user.telegramData.telegramId}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                {userToEdit?.id === user.id ? (
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Input
                      type="number"
                      placeholder="Баланс"
                      value={editPoints}
                      onChange={e => setEditPoints(parseInt(e.target.value) || 0)}
                      className="w-24"
                    />
                    <Button
                      onClick={handleSaveBalance}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <span className="mr-1">💾</span> Сохранить
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setUserToEdit(null)}
                    >
                      Отмена
                    </Button>
                  </div>
                ) : (
                  <>
                    <Button
                      onClick={() => handleToggleUserBlock(user.id, user.isBlocked)}
                      className={user.isBlocked ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}
                      disabled={user.isAdmin}
                    >
                      {user.isBlocked ? (
                        <><span className="mr-1">🔓</span> Разблокировать</>
                      ) : (
                        <><span className="mr-1">🔒</span> Заблокировать</>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleStartEditBalance(user)}
                      className="bg-blue-500 hover:bg-blue-600"
                    >
                      <span className="mr-1">⭐</span> Баланс
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  )

  // Отображение вкладки "Статистика"
  const renderStatsTab = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
      <Card>
        <div className="flex flex-col items-center py-4">
          <div className="text-3xl font-bold text-blue-500 mb-2">{systemStats.totalUsers}</div>
          <div className="text-sm text-gray-600">Всего пользователей</div>
        </div>
      </Card>
      <Card>
        <div className="flex flex-col items-center py-4">
          <div className="text-3xl font-bold text-green-500 mb-2">{systemStats.activeUsers}</div>
          <div className="text-sm text-gray-600">Активных пользователей</div>
        </div>
      </Card>
      <Card>
        <div className="flex flex-col items-center py-4">
          <div className="text-3xl font-bold text-purple-500 mb-2">{systemStats.totalMessages}</div>
          <div className="text-sm text-gray-600">Всего сообщений</div>
        </div>
      </Card>
      <Card>
        <div className="flex flex-col items-center py-4">
          <div className="text-3xl font-bold text-yellow-500 mb-2">{systemStats.activeChats}</div>
          <div className="text-sm text-gray-600">Активных чатов</div>
        </div>
      </Card>

      <Card className="sm:col-span-2">
        <h3 className="font-bold mb-2">Статистика по дням</h3>
        <div className="h-40 flex items-center justify-center bg-gray-100 rounded">
          <p className="text-gray-500">График активности (будет добавлен в следующем обновлении)</p>
        </div>
      </Card>

      <Card className="sm:col-span-2">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold">Модерация сообщений</h3>
          <Button
            onClick={() => navigate('/moderation')}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <span className="mr-2">👁️</span> Открыть модерацию
          </Button>
        </div>
        <div className="text-sm text-gray-600">
          Инструменты для модерации сообщений пользователей, настройки фильтров и управление запрещенными словами.
        </div>
      </Card>

      <Card className="sm:col-span-2">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold">Управление магазином</h3>
          <Button
            onClick={handleGoToStoreManagement}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <span className="mr-2">🛒</span> Управление товарами
          </Button>
        </div>
        <div className="text-sm text-gray-600">
          Добавляйте и редактируйте товары, устанавливайте скидки и акции, загружайте новые изображения для магазина.
        </div>
      </Card>
    </div>
  )

  // Отображение вкладки "Настройки"
  const renderSettingsTab = () => (
    <div className="flex flex-col gap-4">
      <Card>
        <h3 className="font-bold mb-4">Управление базой данных</h3>

        <div className="mb-6">
          <h3 className="font-medium mb-2">Очистка базы данных</h3>
          <p className="text-sm text-gray-600 mb-3">
            Это действие удалит все данные пользователей, чаты, сообщения и настройки.
          </p>
          <Button
            variant="danger"
            onClick={handleClearDatabase}
            isLoading={loading}
            fullWidth
            className="bg-red-500 hover:bg-red-600"
          >
            <span className="mr-2">🗑️</span> Очистить базу данных
          </Button>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-medium mb-2">Управление администраторами</h3>

          <div className="flex flex-col gap-3 mb-4">
            <Input
              label="Telegram ID"
              placeholder="Введите Telegram ID"
              value={adminTelegramId}
              onChange={(e) => setAdminTelegramId(e.target.value)}
              fullWidth
            />

            <Input
              label="Имя администратора"
              placeholder="Введите имя"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              fullWidth
            />
          </div>

          <Button
            onClick={handleSetAdmin}
            isLoading={loading}
            fullWidth
            className="bg-blue-500 hover:bg-blue-600"
          >
            <span className="mr-2">👑</span> Назначить администратором
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="font-bold mb-4">Системные настройки</h3>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h4 className="font-medium">Модерация сообщений</h4>
              <p className="text-sm text-gray-600">Автоматическая проверка сообщений</p>
            </div>
            <div
              className={`relative inline-block w-12 h-6 ${moderationEnabled ? 'bg-green-500' : 'bg-gray-300'} rounded-full cursor-pointer`}
              onClick={() => setModerationEnabled(!moderationEnabled)}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${moderationEnabled ? 'right-1' : 'left-1'}`}
              ></div>
            </div>
          </div>

          <div className="flex items-center justify-between border-b pb-2">
            <div>
              <h4 className="font-medium">Максимальное количество чатов</h4>
              <p className="text-sm text-gray-600">Ограничение на пользователя</p>
            </div>
            <Input
              type="number"
              value={maxChatsLimit}
              onChange={(e) => setMaxChatsLimit(e.target.value)}
              className="w-20"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Ежедневный бонус</h4>
              <p className="text-sm text-gray-600">Количество монет</p>
            </div>
            <Input
              type="number"
              value={dailyBonus}
              onChange={(e) => setDailyBonus(e.target.value)}
              className="w-20"
            />
          </div>
        </div>
      </Card>
    </div>
  )

  // Отображение вкладки "Бот"
  const renderBotTab = () => (
    <div className="flex flex-col gap-4">
      <Card>
        <h3 className="font-bold mb-4">Настройки бота</h3>

        <div className="mb-6">
          <h4 className="font-medium mb-2">Приветственное сообщение</h4>
          <Input
            as="textarea"
            rows={4}
            placeholder="Введите текст приветственного сообщения"
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            fullWidth
          />
          <Button
            className="mt-2 bg-blue-500 hover:bg-blue-600"
            fullWidth
          >
            Сохранить
          </Button>
        </div>

        <div className="mb-6 border-t pt-4">
          <h4 className="font-medium mb-2">Автоматические ответы</h4>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Ключевые слова (через запятую)</label>
            <Input
              placeholder="привет, помощь, начать"
              value={keywordsInput}
              onChange={(e) => setKeywordsInput(e.target.value)}
              fullWidth
            />
          </div>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Ответ бота</label>
            <Input
              as="textarea"
              rows={3}
              placeholder="Введите ответ бота на ключевые слова"
              value={botResponse}
              onChange={(e) => setBotResponse(e.target.value)}
              fullWidth
            />
          </div>
          <div className="flex gap-2">
            <Button
              className="bg-blue-500 hover:bg-blue-600"
              fullWidth
            >
              Добавить
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600"
              fullWidth
            >
              Удалить
            </Button>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Статус бота</h4>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm">Бот активен</p>
              <p className="text-xs text-gray-500">Пользователи могут взаимодействовать с ботом</p>
            </div>
            <div
              className={`relative inline-block w-12 h-6 ${moderationEnabled ? 'bg-green-500' : 'bg-gray-300'} rounded-full cursor-pointer`}
              onClick={() => setModerationEnabled(!moderationEnabled)}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${moderationEnabled ? 'right-1' : 'left-1'}`}
              ></div>
            </div>
          </div>
          <Button
            className="bg-blue-500 hover:bg-blue-600"
            fullWidth
          >
            <span className="mr-2">🔄</span> Перезапустить бота
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="font-bold mb-4">Запланированные сообщения</h3>
        <div className="mb-4">
          <div className="flex justify-between mb-3">
            <h4 className="font-medium">Новое запланированное сообщение</h4>
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Текст сообщения</label>
            <Input
              as="textarea"
              rows={3}
              placeholder="Введите текст сообщения"
              fullWidth
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-sm font-medium mb-1">Дата отправки</label>
              <Input
                type="date"
                fullWidth
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Время отправки</label>
              <Input
                type="time"
                fullWidth
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Целевая аудитория</label>
            <select
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Все пользователи</option>
              <option value="active">Активные пользователи</option>
              <option value="inactive">Неактивные пользователи</option>
              <option value="premium">Премиум пользователи</option>
            </select>
          </div>

          <Button
            className="bg-blue-500 hover:bg-blue-600"
            fullWidth
          >
            <span className="mr-2">📅</span> Запланировать сообщение
          </Button>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium mb-3">Запланированные сообщения</h4>
          <div className="bg-gray-100 p-3 rounded-md mb-2 flex justify-between items-center">
            <div>
              <p className="font-medium">Уведомление о новых функциях</p>
              <p className="text-xs text-gray-600">20 марта 2025, 10:00</p>
            </div>
            <Button
              variant="outline"
              className="text-red-500 hover:bg-red-50"
            >
              Отменить
            </Button>
          </div>
          <div className="bg-gray-100 p-3 rounded-md flex justify-between items-center">
            <div>
              <p className="font-medium">Напоминание о скидках</p>
              <p className="text-xs text-gray-600">25 марта 2025, 15:30</p>
            </div>
            <Button
              variant="outline"
              className="text-red-500 hover:bg-red-50"
            >
              Отменить
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold mb-4">
        Панель администратора
      </h1>

      {message && (
        <div className={`p-3 rounded-md ${messageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      {/* Навигационные табы */}
      <div className="flex border-b mb-4 overflow-x-auto">
        <button
          className={`px-4 py-2 ${activeTab === 'users' ? 'border-b-2 border-blue-500 text-blue-500 font-medium' : 'text-gray-600'}`}
          onClick={() => setActiveTab('users')}
        >
          Пользователи
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'stats' ? 'border-b-2 border-blue-500 text-blue-500 font-medium' : 'text-gray-600'}`}
          onClick={() => setActiveTab('stats')}
        >
          Статистика
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'settings' ? 'border-b-2 border-blue-500 text-blue-500 font-medium' : 'text-gray-600'}`}
          onClick={() => setActiveTab('settings')}
        >
          Настройки
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'bot' ? 'border-b-2 border-blue-500 text-blue-500 font-medium' : 'text-gray-600'}`}
          onClick={() => setActiveTab('bot')}
        >
          Управление ботом
        </button>
      </div>

      {/* Содержимое активной вкладки */}
      {activeTab === 'users' && renderUsersTab()}
      {activeTab === 'stats' && renderStatsTab()}
      {activeTab === 'settings' && renderSettingsTab()}
      {activeTab === 'bot' && renderBotTab()}

      <Button
        variant="outline"
        onClick={() => navigate('/')}
        fullWidth
      >
        <span className="mr-2">🏠</span> На главную
      </Button>
    </div>
  )
}
