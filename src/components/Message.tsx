import WebApp from '@twa-dev/sdk'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

// Интерфейс для пропсов сообщения
interface MessageProps {
  text: string
  timestamp: number
  isOwn: boolean
  senderName?: string
}

export const Message = ({ text, timestamp, isOwn, senderName }: MessageProps) => {
  // Используем тему Telegram для стилизации
  const isDarkTheme = WebApp.colorScheme === 'dark'

  // Форматируем время
  const formattedTime = formatDistanceToNow(new Date(timestamp), {
    addSuffix: true,
    locale: ru
  })

  return (
    <div
      className={`max-w-[80%] rounded-lg p-3 mb-2 ${
        isOwn
          ? 'bg-blue-500 text-white self-end rounded-br-none'
          : isDarkTheme
            ? 'bg-gray-700 text-white self-start rounded-bl-none'
            : 'bg-gray-200 text-gray-800 self-start rounded-bl-none'
      }`}
    >
      {senderName && !isOwn && (
        <div className="text-xs font-medium mb-1 text-blue-300">
          {senderName}
        </div>
      )}

      <div>{text}</div>

      <div
        className={`text-right text-xs mt-1 ${
          isOwn ? 'text-blue-200' : isDarkTheme ? 'text-gray-400' : 'text-gray-500'
        }`}
      >
        {formattedTime}
      </div>
    </div>
  )
}
