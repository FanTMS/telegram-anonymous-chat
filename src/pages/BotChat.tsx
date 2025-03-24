import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { BotChatInterface } from '../components/BotChatInterface'
import { getCurrentUser } from '../utils/user'
import { addCurrency } from '../utils/store'

// Начальные сообщения бота
const initialBotMessages = [
  {
    id: 'initial_1',
    type: 'bot' as const,
    text: 'Привет! Я бот-помощник анонимного чата. Чем я могу помочь?',
    timestamp: Date.now() - 1000
  },
  {
    id: 'initial_2',
    type: 'bot' as const,
    text: 'Вы можете спросить меня о функциях чата, получить помощь с поиском собеседника или узнать о своем профиле.',
    timestamp: Date.now()
  }
]

export const BotChat = () => {
  const navigate = useNavigate()
  const [suggestedCommands, setSuggestedCommands] = useState([
    'Привет',
    'Как найти собеседника?',
    'Как заработать монеты?',
    'Что такое рейтинг?'
  ])
  const [user, setUser] = useState<any>(null)
  const [dailyBonusAvailable, setDailyBonusAvailable] = useState(true)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
    } else {
      navigate('/')
    }

    // Проверяем доступность бонуса (в реальном приложении это будет из API)
    const lastBonusTime = localStorage.getItem('last_bot_bonus')
    if (lastBonusTime) {
      const now = Date.now()
      const lastTime = parseInt(lastBonusTime)
      // Если с момента последнего бонуса прошло менее 24 часов, то бонус недоступен
      if (now - lastTime < 24 * 60 * 60 * 1000) {
        setDailyBonusAvailable(false)
      }
    }
  }, [navigate])

  // Обработчик сообщений пользователя
  const handleUserMessage = (message: string) => {
    // В реальном приложении здесь будет запрос к API бота
    // Простая логика для демонстрации
    setTimeout(() => {
      let botResponse = ''
      const lowerMsg = message.toLowerCase()

      if (lowerMsg.includes('привет')) {
        botResponse = `Привет, ${user?.name || 'пользователь'}! Чем я могу тебе помочь сегодня?`
      }
      else if (lowerMsg.includes('найти собеседника') || lowerMsg.includes('поиск')) {
        botResponse = 'Чтобы найти собеседника, перейдите на главную страницу и нажмите кнопку "Найти собеседника". Вы можете выбрать анонимный режим или открыть свой профиль.'
      }
      else if (lowerMsg.includes('монет') || lowerMsg.includes('заработать')) {
        botResponse = 'Монеты можно заработать, общаясь в чате, получая хорошие отзывы от собеседников и заходя в приложение каждый день. Кстати, вы можете получить ежедневный бонус прямо сейчас!'
      }
      else if (lowerMsg.includes('рейтинг')) {
        botResponse = 'Рейтинг - это оценка вашей активности и репутации. Чем выше рейтинг, тем больше доверия к вам. Рейтинг влияет на приоритет в поиске собеседников.'
      }
      else if (lowerMsg.includes('профиль') || lowerMsg.includes('аккаунт')) {
        if (user) {
          botResponse = `Информация о вашем профиле:\nИмя: ${user.name}\nВозраст: ${user.age}\nГород: ${user.city}\nРейтинг: ${user.rating}⭐\nИнтересы: ${user.interests.join(', ')}`
        } else {
          botResponse = 'Информация о вашем профиле недоступна.'
        }
      }
      else if (lowerMsg.includes('бонус') || lowerMsg.includes('награда')) {
        if (dailyBonusAvailable) {
          botResponse = 'Я добавил вам ежедневный бонус 5 монет! Приходите завтра за новой наградой.'
          // Начисляем бонус, если пользователь доступен
          if (user) {
            addCurrency(user.id, 5, 'Ежедневный бонус от бота')
            // Запоминаем время получения бонуса
            localStorage.setItem('last_bot_bonus', Date.now().toString())
            setDailyBonusAvailable(false)
          }
        } else {
          botResponse = 'Вы уже получили сегодня свой ежедневный бонус. Возвращайтесь завтра!'
        }
      }
      else {
        botResponse = 'Я не совсем понимаю, о чем вы. Вы можете спросить меня о поиске собеседников, заработке монет или своем профиле.'
      }

      // Вставляем сообщение в интерфейс чата через DOM
      const botMessageElement = document.createElement('div')
      botMessageElement.textContent = botResponse
      botMessageElement.setAttribute('data-bot-message', 'true')

      // Динамически обновляем предложенные команды на основе контекста
      if (lowerMsg.includes('монет') || lowerMsg.includes('заработать')) {
        setSuggestedCommands(['Получить бонус', 'Как повысить рейтинг?', 'Что такое премиум?'])
      } else if (lowerMsg.includes('профиль')) {
        setSuggestedCommands(['Как изменить профиль?', 'Скрыть мой профиль', 'Найти собеседника'])
      }
    }, 1000)
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold mb-4">Бот-помощник</h1>

      <Card className="mb-4">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl mr-4">
            🤖
          </div>
          <div>
            <h2 className="text-lg font-semibold">Бот-ассистент</h2>
            <p className="text-sm text-gray-600">Всегда готов помочь!</p>
          </div>
          {dailyBonusAvailable && (
            <div className="ml-auto bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
              Бонус доступен!
            </div>
          )}
        </div>

        <p className="text-sm mb-4">
          Я могу отвечать на ваши вопросы, помогать с поиском собеседников и рассказывать о функциях чата.
          Не стесняйтесь задавать любые вопросы!
        </p>

        <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800 mb-4">
          <strong>Подсказка:</strong> Спросите бота "Как заработать монеты?" или "Расскажи о моем профиле"
        </div>
      </Card>

      <BotChatInterface
        initialMessages={initialBotMessages}
        onSendMessage={handleUserMessage}
        suggestedCommands={suggestedCommands}
        showTypingIndicator={false}
      />

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
