import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { getCurrentUser, saveUser, User, getUsers } from '../utils/user'
import { ThemeToggle } from '../components/ThemeToggle'
import { useNotificationService } from '../utils/notifications'
import { Input } from '../components/Input'
import { Switch } from '../components/Switch'
import { motion, AnimatePresence } from 'framer-motion'
import WebApp from '@twa-dev/sdk'

type PrivacyLevel = 'high' | 'medium' | 'low'
type NotificationSettings = {
  newMessages: boolean
  chatRequests: boolean
  systemUpdates: boolean
  sounds: boolean
}

export const UserSettings = () => {
  const navigate = useNavigate()
  const notifications = useNotificationService()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'general' | 'privacy' | 'notifications' | 'favorites'>('general')
  const [isSaving, setIsSaving] = useState(false)

  // Настройки пользователя
  const [privacyLevel, setPrivacyLevel] = useState<PrivacyLevel>('medium')
  const [showOnlineStatus, setShowOnlineStatus] = useState(true)
  const [showLastSeen, setShowLastSeen] = useState(true)
  const [allowProfileSearch, setAllowProfileSearch] = useState(true)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    newMessages: true,
    chatRequests: true,
    systemUpdates: true,
    sounds: true
  })

  // Персональные настройки
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [matchingPreference, setMatchingPreference] = useState<'similar' | 'diverse' | 'random'>('similar')

  // Избранные пользователи
  const [favorites, setFavorites] = useState<string[]>([])
  const [favoriteUsers, setFavoriteUsers] = useState<User[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // Адаптация под Telegram Mini App - включаем Main Button при монтировании
  useEffect(() => {
    if (WebApp.isExpanded) {
      WebApp.MainButton.setText('Сохранить настройки')
      WebApp.MainButton.onClick(handleSaveSettings)
      WebApp.MainButton.show()
    }

    return () => {
      if (WebApp.isExpanded) {
        WebApp.MainButton.offClick(handleSaveSettings)
        WebApp.MainButton.hide()
      }
    }
  }, [displayName, bio, favorites, privacyLevel, showOnlineStatus, showLastSeen,
    allowProfileSearch, matchingPreference, notificationSettings])

  // Загрузка данных пользователя
  useEffect(() => {
    const currentUser = getCurrentUser()
    if (!currentUser) {
      navigate('/')
      return
    }

    setUser(currentUser)
    setDisplayName(currentUser.name || '')
    setBio(currentUser.bio || '')
    setFavorites(currentUser.favorites || [])

    // Загрузка всех пользователей
    const users = getUsers().filter(u => u.id !== currentUser.id && !u.isBlocked && !u.isAdmin)
    setAllUsers(users)

    // Загрузка избранных пользователей
    if (currentUser.favorites && currentUser.favorites.length > 0) {
      const favUsers = users.filter(u => currentUser.favorites?.includes(u.id))
      setFavoriteUsers(favUsers)
    }

    // Загрузка сохраненных настроек (если они есть)
    const savedSettings = currentUser.settings || {}
    if (savedSettings.privacyLevel) setPrivacyLevel(savedSettings.privacyLevel)
    if (savedSettings.showOnlineStatus !== undefined) setShowOnlineStatus(savedSettings.showOnlineStatus)
    if (savedSettings.showLastSeen !== undefined) setShowLastSeen(savedSettings.showLastSeen)
    if (savedSettings.allowProfileSearch !== undefined) setAllowProfileSearch(savedSettings.allowProfileSearch)
    if (savedSettings.matchingPreference && 
        ['similar', 'diverse', 'random'].includes(savedSettings.matchingPreference)) {
      setMatchingPreference(savedSettings.matchingPreference as 'similar' | 'diverse' | 'random')
    }

    if (savedSettings.notifications) {
      setNotificationSettings({
        ...notificationSettings,
        ...savedSettings.notifications
      })
    }

    setLoading(false)
  }, [navigate])

  // Сохранение настроек
  const handleSaveSettings = async () => {
    if (!user) return

    try {
      setIsSaving(true)

      // Показываем индикатор загрузки в MainButton
      if (WebApp.isExpanded) {
        WebApp.MainButton.showProgress()
      }

      // Обновляем объект пользователя
      const updatedUser = {
        ...user,
        name: displayName,
        bio: bio,
        favorites: favorites,
        settings: {
          privacyLevel,
          showOnlineStatus,
          showLastSeen,
          allowProfileSearch,
          matchingPreference,
          notifications: notificationSettings
        }
      }

      // Сохраняем обновленного пользователя
      const success = await saveUser(updatedUser)

      if (success) {
        notifications.showSuccess('Настройки успешно сохранены')
        // Вибрация при успешном сохранении для tactile feedback
        if (WebApp.isExpanded) {
          WebApp.HapticFeedback.notificationOccurred('success')
        }
      } else {
        notifications.showError('Не удалось сохранить настройки')
        if (WebApp.isExpanded) {
          WebApp.HapticFeedback.notificationOccurred('error')
        }
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      notifications.showError('Произошла ошибка при сохранении настроек')
      if (WebApp.isExpanded) {
        WebApp.HapticFeedback.notificationOccurred('error')
      }
    } finally {
      setIsSaving(false)
      if (WebApp.isExpanded) {
        WebApp.MainButton.hideProgress()
      }
    }
  }

  // Установка предопределенного уровня приватности
  const handleSetPrivacyLevel = (level: PrivacyLevel) => {
    setPrivacyLevel(level)

    // Небольшая тактильная обратная связь при выборе
    if (WebApp.isExpanded) {
      WebApp.HapticFeedback.selectionChanged()
    }

    // Настройки по умолчанию для разных уровней приватности
    switch (level) {
      case 'high':
        setShowOnlineStatus(false)
        setShowLastSeen(false)
        setAllowProfileSearch(false)
        break
      case 'medium':
        setShowOnlineStatus(true)
        setShowLastSeen(false)
        setAllowProfileSearch(true)
        break
      case 'low':
        setShowOnlineStatus(true)
        setShowLastSeen(true)
        setAllowProfileSearch(true)
        break
    }
  }

  // Обработчик изменения настроек уведомлений
  const handleNotificationChange = (setting: keyof NotificationSettings, value: boolean) => {
    if (WebApp.isExpanded) {
      WebApp.HapticFeedback.impactOccurred('light')
    }

    setNotificationSettings(prev => ({
      ...prev,
      [setting]: value
    }))
  }

  // Обработчик добавления в избранное
  const handleToggleFavorite = (userId: string) => {
    if (WebApp.isExpanded) {
      WebApp.HapticFeedback.impactOccurred('medium')
    }

    if (favorites.includes(userId)) {
      // Удаление из избранного
      const newFavorites = favorites.filter(id => id !== userId)
      setFavorites(newFavorites)
      setFavoriteUsers(prevUsers => prevUsers.filter(user => user.id !== userId))
      notifications.showSuccess('Пользователь удален из избранного')
    } else {
      // Добавление в избранное
      const newFavorites = [...favorites, userId]
      setFavorites(newFavorites)

      const userToAdd = allUsers.find(user => user.id === userId)
      if (userToAdd) {
        setFavoriteUsers(prev => [...prev, userToAdd])
        notifications.showSuccess('Пользователь добавлен в избранное')
      }
    }
  }

  // Фильтрация пользователей по поисковому запросу
  const filteredUsers = searchQuery.trim() === ''
    ? allUsers
    : allUsers.filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.interests.some(interest => interest.toLowerCase().includes(searchQuery.toLowerCase()))
    )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-tg-hint-color">Загрузка настроек...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 max-w-xl mx-auto bg-tg-theme-bg-color text-tg-theme-text-color">
      <h1 className="text-xl font-bold mb-4 text-center">Настройки профиля</h1>

      {/* Вкладки в стиле Telegram */}
      <div className="flex overflow-x-auto scrollbar-none mb-4 px-1 pb-1">
        <button
          onClick={() => setActiveTab('general')}
          className={`mr-2 px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${activeTab === 'general'
              ? 'bg-tg-theme-button-color text-tg-theme-button-text-color'
              : 'bg-tg-theme-secondary-bg-color text-tg-theme-hint-color'
            }`}
        >
          Общие
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`mr-2 px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${activeTab === 'privacy'
              ? 'bg-tg-theme-button-color text-tg-theme-button-text-color'
              : 'bg-tg-theme-secondary-bg-color text-tg-theme-hint-color'
            }`}
        >
          Приватность
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`mr-2 px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${activeTab === 'notifications'
              ? 'bg-tg-theme-button-color text-tg-theme-button-text-color'
              : 'bg-tg-theme-secondary-bg-color text-tg-theme-hint-color'
            }`}
        >
          Уведомления
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${activeTab === 'favorites'
              ? 'bg-tg-theme-button-color text-tg-theme-button-text-color'
              : 'bg-tg-theme-secondary-bg-color text-tg-theme-hint-color'
            }`}
        >
          Избранное
        </button>
      </div>

      {/* Содержимое вкладок с анимацией */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {/* Общие настройки */}
          {activeTab === 'general' && (
            <Card className="mb-4 p-4 bg-tg-theme-secondary-bg-color border-0 shadow-sm">
              <h2 className="text-lg font-semibold mb-3 text-tg-theme-text-color">Общие настройки</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-1 text-tg-theme-hint-color">Отображаемое имя</label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ваше имя или никнейм"
                    fullWidth
                    className="bg-tg-theme-bg-color"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1 text-tg-theme-hint-color">О себе</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Расскажите немного о себе..."
                    className="w-full h-20 px-3 py-2 border rounded-md resize-none bg-tg-theme-bg-color text-tg-theme-text-color focus:outline-none focus:ring-2 focus:ring-tg-theme-button-color"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2 text-tg-theme-hint-color">Предпочтения подбора собеседников</label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={matchingPreference === 'similar' ? 'primary' : 'outline'}
                      onClick={() => setMatchingPreference('similar')}
                      className={`justify-center py-2 text-xs ${matchingPreference === 'similar'
                          ? 'bg-tg-theme-button-color text-tg-theme-button-text-color'
                          : 'border-tg-theme-button-color text-tg-theme-link-color'
                        }`}
                    >
                      <span className="mr-1">👥</span> Похожие
                    </Button>
                    <Button
                      variant={matchingPreference === 'diverse' ? 'primary' : 'outline'}
                      onClick={() => setMatchingPreference('diverse')}
                      className={`justify-center py-2 text-xs ${matchingPreference === 'diverse'
                          ? 'bg-tg-theme-button-color text-tg-theme-button-text-color'
                          : 'border-tg-theme-button-color text-tg-theme-link-color'
                        }`}
                    >
                      <span className="mr-1">🔄</span> Разные
                    </Button>
                    <Button
                      variant={matchingPreference === 'random' ? 'primary' : 'outline'}
                      onClick={() => setMatchingPreference('random')}
                      className={`justify-center py-2 text-xs ${matchingPreference === 'random'
                          ? 'bg-tg-theme-button-color text-tg-theme-button-text-color'
                          : 'border-tg-theme-button-color text-tg-theme-link-color'
                        }`}
                    >
                      <span className="mr-1">🎲</span> Любые
                    </Button>
                  </div>
                  <p className="text-xs text-tg-theme-hint-color mt-1">
                    Эта настройка влияет на подбор собеседников
                  </p>
                </div>

                <div>
                  <label className="block text-sm mb-1 text-tg-theme-hint-color">Тема оформления</label>
                  <div className="flex items-center">
                    <ThemeToggle className="mr-2" />
                    <span className="text-sm text-tg-theme-hint-color">
                      Переключить тему
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Настройки приватности */}
          {activeTab === 'privacy' && (
            <Card className="mb-4 p-4 bg-tg-theme-secondary-bg-color border-0 shadow-sm">
              <h2 className="text-lg font-semibold mb-3 text-tg-theme-text-color">Настройки приватности</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-md mb-2 text-tg-theme-hint-color">Уровень приватности</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant={privacyLevel === 'low' ? 'primary' : 'outline'}
                      onClick={() => handleSetPrivacyLevel('low')}
                      className={`justify-center py-2 text-xs ${privacyLevel === 'low'
                          ? 'bg-tg-theme-button-color text-tg-theme-button-text-color'
                          : 'border-tg-theme-button-color text-tg-theme-link-color'
                        }`}
                    >
                      <span className="mr-1">🟢</span> Низкий
                    </Button>
                    <Button
                      variant={privacyLevel === 'medium' ? 'primary' : 'outline'}
                      onClick={() => handleSetPrivacyLevel('medium')}
                      className={`justify-center py-2 text-xs ${privacyLevel === 'medium'
                          ? 'bg-tg-theme-button-color text-tg-theme-button-text-color'
                          : 'border-tg-theme-button-color text-tg-theme-link-color'
                        }`}
                    >
                      <span className="mr-1">🟡</span> Средний
                    </Button>
                    <Button
                      variant={privacyLevel === 'high' ? 'primary' : 'outline'}
                      onClick={() => handleSetPrivacyLevel('high')}
                      className={`justify-center py-2 text-xs ${privacyLevel === 'high'
                          ? 'bg-tg-theme-button-color text-tg-theme-button-text-color'
                          : 'border-tg-theme-button-color text-tg-theme-link-color'
                        }`}
                    >
                      <span className="mr-1">🔴</span> Высокий
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-sm">Показывать онлайн-статус</label>
                    <Switch
                      checked={showOnlineStatus}
                      onChange={setShowOnlineStatus}
                      className="data-[state=checked]:bg-tg-theme-button-color"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm">Показывать время посещения</label>
                    <Switch
                      checked={showLastSeen}
                      onChange={setShowLastSeen}
                      className="data-[state=checked]:bg-tg-theme-button-color"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-sm">Разрешить поиск профиля</label>
                    <Switch
                      checked={allowProfileSearch}
                      onChange={setAllowProfileSearch}
                      className="data-[state=checked]:bg-tg-theme-button-color"
                    />
                  </div>
                </div>

                <motion.div
                  className="mt-2 p-2 rounded-md bg-tg-theme-bg-color text-xs text-tg-theme-hint-color"
                  initial={{ opacity: 0.5, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="mb-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                    <strong>Низкий уровень:</strong> Все могут видеть ваш статус и время
                  </p>
                  <p className="mb-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1"></span>
                    <strong>Средний уровень:</strong> Виден только онлайн-статус
                  </p>
                  <p>
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1"></span>
                    <strong>Высокий уровень:</strong> Скрыты все данные активности
                  </p>
                </motion.div>
              </div>
            </Card>
          )}

          {/* Настройки уведомлений */}
          {activeTab === 'notifications' && (
            <Card className="mb-4 p-4 bg-tg-theme-secondary-bg-color border-0 shadow-sm">
              <h2 className="text-lg font-semibold mb-3 text-tg-theme-text-color">Настройки уведомлений</h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-tg-theme-bg-color">
                  <div>
                    <label className="text-sm block">Новые сообщения</label>
                    <span className="text-xs text-tg-theme-hint-color">Уведомления о новых сообщениях</span>
                  </div>
                  <Switch
                    checked={notificationSettings.newMessages}
                    onChange={(value) => handleNotificationChange('newMessages', value)}
                    className="data-[state=checked]:bg-tg-theme-button-color"
                  />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-tg-theme-bg-color">
                  <div>
                    <label className="text-sm block">Запросы на чат</label>
                    <span className="text-xs text-tg-theme-hint-color">Уведомления о запросах общения</span>
                  </div>
                  <Switch
                    checked={notificationSettings.chatRequests}
                    onChange={(value) => handleNotificationChange('chatRequests', value)}
                    className="data-[state=checked]:bg-tg-theme-button-color"
                  />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-tg-theme-bg-color">
                  <div>
                    <label className="text-sm block">Системные обновления</label>
                    <span className="text-xs text-tg-theme-hint-color">Информация о важных обновлениях</span>
                  </div>
                  <Switch
                    checked={notificationSettings.systemUpdates}
                    onChange={(value) => handleNotificationChange('systemUpdates', value)}
                    className="data-[state=checked]:bg-tg-theme-button-color"
                  />
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <label className="text-sm block">Звуковые уведомления</label>
                    <span className="text-xs text-tg-theme-hint-color">Звуки при получении уведомлений</span>
                  </div>
                  <Switch
                    checked={notificationSettings.sounds}
                    onChange={(value) => handleNotificationChange('sounds', value)}
                    className="data-[state=checked]:bg-tg-theme-button-color"
                  />
                </div>
              </div>

              <div className="mt-4 p-3 rounded-md bg-tg-theme-bg-color">
                <p className="text-xs text-tg-theme-hint-color flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Уведомления работают только при открытом приложении. Вы не будете получать уведомления, когда не активны в мини-приложении.
                </p>
              </div>
            </Card>
          )}

          {/* Управление избранными пользователями */}
          {activeTab === 'favorites' && (
            <Card className="mb-4 p-4 bg-tg-theme-secondary-bg-color border-0 shadow-sm">
              <h2 className="text-lg font-semibold mb-3 text-tg-theme-text-color">Избранные собеседники</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-tg-theme-hint-color mb-3">
                    Добавьте интересных собеседников в избранное для быстрого доступа и частого общения.
                  </p>

                  {/* Текущие избранные пользователи */}
                  {favoriteUsers.length > 0 ? (
                    <div className="mb-5">
                      <h3 className="text-sm font-medium mb-2 text-tg-theme-text-color flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Ваши избранные собеседники
                      </h3>
                      <div className="space-y-2">
                        {favoriteUsers.map(user => (
                          <motion.div
                            key={user.id}
                            className="flex items-center justify-between bg-tg-theme-bg-color p-3 rounded-lg"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="flex items-center">
                              <div className="h-9 w-9 bg-tg-theme-button-color/10 rounded-full flex items-center justify-center text-md font-bold text-tg-theme-button-color">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="ml-3">
                                <h4 className="font-medium text-sm">{user.name}</h4>
                                <div className="text-xs text-tg-theme-hint-color">
                                  {user.interests.slice(0, 2).join(', ')}
                                  {user.interests.length > 2 && ` и ещё ${user.interests.length - 2}`}
                                </div>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleToggleFavorite(user.id)}
                              className="bg-red-500 hover:bg-red-600 text-white text-xs py-1 px-2 h-auto"
                            >
                              Удалить
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 mb-4 bg-tg-theme-bg-color rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2 text-tg-theme-hint-color" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      <p className="text-tg-theme-hint-color">У вас пока нет избранных собеседников</p>
                      <p className="text-xs text-tg-theme-hint-color mt-1">
                        Добавьте интересных собеседников из списка ниже
                      </p>
                    </div>
                  )}

                  {/* Поиск пользователей для добавления в избранное */}
                  <div>
                    <h3 className="text-sm font-medium mb-2 text-tg-theme-text-color flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Найти собеседников
                    </h3>
                    <div className="mb-3">
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Поиск по имени или интересам"
                        fullWidth
                        className="bg-tg-theme-bg-color"
                      />
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-2 rounded-lg">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map(user => (
                          <motion.div
                            key={user.id}
                            className="flex items-center justify-between bg-tg-theme-bg-color p-3 rounded-lg"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="flex items-center">
                              <div className="h-9 w-9 bg-tg-theme-secondary-bg-color rounded-full flex items-center justify-center text-md font-bold">
                                {user.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="ml-3">
                                <h4 className="font-medium text-sm">{user.name}</h4>
                                <div className="text-xs text-tg-theme-hint-color">
                                  {user.interests.slice(0, 2).join(', ')}
                                  {user.interests.length > 2 && ` и ещё ${user.interests.length - 2}`}
                                </div>
                              </div>
                            </div>
                            <Button
                              onClick={() => handleToggleFavorite(user.id)}
                              className={`${favorites.includes(user.id)
                                  ? 'bg-red-500 hover:bg-red-600'
                                  : 'bg-tg-theme-button-color hover:bg-tg-theme-button-color/90'
                                } text-white text-xs py-1 px-2 h-auto`}
                            >
                              {favorites.includes(user.id) ? 'Удалить' : 'Добавить'}
                            </Button>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-4 bg-tg-theme-bg-color rounded-lg">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2 text-tg-theme-hint-color" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-tg-theme-hint-color">Пользователи не найдены</p>
                          <p className="text-xs text-tg-theme-hint-color mt-1">
                            Попробуйте изменить поисковый запрос
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Кнопки действий - только если нет MainButton от Telegram WebApp */}
      {!WebApp.isExpanded && (
        <div className="flex justify-end space-x-3 mt-4">
          <Button
            variant="outline"
            onClick={() => navigate('/profile')}
            className="border-tg-theme-button-color text-tg-theme-link-color"
          >
            Отмена
          </Button>
          <Button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="bg-tg-theme-button-color hover:bg-tg-theme-button-color/90 text-tg-theme-button-text-color"
          >
            {isSaving ? (
              <>
                <span className="animate-spin inline-block h-4 w-4 mr-2 border-2 border-t-transparent border-white rounded-full"></span>
                Сохранение...
              </>
            ) : 'Сохранить настройки'}
          </Button>
        </div>
      )}
    </div>
  )
}
