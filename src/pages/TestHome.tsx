import { useState, useEffect } from 'react'
import { useNavigate , Link } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { AnimatedButton } from '../components/AnimatedButton'
import {
  User,
  getCurrentUser,
  createDemoUser
} from '../utils/user'
import { generateRandomNickname } from '../utils/interests'
import { telegramApi } from '../utils/database'
import { addCurrency } from '../utils/store'

export const TestHome = () => {
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [showAdminButton, setShowAdminButton] = useState(false)

  // Используем тему Telegram
  const isDarkTheme = WebApp.colorScheme === 'dark'

  useEffect(() => {
    // Проверяем, есть ли пользователь в системе
    const user = getCurrentUser()
    setCurrentUser(user)

    // Проверяем, является ли текущий пользователь администратором
    if (user?.isAdmin) {
      setShowAdminButton(true)
    }
  }, [])

  // Начать анонимный чат
  const handleStartAnonymous = () => {
    let user = getCurrentUser()

    if (!user) {
      // Создаем демо-пользователя
      user = createDemoUser()
      setCurrentUser(user)
    }

    // Устанавливаем анонимный режим
    if (user) {
      user.isAnonymous = true
      // Генерируем случайное имя для анонимного режима
      user.name = generateRandomNickname()
    }

    navigate('/') // Переходим на основную страницу
  }

  // Начать обычный чат с реальным профилем
  const handleStartWithProfile = () => {
    let user = getCurrentUser()

    if (!user) {
      // Создаем демо-пользователя
      user = createDemoUser()
      setCurrentUser(user)
    }

    // Используем реальный профиль
    if (user) {
      user.isAnonymous = false
    }

    navigate('/') // Переходим на основную страницу
  }

  // Проверка авторизации через Telegram
  const handleTelegramAuth = async () => {
    try {
      // Инициализируем интеграцию с Telegram
      const success = await telegramApi.initialize()
      if (success) {
        const telegramId = telegramApi.getUserId()
        if (telegramId) {
          setCurrentUser(getCurrentUser())
          WebApp.showAlert('Авторизация через Telegram успешна!')
        } else {
          WebApp.showAlert('Не удалось получить Telegram ID')
        }
      } else {
        // Для тестирования используем мок авторизации
        navigate('/verify-telegram-mock')
      }
    } catch (error) {
      console.error('Ошибка при авторизации через Telegram:', error)
      WebApp.showAlert('Произошла ошибка при авторизации через Telegram')
    }
  }

  // Функция получения ежедневного бонуса
  const handleDailyBonus = async () => {
    try {
      if (!currentUser) {
        WebApp.showAlert('Пожалуйста, авторизуйтесь чтобы получить бонус')
        return
      }

      const bonusAmount = 10
      const result = addCurrency(currentUser.id, bonusAmount, 'Ежедневный бонус')

      if (result) {
        WebApp.showAlert(`Вы получили ежедневный бонус: ${bonusAmount} монет!`)
      } else {
        WebApp.showAlert('Произошла ошибка при начислении бонуса')
      }
    } catch (error) {
      console.error('Ошибка при получении бонуса:', error)
      WebApp.showAlert('Произошла ошибка при получении бонуса')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="mb-4">
        <div className="flex flex-col items-center gap-4 p-4">
          <h1 className="text-xl font-bold mb-2">Тестовое приложение анонимного чата</h1>
          <p className="text-center text-sm mb-4">
            Это тестовая версия приложения для анонимного общения.
            Выберите режим работы:
          </p>

          <AnimatedButton
            onClick={handleStartAnonymous}
            fullWidth
            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
            animation="pulse"
          >
            <span className="mr-2">🎭</span> Анонимный режим
          </AnimatedButton>

          <AnimatedButton
            onClick={handleStartWithProfile}
            fullWidth
            className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white"
            animation="pulse"
          >
            <span className="mr-2">👤</span> Обычный режим
          </AnimatedButton>

          <Button
            onClick={handleTelegramAuth}
            fullWidth
            className="bg-blue-500 hover:bg-blue-600"
          >
            <span className="mr-2">✅</span> Авторизоваться через Telegram
          </Button>

          {showAdminButton && (
            <Button
              onClick={() => navigate('/direct/admin')}
              fullWidth
              className="bg-red-500 hover:bg-red-600"
            >
              <span className="mr-2">⚙️</span> Панель администратора
            </Button>
          )}

          <Button
            onClick={handleDailyBonus}
            fullWidth
            className="bg-yellow-500 hover:bg-yellow-600"
          >
            <span className="mr-2">🎁</span> Получить ежедневный бонус
          </Button>
        </div>
      </Card>

      <div className="flex flex-wrap gap-2 justify-center">
        <Link to="/help">
          <Button>
            <span className="mr-2">❓</span> Помощь
          </Button>
        </Link>

        <Link to="/beginner-guide">
          <Button>
            <span className="mr-2">📚</span> Руководство
          </Button>
        </Link>

        <Link to="/direct/profile">
          <Button>
            <span className="mr-2">👤</span> Профиль
          </Button>
        </Link>

        <Link to="/direct/store">
          <Button>
            <span className="mr-2">🛒</span> Магазин
          </Button>
        </Link>
      </div>
    </div>
  )
}
