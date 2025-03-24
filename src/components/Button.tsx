import React, { ReactNode } from 'react'
import { motion } from 'framer-motion'
import WebApp from '@twa-dev/sdk'

// Варианты кнопок
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger'

// Интерфейс для пропсов кнопки
export interface ButtonProps {
  children: ReactNode
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void
  variant?: ButtonVariant
  fullWidth?: boolean
  isLoading?: boolean
  className?: string
  size?: 'small' | 'medium' | 'large'
  icon?: React.ReactNode
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  fullWidth = false,
  className = '',
  disabled = false,
  isLoading = false,
  variant = 'primary',
  size = 'medium',
  icon,
  type = 'button'
}) => {
  // Используем тему Telegram для стилизации
  const isDarkTheme = WebApp.colorScheme === 'dark'

  // Базовые классы для всех кнопок
  const baseClasses = 'px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center justify-center'

  // Классы в зависимости от варианта кнопки
  const variantClasses = {
    primary: `bg-blue-500 text-white ${!disabled && 'hover:bg-blue-600 active:bg-blue-700'}`,
    secondary: `${isDarkTheme ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'} ${!disabled && 'hover:opacity-80 active:opacity-70'}`,
    outline: `border ${isDarkTheme ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'} ${!disabled && 'hover:bg-opacity-10 hover:bg-gray-500 active:bg-opacity-20'}`,
    danger: `bg-red-500 text-white ${!disabled && 'hover:bg-red-600 active:bg-red-700'}`
  }

  // Базовые классы по размерам
  const sizeClasses = {
    small: 'py-2 px-3 text-sm',
    medium: 'py-3 px-4',
    large: 'py-4 px-6 text-lg'
  }

  // Классы для состояния загрузки и отключения
  const stateClasses = (isLoading || disabled) ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'

  // Классы для ширины
  const widthClasses = fullWidth ? 'w-full' : ''

  const baseClass = variantClasses[variant]
  const sizeClass = sizeClasses[size]
  const disabledClass = disabled || isLoading ? 'opacity-60 cursor-not-allowed' : ''
  const fullClass = `${baseClass} ${sizeClass} ${widthClasses} ${disabledClass} ${className} tg-animation`

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={fullClass}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
    >
      <div className="flex items-center justify-center">
        {isLoading && (
          <div className="mr-2 w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" />
        )}
        {icon && !isLoading && <span className="mr-2">{icon}</span>}
        {children}
      </div>
    </motion.button>
  )
}
