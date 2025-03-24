import { useState } from 'react'
import WebApp from '@twa-dev/sdk'
import { Card } from './Card'
import { Button } from './Button'
import { MessageTemplate } from '../utils/beginner-tips'

interface MessageTemplateCardProps {
  template: MessageTemplate
  onUse?: (text: string) => void
  className?: string
}

export const MessageTemplateCard = ({ template, onUse, className = '' }: MessageTemplateCardProps) => {
  const [isCopied, setIsCopied] = useState(false)

  // Используем тему Telegram для стилизации
  const isDarkTheme = WebApp.colorScheme === 'dark'

  // Обработчик копирования шаблона в буфер обмена
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(template.text)

    // Покажем уведомление о копировании на 2 секунды
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  // Обработчик использования шаблона
  const handleUse = () => {
    if (onUse) {
      onUse(template.text)
    }
  }

  return (
    <Card
      className={`${className}`}
    >
      <div className="mb-1">
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          isDarkTheme ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
        }`}>
          {template.category}
        </span>
      </div>

      <p className={`mb-3 ${isDarkTheme ? 'text-gray-200' : 'text-gray-800'}`}>
        "{template.text}"
      </p>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleCopy}
          fullWidth
          className="text-sm py-1.5"
        >
          {isCopied ? 'Скопировано!' : 'Копировать'}
        </Button>

        <Button
          onClick={handleUse}
          fullWidth
          className="text-sm py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
        >
          Использовать
        </Button>
      </div>
    </Card>
  )
}
