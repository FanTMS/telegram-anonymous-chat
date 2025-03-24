import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Типы уведомлений
export type NotificationType = 'success' | 'error' | 'info' | 'warning'

// Интерфейс уведомления
export interface Notification {
  id: string
  type: NotificationType
  title?: string
  message: string
  duration?: number
}

interface NotificationItemProps {
  notification: Notification
  onClose: (id: string) => void
}

// Компонент для отдельного уведомления
const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClose }) => {
  const { id, type, title, message, duration = 5000 } = notification

  // Автоматически закрываем уведомление через указанное время
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onClose])

  // Определяем цвета и иконку в зависимости от типа уведомления
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          bgColor: 'bg-green-100 dark:bg-green-900/40',
          borderColor: 'border-green-500',
          textColor: 'text-green-800 dark:text-green-100',
          icon: '✅'
        }
      case 'error':
        return {
          bgColor: 'bg-red-100 dark:bg-red-900/40',
          borderColor: 'border-red-500',
          textColor: 'text-red-800 dark:text-red-100',
          icon: '❌'
        }
      case 'warning':
        return {
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/40',
          borderColor: 'border-yellow-500',
          textColor: 'text-yellow-800 dark:text-yellow-100',
          icon: '⚠️'
        }
      case 'info':
      default:
        return {
          bgColor: 'bg-blue-100 dark:bg-blue-900/40',
          borderColor: 'border-blue-500',
          textColor: 'text-blue-800 dark:text-blue-100',
          icon: 'ℹ️'
        }
    }
  }

  const styles = getTypeStyles()

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      className={`${styles.bgColor} ${styles.borderColor} ${styles.textColor} border-l-4 rounded-md shadow-md p-4 mb-2 max-w-sm`}
    >
      <div className="flex">
        <div className="flex-shrink-0 mr-3">
          <span className="text-lg">{styles.icon}</span>
        </div>
        <div className="flex-1">
          {title && <div className="font-medium">{title}</div>}
          <div className="text-sm">{message}</div>
        </div>
        <button
          onClick={() => onClose(id)}
          className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        >
          ✕
        </button>
      </div>
    </motion.div>
  )
}

// Хук для управления уведомлениями
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Добавляем новое уведомление
  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString()
    setNotifications(prev => [...prev, { ...notification, id }])
    return id
  }

  // Показываем уведомление об успехе
  const showSuccess = (message: string, title?: string, duration?: number) => {
    return addNotification({ type: 'success', message, title, duration })
  }

  // Показываем уведомление об ошибке
  const showError = (message: string, title?: string, duration?: number) => {
    return addNotification({ type: 'error', message, title, duration })
  }

  // Показываем информационное уведомление
  const showInfo = (message: string, title?: string, duration?: number) => {
    return addNotification({ type: 'info', message, title, duration })
  }

  // Показываем предупреждение
  const showWarning = (message: string, title?: string, duration?: number) => {
    return addNotification({ type: 'warning', message, title, duration })
  }

  // Закрываем уведомление по ID
  const closeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  // Закрываем все уведомления
  const closeAll = () => {
    setNotifications([])
  }

  return {
    notifications,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    closeNotification,
    closeAll
  }
}

// Компонент для отображения списка уведомлений
interface NotificationContainerProps {
  notifications: Notification[]
  onClose: (id: string) => void
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onClose,
  position = 'top-right'
}) => {
  // Определяем позицию контейнера
  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-0 left-0'
      case 'bottom-right':
        return 'bottom-0 right-0'
      case 'bottom-left':
        return 'bottom-0 left-0'
      case 'top-center':
        return 'top-0 left-1/2 transform -translate-x-1/2'
      case 'bottom-center':
        return 'bottom-0 left-1/2 transform -translate-x-1/2'
      case 'top-right':
      default:
        return 'top-0 right-0'
    }
  }

  // Если нет уведомлений, не рендерим ничего
  if (notifications.length === 0) {
    return null
  }

  return (
    <div className={`fixed z-50 p-4 ${getPositionClasses()}`}>
      <AnimatePresence>
        {notifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onClose={onClose}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
