import { useState, useRef, useEffect } from 'react'
import { Button } from './Button'
import { messageRequiresModeration } from '../utils/moderation'
import WebApp from '@twa-dev/sdk'

interface MessageInputProps {
  onSendMessage: (text: string) => void
  disabled?: boolean
  placeholder?: string
}

export const MessageInput = ({
  onSendMessage,
  disabled = false,
  placeholder = 'Введите сообщение...'
}: MessageInputProps) => {
  const [message, setMessage] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [isModeratingMessage, setIsModeratingMessage] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Авторесайз текстового поля
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(120, textareaRef.current.scrollHeight)}px`
    }
  }, [message])

  // Обработчик изменения текста
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
  }

  // Обработчик отправки сообщения
  const handleSendMessage = () => {
    if (!message.trim() || disabled) return

    // Проверяем, требуется ли модерация
    const needsModeration = messageRequiresModeration(message)

    if (needsModeration) {
      // Уведомляем пользователя о модерации
      setIsModeratingMessage(true)

      WebApp.showPopup({
        title: 'Сообщение на модерации',
        message: 'Ваше сообщение содержит контент, который требует проверки модератором. Оно будет отправлено после проверки.',
        buttons: [{ type: 'ok' }]
      })

      // В реальном приложении здесь был бы код для отправки сообщения на модерацию
      // Для демонстрации просто обнуляем поле ввода
      setMessage('')
      setIsExpanded(false)
      setIsModeratingMessage(false)
    } else {
      // Отправляем сообщение напрямую
      onSendMessage(message.trim())
      setMessage('')
      setIsExpanded(false)
    }
  }

  // Обработчик нажатия Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="relative">
      <div className={`flex items-end border rounded-lg overflow-hidden transition-shadow ${isExpanded ? 'shadow-md' : ''}`}>
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsExpanded(true)}
          onBlur={() => setIsExpanded(false)}
          placeholder={placeholder}
          disabled={disabled || isModeratingMessage}
          className="flex-1 p-3 resize-none outline-none text-sm min-h-[44px] max-h-[120px]"
          rows={1}
        />
        <Button
          onClick={handleSendMessage}
          disabled={!message.trim() || disabled || isModeratingMessage}
          className="m-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
        >
          <span className="text-lg">📤</span>
        </Button>
      </div>

      {isModeratingMessage && (
        <div className="text-xs text-amber-600 mt-1">
          Сообщение отправлено на модерацию
        </div>
      )}
    </div>
  )
}
