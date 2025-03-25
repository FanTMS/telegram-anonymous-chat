import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import WebApp from '@twa-dev/sdk'
import '../styles/bot-chat.css'

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

// Интерфейс методов бота, доступных извне
export interface BotChatMethods {
  addMessage: (type: MessageType, text: string) => void;
  clearMessages: () => void;
}

interface BotChatInterfaceProps {
  initialMessages?: BotMessage[]
  onSendMessage?: (message: string) => void
  suggestedCommands?: string[]
  showTypingIndicator?: boolean
  className?: string
}

export const BotChatInterface = forwardRef<BotChatMethods, BotChatInterfaceProps>(({
  initialMessages = [],
  onSendMessage,
  suggestedCommands = ['Привет', 'Помощь', 'Найти собеседника', 'Мой профиль'],
  showTypingIndicator = false,
  className = ''
}, ref) => {
  const [messages, setMessages] = useState<BotMessage[]>(initialMessages)
  const [newMessage, setNewMessage] = useState('')
  const [isTyping, setIsTyping] = useState(showTypingIndicator)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const commandsRef = useRef<HTMLDivElement>(null)
  const [expandedInput, setExpandedInput] = useState(false)
  const isDarkTheme = WebApp.colorScheme === 'dark'

  // Прокрутка вниз при добавлении новых сообщений
  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // Обновление статуса печати из внешних пропсов
  useEffect(() => {
    setIsTyping(showTypingIndicator)
  }, [showTypingIndicator])

  // Прокрутка к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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

  // Очистка всех сообщений
  const clearMessages = () => {
    setMessages([])
  }

  // Экспортируем методы через ref для использования извне
  useImperativeHandle(ref, () => ({
    addMessage,
    clearMessages
  }));

  // Обработка авторесайза текстового поля
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      const scrollHeight = inputRef.current.scrollHeight
      inputRef.current.style.height =
        scrollHeight > 120 ? '120px' : `${scrollHeight}px`
    }
  }, [newMessage])

  // Обработчик отправки сообщения
  const handleSendMessage = () => {
    if (newMessage.trim() === '') return

    // Обеспечиваем тактильную обратную связь при отправке
    if (WebApp && WebApp.isExpanded && WebApp.HapticFeedback) {
      WebApp.HapticFeedback.impactOccurred('light')
    }

    // Добавляем сообщение пользователя
    addMessage('user', newMessage)

    // Вызываем внешний обработчик, если он есть
    if (onSendMessage) {
      onSendMessage(newMessage)
    }

    // Очищаем поле ввода
    setNewMessage('')

    // Сбрасываем размер поля ввода
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      setExpandedInput(false)
    }
  }

  // Обработчик нажатия на команду
  const handleCommandClick = (command: string) => {
    // Добавляем тактильную обратную связь
    if (WebApp && WebApp.HapticFeedback) {
      WebApp.HapticFeedback.impactOccurred('light');
    }

    // Устанавливаем команду в поле ввода
    setNewMessage(command);

    // Фокусируемся на поле ввода
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // Автоматически отправляем команду после небольшой задержки
    setTimeout(() => {
      handleSendMessage();
    }, 300);
  };

  // Рендеринг панели команд
  const renderCommandsPanel = () => {
    return (
      <div className="bot-commands-container">
        <div className="bot-commands-scroll" ref={commandsRef}>
          {suggestedCommands.map((command, index) => (
            <motion.button
              key={`cmd-${index}`}
              className="bot-command-chip"
              onClick={() => handleCommandClick(command)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {command}
            </motion.button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`bot-chat-container ${className}`}>
      {/* Сообщения */}
      <div className="bot-messages-container">
        <AnimatePresence>
          {messages.map(message => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, type: 'spring', stiffness: 350, damping: 25 }}
              className={`bot-message ${message.type}-message`}
            >
              {message.type === 'bot' && (
                <div className="bot-avatar">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round" className="bot-avatar-icon">
                    <path d="M12 2a2 2 0 0 1 2 2v8a2 2 0 1 1-4 0V4a2 2 0 0 1 2-2z"></path>
                    <path d="M18.59 10.59 20 9.17a2 2 0 1 0-2.83-2.83l-1.41 1.41"></path>
                    <path d="m5.41 10.59-1.41-1.42a2 2 0 0 0-2.83 2.83L2.59 13.4"></path>
                    <rect x="8" y="14" width="8" height="6" rx="1"></rect>
                  </svg>
                </div>
              )}
              <div className="bot-message-content">
                <div className="bot-message-text">{message.text}</div>
                <div className="bot-message-time">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Индикатор печати */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bot-typing-indicator"
            >
              <div className="bot-avatar">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" className="bot-avatar-icon">
                  <path d="M12 2a2 2 0 0 1 2 2v8a2 2 0 1 1-4 0V4a2 2 0 0 1 2-2z"></path>
                  <path d="M18.59 10.59 20 9.17a2 2 0 1 0-2.83-2.83l-1.41 1.41"></path>
                  <path d="m5.41 10.59-1.41-1.42a2 2 0 0 0-2.83 2.83L2.59 13.4"></path>
                  <rect x="8" y="14" width="8" height="6" rx="1"></rect>
                </svg>
              </div>
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Референс для автоскролла */}
        <div ref={messagesEndRef} />
      </div>

      {/* Подсказки с командами */}
      {renderCommandsPanel()}

      {/* Поле ввода сообщения */}
      <div className="bot-input-container">
        <textarea
          ref={inputRef}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onFocus={() => setExpandedInput(true)}
          onBlur={() => setExpandedInput(newMessage.length > 0)}
          placeholder="Введите сообщение..."
          className={`bot-input ${expandedInput ? 'expanded' : ''}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSendMessage()
            }
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
          className={`bot-send-button ${!newMessage.trim() ? 'disabled' : ''}`}
          aria-label="Отправить сообщение"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" className="send-icon">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
    </div>
  )
});
