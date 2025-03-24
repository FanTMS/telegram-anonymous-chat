import { useState, useEffect, useCallback } from 'react'
import WebApp from '@twa-dev/sdk'
import { TipCategory, getRandomTip, ChatTip } from '../utils/beginner-tips'

interface ChatTipPopupProps {
  category?: TipCategory
  show: boolean
  onClose: () => void
  className?: string
}

export const ChatTipPopup = ({
  category,
  show,
  onClose,
  className = ''
}: ChatTipPopupProps) => {
  const [tip, setTip] = useState<ChatTip | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  // Используем тему Telegram для стилизации
  const isDarkTheme = WebApp.colorScheme === 'dark'

  // Обработчик закрытия подсказки
  const handleClose = useCallback(() => {
    setIsVisible(false)

    // Небольшая задержка перед вызовом onClose для анимации
    setTimeout(() => {
      onClose()
    }, 300)
  }, [onClose])

  // Генерируем случайный совет при показе
  useEffect(() => {
    if (show) {
      const randomTip = getRandomTip(category)
      setTip(randomTip)
      setIsVisible(true)

      // Автоматически скрываем подсказку через 8 секунд
      const timer = setTimeout(() => {
        handleClose()
      }, 8000)

      return () => clearTimeout(timer)
    }
  }, [show, category, handleClose])

  // Если нет подсказки или не нужно показывать, не отображаем ничего
  if (!tip || !show) {
    return null
  }

  return (
    <div
      className={`fixed bottom-20 left-0 right-0 flex justify-center items-center px-4 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      } ${className}`}
    >
      <div
        className={`max-w-md p-4 rounded-lg shadow-xl ${
          isDarkTheme
            ? 'bg-gray-800 text-white'
            : 'bg-white text-gray-800'
        }`}
      >
        <div className="flex items-start">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl mr-3 flex-shrink-0"
            style={{
              background: 'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)',
              color: '#1a202c'
            }}
          >
            {tip.icon}
          </div>

          <div className="flex-1">
            <h3 className="font-medium text-lg mb-1">{tip.title}</h3>
            <p className={`text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
              {tip.description}
            </p>
          </div>

          <button
            className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            onClick={handleClose}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
