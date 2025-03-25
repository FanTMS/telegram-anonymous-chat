import React from 'react'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

interface MessageItemProps {
  message: {
    id: string
    senderId: string
    text: string
    timestamp: number
    isSystem?: boolean
    isRead?: boolean
  }
  isCurrentUser: boolean
  isSystemMessage?: boolean
  showAvatar?: boolean
  animate?: boolean
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isCurrentUser,
  isSystemMessage = false,
  showAvatar = true,
  animate = true
}) => {
  // Форматируем время сообщения
  const formatTime = (timestamp: number) => {
    try {
      const date = new Date(timestamp)
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    } catch (error) {
      console.error('Ошибка при форматировании времени:', error)
      return '--:--'
    }
  }

  // Форматируем относительное время
  const formatRelativeTime = (timestamp: number) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: ru })
    } catch (error) {
      console.error('Ошибка при форматировании относительного времени:', error)
      return 'недавно'
    }
  }

  // Если это системное сообщение
  if (isSystemMessage) {
    return (
      <motion.div
        initial={animate ? { opacity: 0, y: 20 } : false}
        animate={animate ? { opacity: 1, y: 0 } : false}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="system-message flex justify-center my-3"
      >
        <div className="inline-block px-4 py-1.5 rounded-full bg-gray-200 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-300">
          {message.text}
        </div>
      </motion.div>
    )
  }

  // Для обычных сообщений
  const messageVariants = {
    initial: animate ? { opacity: 0, scale: 0.8, x: isCurrentUser ? 20 : -20 } : {},
    animate: animate ? { opacity: 1, scale: 1, x: 0 } : {},
    exit: { opacity: 0 }
  }

  return (
    <motion.div
      variants={messageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`message-item flex ${isCurrentUser ? 'justify-end' : 'justify-start'} mb-2`}
    >
      {!isCurrentUser && showAvatar && (
        <div className="avatar flex-shrink-0 w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center mr-2">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {message.senderId.charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      <div className={`message-bubble max-w-[75%] ${isCurrentUser
          ? 'bg-blue-500 text-white rounded-t-2xl rounded-l-2xl rounded-br-md'
          : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-t-2xl rounded-r-2xl rounded-bl-md border dark:border-gray-700'
        } px-4 py-2 shadow-sm`}>
        <div className="message-text break-words whitespace-pre-wrap">{message.text}</div>
        <div className={`message-meta flex items-center justify-end text-xs mt-1 ${isCurrentUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
          }`}>
          <span className="message-time">{formatTime(message.timestamp)}</span>
          {isCurrentUser && message.isRead && (
            <span className="ml-1 text-blue-100">✓</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
