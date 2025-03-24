import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    NotificationContext,
    Notification,
    registerNotificationCallback,
    removeNotification,
    clearAllNotifications,
    addNotification
} from '../utils/notifications'

// Компонент для отображения одного уведомления
const NotificationItem: React.FC<{
    notification: Notification,
    onClose: (id: string) => void
}> = ({ notification, onClose }) => {
    const { id, type, title, message } = notification

    // Автоматически закрываем уведомление через указанное время
    useEffect(() => {
        const duration = notification.duration || 5000
        const timer = setTimeout(() => {
            onClose(id)
        }, duration)

        return () => clearTimeout(timer)
    }, [id, notification.duration, onClose])

    // Определяем стили в зависимости от типа уведомления
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

// Компонент-провайдер для уведомлений
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([])

    // Регистрируем колбэк для обновления уведомлений
    useEffect(() => {
        registerNotificationCallback(setNotifications)

        return () => {
            registerNotificationCallback(() => { })
        }
    }, [])

    // Методы для работы с уведомлениями
    const showSuccess = useCallback((message: string, title?: string, duration?: number): string => {
        return addNotification({ type: 'success', message, title, duration })
    }, [])

    const showError = useCallback((message: string, title?: string, duration?: number): string => {
        return addNotification({ type: 'error', message, title, duration })
    }, [])

    const showInfo = useCallback((message: string, title?: string, duration?: number): string => {
        return addNotification({ type: 'info', message, title, duration })
    }, [])

    const showWarning = useCallback((message: string, title?: string, duration?: number): string => {
        return addNotification({ type: 'warning', message, title, duration })
    }, [])

    const closeNotification = useCallback((id: string): void => {
        removeNotification(id)
    }, [])

    const closeAll = useCallback((): void => {
        clearAllNotifications()
    }, [])

    // Предоставляем методы через контекст
    const contextValue = {
        notifications,
        showSuccess,
        showError,
        showInfo,
        showWarning,
        closeNotification,
        closeAll
    }

    return (
        <NotificationContext.Provider value={contextValue}>
            {children}

            {/* Контейнер для уведомлений */}
            <div className="fixed z-50 p-4 top-0 right-0">
                <AnimatePresence>
                    {notifications.map(notification => (
                        <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onClose={closeNotification}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </NotificationContext.Provider>
    )
}
