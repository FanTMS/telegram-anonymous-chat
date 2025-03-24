import { useState, useEffect, useRef } from 'react'
import { Button } from './Button'
import { Card } from './Card'
import { Input } from './Input'
import WebApp from '@twa-dev/sdk'

// Типы сообщений в чате
type MessageType = 'user' | 'bot' | 'system'

// Интерфейс сообщения
interface BotMessage {
  id: string
  type: MessageType
  text: string
  timestamp: number
  isLoading?: boolean
}

interface BotChatInterfaceProps {
  initialMessages?: BotMessage[]
  onSendMessage?: (message: string) => void
  suggestedCommands?: string[]
  showTypingIndicator?: boolean
  className?: string
}

export const BotChatInterface = ({
  initialMessages = [],
  onSendMessage,
  suggestedCommands = ['Привет', 'Помощь', 'Найти собеседника', 'Мой профиль'],
  showTypingIndicator = false,
  className = ''
}: BotChatInterfaceProps) => {
  const [messages, setMessages] = useState<BotMessage[]>(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(showTypingIndicator)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isDarkTheme = WebApp.colorScheme === 'dark'

  // Прокрутка вниз при добавлении новых сообщений
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Прокрутка к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Симуляция ответа бота
  const simulateBotResponse = (userMessage: string) => {
    // Индикатор набора текста
    setIsTyping(true)

    // Имитируем задержку ответа
    setTimeout(() => {
      setIsTyping(false)

      // Простая логика ответов
      let botReply = ''
      const lowerMessage = userMessage.toLowerCase()

      if (lowerMessage.includes('привет')) {
        botReply = 'Привет! Чем я могу помочь?'
      } else if (lowerMessage.includes('помощь')) {
        botReply = 'Вот команды, которые я понимаю: /start - начать чат, /help - помощь, /find - найти собеседника, /profile - просмотреть профиль.'
      } else if (lowerMessage.includes('собеседник') || lowerMessage.includes('найти')) {
        botReply = 'Ищу подходящего собеседника... Пожалуйста, подождите.'
      } else if (lowerMessage.includes('профиль')) {
        botReply = 'Ваш профиль: Имя - Демо Пользователь, Рейтинг - 4.5⭐'
      } else {
        botReply = 'Извините, я не понимаю. Напишите "помощь" для получения списка команд.'
      }

      // Добавляем ответ бота
      addMessage('bot', botReply)
    }, 1000)
  }

  // Добавление нового сообщения
  const addMessage = (type: MessageType, text: string) => {
    const newMsg: BotMessage = {
      id: `msg_${Date.now()}`,
      type,
      text,
      timestamp: Date.now()
    }
    setMessages(prev => [...prev, newMsg])
  }

  // Обработчик отправки сообщения
  const handleSendMessage = () => {
    if (newMessage.trim() === '') return

    // Добавляем сообщение пользователя
    addMessage('user', newMessage)

    // Вызываем внешний обработчик, если он есть
    if (onSendMessage) {
      onSendMessage(newMessage)
    } else {
      // Иначе используем внутреннюю логику
      simulateBotResponse(newMessage)
    }

    // Очищаем поле ввода
    setNewMessage('')
  }

  // Обработчик выбора предложенной команды
  const handleSuggestedCommand = (command: string) => {
    setNewMessage(command)
  }

  // Обработчик нажатия Enter в поле ввода
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  // Форматирование времени
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {/* Заголовок чата */}
      <div className="bg-blue-500 text-white p-3 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-500 mr-2">
            🤖
          </div>
          <div>
            <h3 className="font-medium">Чат-бот</h3>
            <p className="text-xs opacity-80">{isTyping ? 'печатает...' : 'онлайн'}</p>
          </div>
        </div>
      </div>

      {/* Область сообщений */}
      <Card className="flex-grow overflow-y-auto p-0 max-h-96">
        <div className="flex flex-col p-3 overflow-y-auto h-full">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-10 text-gray-500">
              <div className="text-3xl mb-3">👋</div>
              <p>Напишите что-нибудь, чтобы начать диалог</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`mb-3 ${
                  msg.type === 'user' ? 'self-end' : 'self-start'
                } max-w-[80%]`}
              >
                <div
                  className={`p-3 rounded-lg ${
                    msg.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : msg.type === 'system'
                      ? 'bg-gray-200 text-gray-800'
                      : isDarkTheme
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <p>{msg.text}</p>
                  <div
                    className={`text-xs mt-1 ${
                      msg.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}

          {isTyping && (
            <div className="self-start max-w-[80%] mb-3">
              <div className={`p-3 rounded-lg ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </Card>

      {/* Предложенные команды */}
      {suggestedCommands.length > 0 && (
        <div className="flex overflow-x-auto py-2 space-x-2">
          {suggestedCommands.map((command, index) => (
            <Button
              key={index}
              variant="outline"
              onClick={() => handleSuggestedCommand(command)}
              className="whitespace-nowrap"
            >
              {command}
            </Button>
          ))}
        </div>
      )}

      {/* Поле ввода и кнопка отправки */}
      <div className="flex gap-2 mt-3">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Введите сообщение..."
          fullWidth
        />
        <Button
          onClick={handleSendMessage}
          disabled={newMessage.trim() === ''}
          className="bg-blue-500 hover:bg-blue-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </Button>
      </div>
    </div>
  )
}
