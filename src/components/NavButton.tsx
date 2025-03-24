import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

interface NavButtonProps {
  to: string
  icon: string
  label: string
  isActive?: boolean
  hasNotification?: boolean
  onClick?: () => void
}

export const NavButton: React.FC<NavButtonProps> = ({
  to,
  icon,
  label,
  isActive = false,
  hasNotification = false,
  onClick
}) => {
  // Добавляем явно CSS-классы для унификации стилей
  const baseClass = 'nav-button'
  const activeClass = isActive ? 'active' : ''

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      className={`${baseClass} ${activeClass}`}
    >
      <Link
        to={to}
        onClick={onClick}
        className="flex flex-col items-center"
      >
        <div className="relative">
          <span className="nav-button-icon">{icon}</span>
          {hasNotification && (
            <span className="notification-badge absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
          )}
        </div>
        <span className="nav-button-label text-xs mt-1">{label}</span>
      </Link>
    </motion.div>
  )
}
