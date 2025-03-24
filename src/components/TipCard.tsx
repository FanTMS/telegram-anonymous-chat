import { useState } from 'react'
import WebApp from '@twa-dev/sdk'
import { Card } from './Card'
import { ChatTip } from '../utils/beginner-tips'

interface TipCardProps {
  tip: ChatTip
  expanded?: boolean
  onClick?: () => void
  className?: string
}

export const TipCard = ({ tip, expanded = false, onClick, className = '' }: TipCardProps) => {
  const [isExpanded, setIsExpanded] = useState(expanded)

  // Используем тему Telegram для стилизации
  const isDarkTheme = WebApp.colorScheme === 'dark'

  const handleClick = () => {
    setIsExpanded(!isExpanded)
    if (onClick) onClick()
  }

  return (
    <Card
      className={`transition-all ${isExpanded ? 'scale-[1.02]' : ''} ${className}`}
      onClick={handleClick}
    >
      <div className="flex items-start">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl mr-3 flex-shrink-0"
          style={{
            background: 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)',
            color: '#1a202c'
          }}
        >
          {tip.icon}
        </div>

        <div className="flex-1">
          <h3 className="font-medium text-lg mb-1">{tip.title}</h3>

          {isExpanded && (
            <p className={`mt-2 text-sm ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
              {tip.description}
            </p>
          )}
        </div>

        <div className="ml-2 text-lg">
          {isExpanded ? '▼' : '▶'}
        </div>
      </div>
    </Card>
  )
}
