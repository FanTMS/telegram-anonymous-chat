import React from 'react'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

interface MessageItemProps {
  text: string
  timestamp: number
  isOutgoing: boolean
  isRead?: boolean
}

export const MessageItem: React.FC<MessageItemProps> = ({
  text,
  timestamp,
  isOutgoing,
  isRead = false
}) => {
  const formattedTime = formatDistanceToNow(new Date(timestamp), {
    addSuffix: true,
    locale: ru
  })

  // Применяем разные стили в зависимости от типа сообщения
  const containerClass = isOutgoing
    ? 'ml-auto bg-blue-500 text-white rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl'
    : 'mr-auto bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-2xl rounded-tr-2xl rounded-br-2xl'

  return (
    <motion.div
      className={`max-w-[80%] p-3 mb-2 ${containerClass}`}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="text-sm break-words whitespace-pre-wrap">{text}</div>
      <div className="flex items-center justify-end mt-1 gap-1">
        <span className="text-xs opacity-70">{formattedTime}</span>
        {isOutgoing && (
          <span className="text-xs">
            {isRead ? '✓✓' : '✓'}
          </span>
        )}
      </div>
    </motion.div>
  )
}
