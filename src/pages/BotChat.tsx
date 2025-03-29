import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BotChatInterface, BotChatMethods } from '../components/BotChatInterface'
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

// Категории команд для более организованных подсказок
const commandCategories = {
  general: ['Привет', 'Помощь', 'Что ты умеешь?'],
  chat: ['Как найти собеседника?', 'Как начать чат?', 'Анонимность в чате'],
  profile: ['Мой профиль', 'Как изменить имя?', 'Как заработать монеты?'],
  safety: ['Правила чата', 'Что делать если...', 'Заблокировать пользователя']
};

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

  // Используем реф для прямого доступа к методам BotChatInterface
  const botRef = useRef<BotChatMethods>(null)

  // Настройка WebApp
  useEffect(() => {
    try {
      if (WebApp && WebApp.isExpanded) {
        WebApp.BackButton.onClick(() => navigate('/'))
        WebApp.BackButton.show()
        WebApp.ready()
      }
    } catch (error) {
      console.error('Ошибка при настройке Telegram WebApp:', error)
    }

    // Загружаем данные пользователя
    const currentUser = getCurrentUser()
    setUser(currentUser)

    // Проверяем, доступен ли ежедневный бонус
    if (currentUser) {
      const lastBonusTime = localStorage.getItem(`last_bonus_${currentUser.id}`)
      if (!lastBonusTime) {
        setDailyBonusAvailable(true)
        return
      }

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

  // Обработчик сообщений пользователя
  const handleUserMessage = (message: string) => {
    // Показываем индикатор печати бота
    setIsTyping(true)

    // Таймер для эмуляции набора сообщения ботом
    const botTypingTimeout = setTimeout(() => {
      let botResponse = ''
      const lowerMsg = message.toLowerCase()

      // Расширенная логика ответов бота
      if (lowerMsg.includes('привет') || lowerMsg.includes('здравствуй') || lowerMsg.includes('хай')) {
        botResponse = `Привет, ${user?.name || 'пользователь'}! 👋 Чем я могу помочь вам сегодня?`
        setSuggestedCommands(['Найти собеседника', 'Получить бонус', 'Как пользоваться чатом?'])
      }
      else if (lowerMsg.includes('бонус') || lowerMsg.includes('получить монет') || lowerMsg.includes('вознагражд')) {
        if (dailyBonusAvailable) {
          // Добавляем монеты пользователю
          if (user) {
            const bonus = 50
            const success = addCurrency(user.id, bonus)
            if (success) {
              botResponse = `🎉 Вы получили ежедневный бонус: ${bonus} монет!\n\nВаши монеты можно потратить в магазине на улучшения профиля и различные возможности чата.`

              // Обновляем время получения бонуса
              localStorage.setItem(`last_bonus_${user.id}`, Date.now().toString())
              setDailyBonusAvailable(false)

              // Обеспечиваем тактильную обратную связь
              if (WebApp && WebApp.isExpanded && WebApp.HapticFeedback) {
                WebApp.HapticFeedback.notificationOccurred('success');
              }

              setSuggestedCommands(['Что можно купить?', 'Спасибо!', 'Магазин'])
            }
          } else {
            botResponse = 'Чтобы получить бонус, нужно войти в аккаунт.'
          }
        } else {
          botResponse = 'Вы уже получили сегодня свой ежедневный бонус. Возвращайтесь завтра! А пока можете заработать монеты общаясь с другими пользователями.'
          setSuggestedCommands(['Найти собеседника', 'Как ещё заработать?', 'Магазин'])
        }
      }
      else if (lowerMsg.includes('помощь') || lowerMsg.includes('помоги') || lowerMsg.includes('умеешь')) {
        botResponse = 'Я могу помочь с различными вопросами о приложении. Вы можете спросить о:\n\n• Поиске собеседников\n• Заработке монет\n• Вашем профиле\n• Настройках приватности\n• Магазине и покупках\n\nЧто вас интересует?'
        setSuggestedCommands(['Найти собеседника', 'Заработать монеты', 'Мой профиль'])
      }
      else if (lowerMsg.includes('спасибо')) {
        botResponse = 'Всегда рад помочь! Если у вас возникнут ещё вопросы, обращайтесь.'
        setSuggestedCommands(['Ещё вопрос', 'Найти собеседника', 'Мой профиль'])
      }
      else if (lowerMsg.includes('найти собеседник') || lowerMsg.includes('поиск собеседник') || lowerMsg.includes('начать чат')) {
        botResponse = 'Чтобы начать общение, вернитесь на главную страницу и нажмите кнопку "Найти собеседника". Вы можете выбрать случайный режим или поиск по интересам для более интересных бесед!'
        setSuggestedCommands(['Вернуться на главную', 'Как правильно общаться?', 'Анонимность в чате'])
      }
      else if (lowerMsg.includes('зарабат') || lowerMsg.includes('монет') || lowerMsg.includes('валют')) {
        botResponse = 'Монеты можно получить несколькими способами:\n\n• Ежедневный бонус при посещении чата\n• Длительные беседы с собеседниками\n• За приглашение друзей\n• За положительные оценки ваших бесед\n\nМонеты можно тратить на улучшения профиля и различные возможности в приложении.'
        setSuggestedCommands(['Получить ежедневный бонус', 'Что можно купить?', 'Магазин'])
      }
      else if (lowerMsg.includes('профил') || lowerMsg.includes('аккаунт')) {
        botResponse = 'В вашем профиле вы можете:\n\n• Редактировать имя и аватар\n• Видеть историю ваших чатов\n• Отслеживать заработанные монеты\n• Настраивать приватность\n\nЧтобы перейти в профиль, нажмите на кнопку "Мой профиль" на главной странице.'
        setSuggestedCommands(['Как изменить имя?', 'Настройки приватности', 'Вернуться на главную'])
      }
      else if (lowerMsg.includes('настрой') || lowerMsg.includes('привата') || lowerMsg.includes('приватно')) {
        botResponse = 'В настройках вы можете изменить данные профиля, настроить приватность и уведомления, выбрать тему оформления и многое другое. Для доступа к настройкам перейдите в раздел "Профиль".'
        setSuggestedCommands(['Мой профиль', 'Настройки приватности', 'Как изменить тему?'])
      }
      else if (lowerMsg.includes('анонимн') || lowerMsg.includes('конфиденц')) {
        botResponse = 'В нашем приложении все чаты анонимны. Ваше имя или контактные данные не передаются собеседнику, если вы сами не решите поделиться ими. Вы можете общаться, не опасаясь за свою приватность.'
        setSuggestedCommands(['Как начать анонимный чат?', 'Правила общения', 'Заблокировать пользователя'])
      }
      else if (lowerMsg.includes('рейтинг') || lowerMsg.includes('репутац') || lowerMsg.includes('оценк')) {
        botResponse = 'Рейтинг - это показатель вашей репутации в чате. Он повышается, когда собеседники оставляют положительные отзывы о беседе с вами. Высокий рейтинг помогает быстрее находить собеседников и открывает дополнительные возможности.'
        setSuggestedCommands(['Как повысить рейтинг?', 'Преимущества высокого рейтинга', 'Мой профиль'])
      }
      else if (lowerMsg.includes('правил') || lowerMsg.includes('как общаться') || lowerMsg.includes('запрещен')) {
        botResponse = 'Основные правила общения:\n\n• Уважайте собеседника\n• Не спамьте и не отправляйте рекламу\n• Не используйте оскорбления\n• Не делитесь личной информацией\n• Сообщайте о нарушениях через функцию "Пожаловаться"\n\nНарушение правил может привести к временной или постоянной блокировке.'
        setSuggestedCommands(['Как пожаловаться?', 'Что делать если...', 'Заблокировать пользователя'])
      }
      else if (lowerMsg.includes('блок') || lowerMsg.includes('жалоб') || lowerMsg.includes('пожаловат')) {
        botResponse = 'Если собеседник нарушает правила, вы можете нажать на кнопку "Пожаловаться" в интерфейсе чата. Также вы можете заблокировать пользователя, чтобы больше не встречаться с ним. Мы рассматриваем все жалобы и принимаем меры против нарушителей.'
        setSuggestedCommands(['Правила чата', 'Что делать если оскорбляют?', 'Вернуться на главную'])
      }
      else if (lowerMsg.includes('груп') || lowerMsg.includes('несколько') || lowerMsg.includes('многопользователь')) {
        botResponse = 'В нашем приложении есть возможность групповых анонимных чатов. Вы можете присоединиться к существующим группам по интересам или создать свою. Для этого перейдите в раздел "Групповые чаты" на главной странице.'
        setSuggestedCommands(['Найти группу', 'Создать группу', 'Правила групповых чатов'])
      }
      else if (lowerMsg.includes('магазин') || lowerMsg.includes('покупк') || lowerMsg.includes('купить')) {
        botResponse = 'В магазине вы можете приобрести:\n\n• Особые статусы и значки для профиля\n• Анимированные аватары\n• Приоритетный поиск собеседников\n• Бустеры для ускоренного заработка монет\n\nДля перехода в магазин нажмите на соответствующую кнопку на главной странице.'
        setSuggestedCommands(['Сколько у меня монет?', 'Как заработать монеты?', 'Вернуться на главную'])
      }
      else if (lowerMsg.includes('главн') || lowerMsg.includes('меню') || lowerMsg.includes('начало')) {
        botResponse = 'Чтобы вернуться на главную страницу, нажмите кнопку "Назад" вверху экрана или воспользуйтесь кнопкой ниже.'
        setSuggestedCommands(['Вернуться на главную', 'Помощь', 'Мой профиль'])
      }
      else if (lowerMsg.includes('тем') || lowerMsg.includes('оформлен') || lowerMsg.includes('цвет')) {
        botResponse = 'Приложение автоматически адаптируется под тему Telegram (светлую или темную). Отдельные настройки темы будут доступны в следующих обновлениях.'
        setSuggestedCommands(['Настройки', 'Что нового?', 'Вернуться на главную'])
      }
      else if (lowerMsg.includes('обновлен') || lowerMsg.includes('нов') || lowerMsg.includes('верси')) {
        botResponse = 'Мы постоянно работаем над улучшением приложения. Последние обновления включают:\n\n• Улучшенный алгоритм поиска собеседников\n• Новые возможности для заработка монет\n• Оптимизацию работы на всех устройствах\n\nСледите за новостями в нашем канале!'
        setSuggestedCommands(['Подписаться на новости', 'Сообщить о проблеме', 'Предложить идею'])
      }
      else if (lowerMsg.includes('вернуться') || lowerMsg.includes('главна') || lowerMsg.includes('назад')) {
        botResponse = 'Перейти на главную страницу можно, нажав кнопку навигации "Назад" вверху экрана.'
        navigate('/');
        return;
      }
      else if (lowerMsg.includes('продолжить') || lowerMsg.includes('итераци')) {
        botResponse = 'Хотите продолжить текущую итерацию или начать новую?\n\nВыберите действие ниже:'
        setSuggestedCommands(['Продолжить текущую', 'Начать новую', 'Вернуться'])
      }
      else if (lowerMsg === 'продолжить текущую') {
        botResponse = 'Продолжаем текущую итерацию. Удачи!'
        setSuggestedCommands(['Помощь', 'Статистика', 'Завершить'])
      }
      else {
        // Общий ответ для неизвестных запросов
        botResponse = 'Я не совсем понял ваш вопрос. Вы можете спросить о поиске собеседника, заработке монет, настройках профиля или других функциях чата. Чем я могу помочь?'
        setSuggestedCommands(['Помощь', 'Найти собеседника', 'Как заработать монеты?', 'Настройки'])
      }

      // Добавляем ответ бота с помощью нашего рефа
      if (botRef.current) {
        botRef.current.addMessage('bot', botResponse);
      }

      // Скрываем индикатор печати
      setIsTyping(false)
    }, 1000 + Math.random() * 1000); // Случайная задержка для реалистичности

    // Очищаем таймер при размонтировании компонента
    return () => clearTimeout(botTypingTimeout);
  };

  // Обработчик нажатия на "Вернуться на главную"
  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Чат с ботом */}
      <div className="flex-1 max-w-2xl w-full mx-auto flex flex-col overflow-hidden">
        <BotChatInterface
          ref={botRef}
          initialMessages={initialBotMessages}
          onSendMessage={handleUserMessage}
          suggestedCommands={suggestedCommands}
          showTypingIndicator={isTyping}
          className="bot-chat-interface"
        />
      </div>
    </div>
  );
};
