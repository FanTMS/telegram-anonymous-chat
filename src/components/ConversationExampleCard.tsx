import { useState } from 'react'
import WebApp from '@twa-dev/sdk'
import { Card } from './Card'
import { ConversationExample } from '../utils/beginner-tips'

interface ConversationExampleCardProps {
  example: ConversationExample
  expanded?: boolean
  className?: string
}

export const ConversationExampleCard = ({
  example,
  expanded = false,
  className = ''
}: ConversationExampleCardProps) => {
  const [isExpanded, setIsExpanded] = useState(expanded)

  // Используем тему Telegram для стилизации
  const isDarkTheme = WebApp.colorScheme === 'dark'

  // Обработчик разворачивания/сворачивания карточки
  const handleToggle = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <Card className={`${className}`}>
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={handleToggle}
      >
        <h3 className="font-medium text-lg">{example.title}</h3>
        <div className="text-lg">{isExpanded ? '▼' : '▶'}</div>
      </div>

      {isExpanded && (
        <div className="mt-3 border-t pt-3 space-y-2.5">
          {example.messages.map((message, index) => (
            <div
              key={index}
              className={`p-2.5 rounded-lg max-w-[85%] ${
                message.sender === 'you'
                  ? 'bg-blue-500 text-white self-end ml-auto rounded-br-none'
                  : isDarkTheme
                    ? 'bg-gray-700 text-white self-start rounded-bl-none'
                    : 'bg-gray-200 text-gray-800 self-start rounded-bl-none'
              }`}
            >
              {message.text}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
