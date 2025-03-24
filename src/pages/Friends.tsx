import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import WebApp from '@twa-dev/sdk'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { useNotificationService } from '../utils/notifications'
import { getCurrentUser, getCurrentUserId, getUsers, User, saveUser } from '../utils/user'

// Расширяем интерфейс User для добавления необходимых свойств
interface FriendUser extends User {
  isOnline?: boolean;
  lastSeen?: string | Date;
  name: string; // Обеспечиваем, что name всегда существует
  interests: string[]; // Обеспечиваем, что interests всегда существует
}

type FriendFilter = 'all' | 'online' | 'recent' | 'favorites'

export const Friends = () => {
  const navigate = useNavigate()
  const notifications = useNotificationService()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [friends, setFriends] = useState<FriendUser[]>([])
  const [filteredFriends, setFilteredFriends] = useState<FriendUser[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FriendFilter>('all')
  const [selectedFriend, setSelectedFriend] = useState<FriendUser | null>(null)
  const [friendRequests, setFriendRequests] = useState<FriendUser[]>([])
  const [showRequestsCount, setShowRequestsCount] = useState(0)
  const [showRequests, setShowRequests] = useState(false)
  const [processingIds, setProcessingIds] = useState<string[]>([])

  // Загрузка данных
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Получаем текущего пользователя
        const user = getCurrentUser();
        // Отладочная информация
        console.log('Current user from storage:', user);
        console.log('Current user ID from storage:', getCurrentUserId());

        if (!user) {
          console.error('No user found in storage, redirecting to registration');
          notifications.showError('Пользователь не найден. Перенаправление на регистрацию...');
          navigate('/');
          return;
        }

        setCurrentUser(user);

        // Все пользователи (кроме текущего)
        const allUsers = getUsers().filter(u => u.id !== user.id && !u.isBlocked);

        // Добавляем дополнительные поля в объекты пользователей
        const enhancedUsers: FriendUser[] = allUsers.map(user => ({
          ...user,
          name: user.name || 'Пользователь', // Гарантируем наличие имени
          interests: user.interests || [], // Гарантируем наличие интересов
          isOnline: Math.random() > 0.5, // Имитация онлайн-статуса
          lastSeen: Math.random() > 0.5 ? 'вчера' : new Date().toISOString() // Имитация времени последнего посещения
        }));

        // Друзья
        const userFriends = enhancedUsers.filter(u =>
          (user.friends && Array.isArray(user.friends) && user.friends.includes(u.id)) ||
          (Math.random() > 0.5 && u.id.length > 5) // Временная логика для демонстрации
        );
        setFriends(userFriends);

        // Остальной код без изменений
        // Имитация запросов в друзья
        const requests = enhancedUsers.filter(u =>
          !userFriends.find(f => f.id === u.id) &&
          Math.random() > 0.8
        ).slice(0, 5) // Ограничиваем числом 5 для демонстрации
        setFriendRequests(requests)
        setShowRequestsCount(requests.length)

        setLoading(false)
      } catch (error) {
        console.error('Error loading friends data:', error)
        notifications.showError('Не удалось загрузить данные')
        // Устанавливаем пустые массивы вместо undefined
        setFriends([])
        setFriendRequests([])
        setFilteredFriends([])
        setShowRequestsCount(0)
        setLoading(false)
      }
    }

    fetchData()
  }, [navigate, notifications])

  // Фильтрация друзей
  useEffect(() => {
    if (!friends || !Array.isArray(friends) || friends.length === 0) {
      setFilteredFriends([])
      return
    }

    let result = [...friends]

    // Применяем поиск если есть
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(friend =>
        (friend.name && friend.name.toLowerCase().includes(query)) ||
        (friend.interests && Array.isArray(friend.interests) && friend.interests.some(interest =>
          interest && interest.toLowerCase().includes(query)
        ))
      )
    }

    // Применяем фильтры
    switch (activeFilter) {
      case 'online':
        result = result.filter(friend => friend.isOnline)
        break
      case 'recent':
        // В реальном приложении здесь была бы логика сортировки по последней активности
        result = result.sort(() => Math.random() - 0.5) // Для демонстрации
        break
      case 'favorites':
        result = result.filter(friend =>
          currentUser &&
          currentUser.favorites &&
          Array.isArray(currentUser.favorites) &&
          currentUser.favorites.includes(friend.id)
        )
        break
      default:
        // Фильтр "все" - ничего не делаем
        break
    }

    setFilteredFriends(result)
  }, [friends, searchQuery, activeFilter, currentUser])

  // Отправка сообщения другу
  const handleSendMessage = (friendId: string) => {
    if (WebApp.isExpanded) {
      WebApp.HapticFeedback.impactOccurred('medium')
    }

    // В реальном приложении здесь был бы код для перехода в чат
    notifications.showSuccess('Переход в чат...')
    setTimeout(() => {
      navigate(`/chat/${friendId}`)
    }, 500)
  }

  // Удаление из друзей
  const handleRemoveFriend = async (friendId: string) => {
    if (!currentUser) return

    try {
      setProcessingIds(prev => [...prev, friendId])

      if (WebApp.isExpanded) {
        WebApp.HapticFeedback.notificationOccurred('warning')
      }

      // В реальном приложении здесь был бы API запрос
      await new Promise(resolve => setTimeout(resolve, 500)) // Имитация задержки

      // Обновить локальное состояние
      const updatedFriends = friends.filter(f => f.id !== friendId)
      setFriends(updatedFriends)

      // Обновляем пользователя
      const updatedUser = {
        ...currentUser,
        friends: currentUser.friends?.filter(id => id !== friendId) || []
      }

      await saveUser(updatedUser)
      setCurrentUser(updatedUser)

      notifications.showSuccess('Пользователь удален из друзей')
    } catch (error) {
      console.error('Error removing friend:', error)
      notifications.showError('Не удалось удалить из друзей')
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== friendId))
    }
  }

  // Добавление в избранное
  const handleToggleFavorite = async (friendId: string) => {
    if (!currentUser) return

    try {
      setProcessingIds(prev => [...prev, friendId])

      if (WebApp.isExpanded) {
        WebApp.HapticFeedback.impactOccurred('light')
      }

      // В реальном приложении здесь был бы API запрос
      await new Promise(resolve => setTimeout(resolve, 300)) // Имитация задержки

      // Проверяем есть ли друг в избранном
      const isFavorite = currentUser.favorites?.includes(friendId) || false

      // Обновляем пользователя
      const updatedFavorites = isFavorite
        ? currentUser.favorites?.filter(id => id !== friendId) || []
        : [...(currentUser.favorites || []), friendId]

      const updatedUser = {
        ...currentUser,
        favorites: updatedFavorites
      }

      await saveUser(updatedUser)
      setCurrentUser(updatedUser)

      notifications.showSuccess(
        isFavorite
          ? 'Пользователь удален из избранного'
          : 'Пользователь добавлен в избранное'
      )
    } catch (error) {
      console.error('Error toggling favorite:', error)
      notifications.showError('Не удалось изменить избранное')
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== friendId))
    }
  }

  // Ответ на запрос дружбы
  const handleFriendRequest = async (friendId: string, accept: boolean) => {
    if (!currentUser) return

    try {
      setProcessingIds(prev => [...prev, friendId])

      if (WebApp.isExpanded) {
        WebApp.HapticFeedback.impactOccurred('medium')
      }

      // В реальном приложении здесь был бы API запрос
      await new Promise(resolve => setTimeout(resolve, 500)) // Имитация задержки

      if (accept) {
        // Принимаем запрос, добавляем в друзья
        const newFriend = friendRequests.find(req => req.id === friendId)
        if (newFriend) {
          setFriends(prev => [...prev, newFriend])
        }

        // Обновляем пользователя
        const updatedUser = {
          ...currentUser,
          friends: [...(currentUser.friends || []), friendId]
        }

        await saveUser(updatedUser)
        setCurrentUser(updatedUser)

        notifications.showSuccess('Запрос принят, пользователь добавлен в друзья')
      } else {
        notifications.showInfo('Запрос отклонен')
      }

      // Удаляем запрос из списка
      setFriendRequests(prev => prev.filter(req => req.id !== friendId))
      setShowRequestsCount(prev => prev - 1)
    } catch (error) {
      console.error('Error handling friend request:', error)
      notifications.showError('Не удалось обработать запрос')
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== friendId))
    }
  }

  // Открытие профиля
  const handleOpenProfile = (friend: FriendUser) => {
    setSelectedFriend(friend)

    if (WebApp.isExpanded) {
      WebApp.HapticFeedback.impactOccurred('light')
    }
  }

  // Закрытие профиля
  const handleCloseProfile = () => {
    setSelectedFriend(null)
  }

  // Обработчик события для кнопки "Написать" с предотвращением всплытия
  const handleMessageButtonClick = (e: React.MouseEvent, friendId: string) => {
    e.stopPropagation();
    handleSendMessage(friendId);
  };

  // Функция для перехода на страницу обучения
  const handleGoToBeginnerGuide = () => {
    navigate('/beginner-guide');  // Убедимся, что здесь правильный путь
  };

  // Отображение состояния загрузки
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-tg-theme-button-color border-tg-theme-secondary-bg-color rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-tg-theme-hint-color">Загрузка друзей...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 max-w-xl mx-auto bg-tg-theme-bg-color text-tg-theme-text-color">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Друзья</h1>

        {showRequestsCount > 0 && (
          <Button
            onClick={() => setShowRequests(!showRequests)}
            className={`flex items-center text-xs py-1 px-3 h-8 ${showRequests
              ? 'bg-tg-theme-secondary-bg-color text-tg-theme-text-color'
              : 'bg-tg-theme-button-color text-tg-theme-button-text-color'
              }`}
          >
            <span className="mr-1">
              {showRequests ? 'Скрыть запросы' : 'Запросы'}
            </span>
            <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {showRequestsCount}
            </span>
          </Button>
        )}
      </div>

      {/* Запросы в друзья */}
      <AnimatePresence>
        {showRequests && showRequestsCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden mb-4"
          >
            <Card className="mb-2 p-3 bg-tg-theme-secondary-bg-color border-0 shadow-sm">
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Запросы в друзья
              </h3>

              <div className="space-y-2">
                {friendRequests.map(request => (
                  <motion.div
                    key={request.id}
                    className="flex items-center justify-between bg-tg-theme-bg-color p-2 rounded-lg"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-tg-theme-secondary-bg-color flex items-center justify-center font-bold text-lg">
                        {request.name && request.name.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="ml-3">
                        <h4 className="font-medium text-sm">{request.name || 'Пользователь'}</h4>
                        <p className="text-xs text-tg-theme-hint-color">
                          {(request.interests && request.interests.length > 0) ? request.interests.slice(0, 2).join(', ') : 'Нет общих интересов'}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        onClick={() => handleFriendRequest(request.id, false)}
                        className="bg-tg-theme-secondary-bg-color text-tg-theme-hint-color text-xs py-1 px-2 h-8"
                        disabled={processingIds.includes(request.id)}
                      >
                        {processingIds.includes(request.id) ? (
                          <span className="inline-block w-4 h-4 border-2 border-t-transparent border-tg-theme-hint-color rounded-full animate-spin"></span>
                        ) : 'Отклонить'}
                      </Button>
                      <Button
                        onClick={() => handleFriendRequest(request.id, true)}
                        className="bg-tg-theme-button-color text-tg-theme-button-text-color text-xs py-1 px-2 h-8"
                        disabled={processingIds.includes(request.id)}
                      >
                        {processingIds.includes(request.id) ? (
                          <span className="inline-block w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
                        ) : 'Принять'}
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Поиск и фильтры */}
      <div className="mb-4">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск друзей..."
          fullWidth
          className="bg-tg-theme-secondary-bg-color mb-3"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-tg-theme-hint-color" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />

        <div className="flex overflow-x-auto scrollbar-none pb-1">
          <button
            onClick={() => setActiveFilter('all')}
            className={`mr-2 px-4 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${activeFilter === 'all'
              ? 'bg-tg-theme-button-color text-tg-theme-button-text-color'
              : 'bg-tg-theme-secondary-bg-color text-tg-theme-hint-color'
              }`}
          >
            Все
          </button>
          <button
            onClick={() => setActiveFilter('online')}
            className={`mr-2 px-4 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${activeFilter === 'online'
              ? 'bg-tg-theme-button-color text-tg-theme-button-text-color'
              : 'bg-tg-theme-secondary-bg-color text-tg-theme-hint-color'
              }`}
          >
            В сети
          </button>
          <button
            onClick={() => setActiveFilter('recent')}
            className={`mr-2 px-4 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${activeFilter === 'recent'
              ? 'bg-tg-theme-button-color text-tg-theme-button-text-color'
              : 'bg-tg-theme-secondary-bg-color text-tg-theme-hint-color'
              }`}
          >
            Недавние
          </button>
          <button
            onClick={() => setActiveFilter('favorites')}
            className={`px-4 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${activeFilter === 'favorites'
              ? 'bg-tg-theme-button-color text-tg-theme-button-text-color'
              : 'bg-tg-theme-secondary-bg-color text-tg-theme-hint-color'
              }`}
          >
            Избранные
          </button>
        </div>
      </div>

      {/* Список друзей */}
      <div className="space-y-2">
        {filteredFriends.length > 0 ? (
          filteredFriends.map(friend => (
            <motion.div
              key={friend.id}
              className="flex items-center justify-between bg-tg-theme-secondary-bg-color p-3 rounded-lg"
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              onClick={() => handleOpenProfile(friend)}
            >
              <div className="flex items-center">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full bg-tg-theme-bg-color flex items-center justify-center font-bold text-xl text-tg-theme-button-color">
                    {friend.name && friend.name.charAt(0).toUpperCase() || '?'}
                  </div>
                  {friend.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-tg-theme-secondary-bg-color"></span>
                  )}
                </div>
                <div className="ml-3">
                  <div className="flex items-center">
                    <h4 className="font-medium">
                      {friend.name}
                    </h4>
                    {currentUser?.favorites?.includes(friend.id) && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex items-center text-xs text-tg-theme-hint-color">
                    <span className="mr-2">
                      {friend.interests?.slice(0, 2).join(', ') || 'Нет интересов'}
                    </span>
                    {!friend.isOnline && friend.lastSeen && (
                      <span className="text-xs text-tg-theme-hint-color">
                        {typeof friend.lastSeen === 'string'
                          ? friend.lastSeen
                          : 'Был(а) недавно'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleMessageButtonClick(e, friend.id)}
                className="bg-tg-theme-button-color hover:bg-tg-theme-button-color/90 text-tg-theme-button-text-color text-xs py-1 px-3 h-8"
              >
                Написать
              </Button>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8 bg-tg-theme-secondary-bg-color rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 text-tg-theme-hint-color" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-tg-theme-text-color font-medium">Друзья не найдены</p>
            <p className="text-xs text-tg-theme-hint-color mt-1">
              {searchQuery.trim()
                ? 'Попробуйте изменить поисковый запрос'
                : activeFilter === 'favorites'
                  ? 'У вас нет избранных друзей'
                  : activeFilter === 'online'
                    ? 'Нет друзей в сети'
                    : 'Добавьте друзей, чтобы они появились здесь'}
            </p>
          </div>
        )}
      </div>

      {/* Модальное окно с профилем друга */}
      <AnimatePresence>
        {selectedFriend && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseProfile}
          >
            <motion.div
              className="w-full max-w-md bg-tg-theme-bg-color rounded-lg overflow-hidden"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Шапка профиля */}
              <div className="relative h-32 bg-gradient-to-r from-tg-theme-button-color/80 to-tg-theme-button-color">
                <button
                  className="absolute top-3 right-3 w-8 h-8 bg-black/20 rounded-full flex items-center justify-center text-white"
                  onClick={handleCloseProfile}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                <div className="absolute left-4 -bottom-10 h-20 w-20 rounded-full bg-tg-theme-bg-color p-1">
                  <div className="w-full h-full rounded-full bg-tg-theme-button-color/10 flex items-center justify-center text-tg-theme-button-color font-bold text-2xl">
                    {selectedFriend.name && selectedFriend.name.charAt(0).toUpperCase() || '?'}
                  </div>
                </div>
              </div>

              {/* Информация профиля */}
              <div className="pt-12 p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold">{selectedFriend.name}</h2>
                    <p className="text-sm text-tg-theme-hint-color">
                      {selectedFriend.isOnline
                        ? 'В сети'
                        : selectedFriend.lastSeen
                          ? `Был(а) ${typeof selectedFriend.lastSeen === 'string' ? selectedFriend.lastSeen : 'недавно'}`
                          : 'Не в сети'}
                    </p>
                  </div>

                  <Button
                    onClick={() => handleToggleFavorite(selectedFriend.id)}
                    disabled={processingIds.includes(selectedFriend.id)}
                    className={`h-8 px-2 flex items-center ${currentUser?.favorites?.includes(selectedFriend.id)
                      ? 'bg-yellow-500 text-white'
                      : 'bg-tg-theme-secondary-bg-color text-tg-theme-hint-color'
                      }`}
                  >
                    {processingIds.includes(selectedFriend.id) ? (
                      <span className="inline-block w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {currentUser?.favorites?.includes(selectedFriend.id) ? 'В избранном' : 'В избранное'}
                      </>
                    )}
                  </Button>
                </div>

                {/* Биография */}
                {selectedFriend.bio && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-1">О себе</h3>
                    <p className="text-sm bg-tg-theme-secondary-bg-color p-3 rounded-lg">
                      {selectedFriend.bio}
                    </p>
                  </div>
                )}

                {/* Интересы */}
                {selectedFriend.interests && selectedFriend.interests.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">Интересы</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedFriend.interests.map((interest, index) => (
                        <span
                          key={index}
                          className="text-xs bg-tg-theme-secondary-bg-color text-tg-theme-hint-color px-2 py-1 rounded-full"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Действия */}
                <div className="mt-6 flex space-x-2">
                  <Button
                    onClick={() => handleSendMessage(selectedFriend.id)}
                    className="flex-1 bg-tg-theme-button-color text-tg-theme-button-text-color justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                      <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                    </svg>
                    Написать
                  </Button>

                  <Button
                    onClick={() => handleRemoveFriend(selectedFriend.id)}
                    disabled={processingIds.includes(selectedFriend.id)}
                    className="bg-red-500 text-white px-4"
                  >
                    {processingIds.includes(selectedFriend.id) ? (
                      <span className="inline-block w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></span>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 6a3 3 0 11-6 0 3 3 0 016 0zM14 17a6 6 0 00-12 0h12zM13 8a1 1 0 100 2h4a1 1 0 100-2h-4z" />
                      </svg>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={handleGoToBeginnerGuide}
        className="..."
      >
        Как начать общение
      </Button>
    </div>
  )
}
