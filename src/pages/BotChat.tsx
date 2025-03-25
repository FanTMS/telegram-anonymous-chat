import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BotChatInterface } from '../components/BotChatInterface'
import { getCurrentUser } from '../utils/user'
import { addCurrency } from '../utils/store'
import WebApp from '@twa-dev/sdk'
import '../styles/bot-chat.css'

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
  const [isTyping, setIsTyping] = useState(false)
  const [botInstance, setBotInstance] = useState<any>(null)

  // Настройка WebApp
  useEffect(() => {
    try {
      if (WebApp && WebApp.isExpanded) {
        // Показываем кнопку "Назад"
        WebApp.BackButton.show()
        WebApp.BackButton.onClick(() => navigate('/'))

        // Скрываем главную кнопку
        WebApp.MainButton.hide()

        // Настройка темной/светлой темы
        if (WebApp.colorScheme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    } catch (error) {
      console.error('Ошибка при настройке Telegram WebApp:', error)
    }

    // Получаем данные пользователя
    const currentUser = getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
    } else {
      navigate('/')
    }

    // Проверяем доступность бонуса
    const lastBonusTime = localStorage.getItem('last_bot_bonus')
    if (lastBonusTime) {
      const now = Date.now()
      const lastTime = parseInt(lastBonusTime)
      // Если с момента последнего бонуса прошло менее 24 часов, то бонус недоступен
      if (now - lastTime < 24 * 60 * 60 * 1000) {
        setDailyBonusAvailable(false)
      }
    }

    // Очистка при размонтировании
    return () => {
      try {
        if (WebApp && WebApp.isExpanded) {
          WebApp.BackButton.offClick(() => navigate('/'))
          WebApp.BackButton.hide()
        }
      } catch (error) {
        console.error('Ошибка при очистке Telegram WebApp:', error)
      }
    }
  }, [navigate])

  // Эффективный способ добавления сообщений бота через ref на компонент
  useEffect(() => {
    const botInterfaceElement = document.querySelector('.bot-chat-interface');
    if (botInterfaceElement) {
      setBotInstance(botInterfaceElement);
    }

    return () => setBotInstance(null);
  }, []);

  // Обработчик сообщений пользователя
  const handleUserMessage = (message: string) => {
    setIsTyping(true); // Показываем индикатор печати

    // Таймер для эмуляции набора сообщения ботом
    const botTypingTimeout = setTimeout(() => {
      let botResponse = ''
      const lowerMsg = message.toLowerCase()

      // Логика ответов бота
      if (lowerMsg.includes('привет')) {
        botResponse = `Привет, ${user?.name || 'пользователь'}! Чем я могу тебе помочь сегодня?`
        setSuggestedCommands(['Найти собеседника', 'Получить бонус', 'Мой профиль'])
      }
      else if (lowerMsg.includes('найти собеседника') || lowerMsg.includes('поиск')) {
        botResponse = 'Чтобы найти собеседника, перейдите на главную страницу и нажмите кнопку "Найти собеседника". Вы можете выбрать анонимный режим или открыть свой профиль.'
        setSuggestedCommands(['Что такое анонимный режим?', 'Как заработать монеты?', 'Настройки профиля'])
      }
      else if (lowerMsg.includes('монет') || lowerMsg.includes('заработать')) {
        botResponse = 'Монеты можно заработать, общаясь в чате, получая хорошие отзывы от собеседников и заходя в приложение каждый день. Кстати, вы можете получить ежедневный бонус прямо сейчас!'
        setSuggestedCommands(['Получить бонус', 'Что можно купить за монеты?', 'Как повысить рейтинг?'])
      }
      else if (lowerMsg.includes('рейтинг')) {
        botResponse = 'Рейтинг - это оценка вашей активности и репутации. Чем выше рейтинг, тем больше доверия к вам. Рейтинг влияет на приоритет в поиске собеседников.'
        setSuggestedCommands(['Как повысить рейтинг?', 'Мой профиль', 'Что дает премиум?'])
      }
      else if (lowerMsg.includes('профиль') || lowerMsg.includes('аккаунт')) {
        if (user) {
          botResponse = `Информация о вашем профиле:\n\nИмя: ${user.name}\nВозраст: ${user.age}\nГород: ${user.city || 'Не указан'}\nРейтинг: ${user.rating}⭐\nИнтересы: ${user.interests.join(', ')}`
          setSuggestedCommands(['Изменить профиль', 'Как повысить рейтинг?', 'Настройки приватности'])
        } else {
          botResponse = 'Информация о вашем профиле недоступна.'
          setSuggestedCommands(['Создать профиль', 'Что даёт профиль?', 'Помощь'])
        }
      }
      else if (lowerMsg.includes('бонус') || lowerMsg.includes('награда')) {
        if (dailyBonusAvailable) {
          botResponse = 'Я добавил вам ежедневный бонус 5 монет! Приходите завтра за новой наградой. Монеты можно потратить в магазине на стикеры, темы оформления и другие преимущества.'
          // Начисляем бонус, если пользователь доступен
          if (user) {
            addCurrency(user.id, 5, 'Ежедневный бонус от бота')
            // Запоминаем время получения бонуса
            localStorage.setItem('last_bot_bonus', Date.now().toString())
            setDailyBonusAvailable(false)

            // Обеспечиваем тактильную обратную связь
            if (WebApp && WebApp.isExpanded && WebApp.HapticFeedback) {
              WebApp.HapticFeedback.notificationOccurred('success');
            }

            setSuggestedCommands(['Что можно купить?', 'Спасибо!', 'Магазин'])
          }
        } else {
          botResponse = 'Вы уже получили сегодня свой ежедневный бонус. Возвращайтесь завтра! А пока можете заработать монеты общаясь с другими пользователями.'
          setSuggestedCommands(['Найти собеседника', 'Как ещё заработать?', 'Магазин'])
        }
      }
      else if (lowerMsg.includes('помощь') || lowerMsg.includes('помоги')) {
        botResponse = 'Я могу помочь с различными вопросами о приложении. Вы можете спросить о:\n\n• Поиске собеседников\n• Заработке монет\n• Вашем профиле\n• Настройках приватности\n• Магазине и покупках\n\nЧто вас интересует?'
        setSuggestedCommands(['Найти собеседника', 'Заработать монеты', 'Мой профиль'])
      }
      else if (lowerMsg.includes('спасибо')) {
        botResponse = 'Всегда рад помочь! Если у вас возникнут ещё вопросы, обращайтесь.'
        setSuggestedCommands(['Ещё вопрос', 'Найти собеседника', 'Мой профиль'])
      }
      else if (lowerMsg.includes('настройк')) {
        botResponse = 'В настройках вы можете изменить данные профиля, настроить приватность и уведомления, выбрать тему оформления и многое другое. Для доступа к настройкам перейдите в раздел "Профиль".'
        setSuggestedCommands(['Мой профиль', 'Настройки приватности', 'Как изменить тему?'])
      }
      else if (lowerMsg.includes('анонимн')) {
        botResponse = 'В анонимном режиме ваш профиль скрыт от собеседника - он не увидит вашего имени, фото и других данных. Это хороший способ познакомиться с кем-то без предубеждений. Режим можно включить при поиске собеседника.'
        setSuggestedCommands(['Найти анонимный чат', 'Настройки приватности', 'Помощь'])
      }
      else {
        botResponse = 'Я не совсем понимаю, о чем вы. Вы можете спросить меня о поиске собеседников, заработке монет, настройках приватности или своем профиле.'
        setSuggestedCommands(['Помощь', 'Найти собеседника', 'Мой профиль'])
      }

      // Добавляем сообщение бота с помощью атрибута data-bot-response
      if (botInstance) {
        const botMessageElement = document.createElement('div');
        botMessageElement.style.display = 'none';
        botMessageElement.setAttribute('data-bot-response', botResponse);
        botInstance.appendChild(botMessageElement);
      }

      setIsTyping(false);
    }, 1500); // Время "печатания" бота

    return () => clearTimeout(botTypingTimeout);
  };

  return (
    <motion.div
      className="bot-chat-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bot-chat-header">
        <div className="bot-chat-header-inner">
          <motion.button
            className="bot-back-button"
            onClick={() => navigate(-1)}
            whileTap={{ scale: 0.95 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </motion.button>
          <h1 className="bot-chat-title">Бот-помощник</h1>

          {/* Добавляем иконку информации */}
          <motion.button
            className="bot-info-button"
            onClick={() => WebApp.showPopup({
              title: 'О боте-помощнике',
              message: 'Этот бот поможет вам разобраться с функциями приложения, ответит на вопросы и даст полезные советы. Задавайте вопросы на русском языке.',
              buttons: [{ type: 'ok' }]
            })}
            whileTap={{ scale: 0.95 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
          </motion.button>
        </div>
      </div>

      <div className="bot-chat-content">
        <BotChatInterface
          className="bot-chat-interface"
          initialMessages={initialBotMessages}
          onSendMessage={handleUserMessage}
          suggestedCommands={suggestedCommands}
          showTypingIndicator={isTyping}
        />
      </div>
    </motion.div>
  )
}
