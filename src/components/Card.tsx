import React, { ReactNode } from 'react'
import { motion } from 'framer-motion'
import WebApp from '@twa-dev/sdk'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  initial?: any
  animate?: any
  transition?: any
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  initial,
  animate,
  transition
}) => {
  const isDarkTheme = WebApp.colorScheme === 'dark'
  const baseClass = `rounded-lg overflow-hidden shadow-md ${isDarkTheme
    ? 'bg-gray-800 border border-gray-700'
    : 'bg-white border border-gray-200'
    }`
  const clickableClass = onClick ? 'cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]' : ''
  const fullClass = `${baseClass} ${clickableClass} ${className}`

  const cardProps: any = {}

  // Добавляем анимационные свойства, если они переданы
  if (initial) cardProps.initial = initial
  if (animate) cardProps.animate = animate
  if (transition) cardProps.transition = transition

  return (
    <motion.div
      className={fullClass}
      onClick={onClick}
      {...cardProps}
      layout // Добавляем layout для плавной адаптации размера
    >
      {children}
    </motion.div>
  )
}
