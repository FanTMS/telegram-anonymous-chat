import { useState, useEffect } from 'react'
import WebApp from '@twa-dev/sdk'
import { RouterProvider } from 'react-router-dom'
import { router } from './routes'
import { userStorage } from './utils/userStorage'
import { getCurrentUser } from './utils/user'
import { safeViewport } from './utils/safe-viewport'
import './utils/responsive.css'

/**
 * Основной компонент приложения
 */
function App() {
  const [isInitializing, setIsInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Устанавливаем таймаут на инициализацию
    const timeout = setTimeout(() => {
      if (isInitializing) {
        console.warn('Превышено время инициализации - принудительно продолжаем загрузку')
        setIsInitializing(false)
      }
    }, 3000) // 3 секунды максимум на инициализацию

    // Инициализация при монтировании
    const init = async () => {
      try {
        console.log('Инициализация приложения...')

        // Применяем настройки для корректного отображения
        safeViewport.setupViewport()

        // Проверяем наличие данных Telegram пользователя
        if (WebApp && WebApp.initDataUnsafe && WebApp.initDataUnsafe.user) {
          const userId = WebApp.initDataUnsafe.user.id
          if (userId) {
            // Инициализируем хранилище для этого пользователя
            const initialized = userStorage.initialize(userId)
            console.log(`Хранилище инициализировано для Telegram пользователя: ${initialized}`)
          }
        } else {
          // В режиме разработки используем dev_user_id
          const devUserId = localStorage.getItem('dev_user_id') || `dev_${Date.now()}`
          localStorage.setItem('dev_user_id', devUserId)
          const initialized = userStorage.initialize(devUserId)
          console.log(`Хранилище инициализировано для разработки: ${initialized}`)
        }

        // Настраиваем WebApp
        if (WebApp && WebApp.isExpanded) {
          try {
            WebApp.ready() // Сообщаем Telegram, что приложение готово

            // Устанавливаем цветовую схему для всего приложения
            document.documentElement.style.setProperty('--tg-theme-bg-color-rgb', '255, 255, 255')
            document.documentElement.classList.remove('dark') // Принудительно светлая тема
          } catch (e) {
            console.warn('Ошибка при настройке Telegram WebApp:', e)
          }
        }

        // Завершаем инициализацию
        setIsInitializing(false)
      } catch (error) {
        console.error('Ошибка при инициализации приложения:', error)
        setError('Произошла ошибка при инициализации приложения')
        setIsInitializing(false)
      }
    }

    init()

    return () => clearTimeout(timeout)
  }, [])

  // Обработка изменений размера экрана
  useEffect(() => {
    // Создаем обработчик для изменения размера окна
    const handleResize = () => {
      safeViewport.setupViewport()
    }

    // Добавляем слушатели событий
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)

    // Вызываем один раз при монтировании
    handleResize()

    // Очистка при размонтировании
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [])

  // Экран загрузки
  if (isInitializing) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка приложения...</p>
        </div>
      </div>
    )
  }

  // Если произошла ошибка при инициализации
  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full mx-auto flex items-center justify-center mb-4">
            <span className="text-red-500 text-2xl">⚠️</span>
          </div>
          <h1 className="text-xl font-bold text-red-600 mb-2">Ошибка инициализации</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            Перезагрузить
          </button>
        </div>
      </div>
    )
  }

  // Основное приложение
  return <RouterProvider router={router} />
}

export default App
