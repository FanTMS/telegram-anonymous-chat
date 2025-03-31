import { useState, useEffect } from 'react'
import WebApp from '@twa-dev/sdk'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { userStorage } from './utils/userStorage'
import { getCurrentUser } from './utils/user'

/**
 * Основной компонент приложения
 */
function App() {
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    // Инициализация при монтировании
    try {
      console.log('Инициализация приложения...')

      // Проверяем наличие данных Telegram пользователя
      if (WebApp && WebApp.initDataUnsafe && WebApp.initDataUnsafe.user) {
        const userId = WebApp.initDataUnsafe.user.id
        console.log(`Инициализация хранилища для Telegram пользователя: ${userId}`)
        userStorage.initialize(userId)
      } else {
        // Для локальной разработки используем dev_user_id
        const devUserId = localStorage.getItem('dev_user_id') || `dev_${Date.now()}`
        localStorage.setItem('dev_user_id', devUserId)
        console.log(`Инициализация хранилища для разработки: ${devUserId}`)
        userStorage.initialize(devUserId)
      }

      // Пытаемся проверить текущего пользователя
      const currentUser = getCurrentUser()
      console.log('Текущий пользователь:', currentUser ? {
        id: currentUser.id,
        name: currentUser.name,
        hasProfile: !!currentUser.age && Array.isArray(currentUser.interests) && currentUser.interests.length > 0
      } : 'не найден')

    } catch (error) {
      console.error('Ошибка при инициализации приложения:', error)
    } finally {
      // Переходим к рендерингу приложения
      setIsInitializing(false)
    }
  }, [])

  // Показываем лоадер во время инициализации
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-blue-500 border-solid rounded-full animate-spin border-t-transparent">
        </div>
      </div>
    )
  }

  return <RouterProvider router={router} />
}

export default App
