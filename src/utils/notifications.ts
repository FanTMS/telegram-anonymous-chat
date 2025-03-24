import { createContext, useContext } from 'react'

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

// Интерфейс контекста уведомлений
export interface NotificationContextType {
  notifications: Notification[]
  showSuccess: (message: string, title?: string, duration?: number) => string
  showError: (message: string, title?: string, duration?: number) => string
  showInfo: (message: string, title?: string, duration?: number) => string
  showWarning: (message: string, title?: string, duration?: number) => string
  closeNotification: (id: string) => void
  closeAll: () => void
}

// Создаем контекст для уведомлений
export const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  showSuccess: () => '',
  showError: () => '',
  showInfo: () => '',
  showWarning: () => '',
  closeNotification: () => { },
  closeAll: () => { }
})

// Хук для использования уведомлений в компонентах
export const useNotifications = () => {
  const context = useContext(NotificationContext)

  if (!context) {
    console.warn('useNotifications должен использоваться внутри NotificationProvider')

    // Возвращаем заглушку, чтобы избежать ошибок
    return {
      notifications: [],
      showSuccess: () => '',
      showError: () => '',
      showInfo: () => '',
      showWarning: () => '',
      closeNotification: () => { },
      closeAll: () => { }
    }
  }

  return context
}

// Функции для работы с уведомлениями вне React
// Поскольку вне React нельзя использовать хуки, создаем альтернативный API

// Создаем временное хранилище для уведомлений
const tempNotifications: Notification[] = []
let notificationCallback: ((notifications: Notification[]) => void) | null = null

// Регистрируем колбэк для обновления уведомлений в React
export const registerNotificationCallback = (callback: (notifications: Notification[]) => void) => {
  notificationCallback = callback

  // Отправляем текущие уведомления
  if (tempNotifications.length > 0) {
    callback([...tempNotifications])
  }
}

// Добавляем уведомление
export const addNotification = (notification: Omit<Notification, 'id'>): string => {
  const id = Date.now().toString()
  const newNotification = { ...notification, id }

  tempNotifications.push(newNotification)

  // Если есть колбэк, вызываем его
  if (notificationCallback) {
    notificationCallback([...tempNotifications])
  }

  // Если указана длительность, устанавливаем таймер на удаление
  if (notification.duration) {
    setTimeout(() => {
      removeNotification(id)
    }, notification.duration)
  }

  return id
}

// Удаляем уведомление
export const removeNotification = (id: string): void => {
  const index = tempNotifications.findIndex(n => n.id === id)

  if (index !== -1) {
    tempNotifications.splice(index, 1)

    // Если есть колбэк, вызываем его
    if (notificationCallback) {
      notificationCallback([...tempNotifications])
    }
  }
}

// Удаляем все уведомления
export const clearAllNotifications = (): void => {
  tempNotifications.length = 0

  // Если есть колбэк, вызываем его
  if (notificationCallback) {
    notificationCallback([])
  }
}

// Хелперы для разных типов уведомлений
export const showSuccessNotification = (message: string, title?: string, duration: number = 5000): string => {
  return addNotification({ type: 'success', message, title, duration })
}

export const showError = (message: string, title?: string, duration: number = 5000): string => {
  return addNotification({ type: 'error', message, title, duration })
}

export const showInfoNotification = (message: string, title?: string, duration: number = 5000): string => {
  return addNotification({ type: 'info', message, title, duration })
}

export const showWarningNotification = (message: string, title?: string, duration: number = 5000): string => {
  return addNotification({ type: 'warning', message, title, duration })
}

// Хук для использования уведомлений в компонентах
export const useNotificationService = () => {
  return useContext(NotificationContext)
}

// Функция для показа нотификации о новом сообщении
export const showNewMessageNotification = (
  showInfo: (message: string, title?: string, duration?: number) => string,
  message: {
    senderId: string
    senderName?: string
    text: string
  }
) => {
  // Определяем имя отправителя
  const senderName = message.senderName || 'Анонимный собеседник'

  // Ограничиваем длину сообщения для уведомления
  const MAX_TEXT_LENGTH = 50
  const shortText = message.text.length > MAX_TEXT_LENGTH
    ? `${message.text.substring(0, MAX_TEXT_LENGTH)}...`
    : message.text

  return showInfo(shortText, `Новое сообщение от ${senderName}`, 5000)
}

// Функция для показа уведомления о новом собеседнике
export const showNewChatMatchNotification = (
  showSuccess: (message: string, title?: string, duration?: number) => string,
  matchInfo: {
    interestsMatched?: string[]
  } = {}
) => {
  let message = 'Мы нашли вам собеседника!'

  // Если есть совпадающие интересы, покажем их
  if (matchInfo.interestsMatched && matchInfo.interestsMatched.length > 0) {
    const interests = matchInfo.interestsMatched.join(', ')
    message = `Мы нашли собеседника с общими интересами: ${interests}`
  }

  return showSuccess(message, 'Собеседник найден!', 8000)
}

// Функция для показа уведомления о разрыве соединения
export const showChatEndedNotification = (
  showWarning: (message: string, title?: string, duration?: number) => string,
  reason?: string
) => {
  let message = 'Собеседник завершил чат'

  if (reason) {
    message = `Собеседник завершил чат. Причина: ${reason}`
  }

  return showWarning(message, 'Чат завершен', 7000)
}

// Функция для показа уведомления о системных событиях
export const showSystemNotification = (
  showInfo: (message: string, title?: string, duration?: number) => string,
  message: string
) => {
  return showInfo(message, 'Системное уведомление', 5000)
}

// Функция для показа уведомления об ошибке
export const showErrorNotificationMessage = (
  showError: (message: string, title?: string, duration?: number) => string,
  error: Error | string
) => {
  const errorMessage = typeof error === 'string' ? error : error.message
  return showError(errorMessage, 'Ошибка', 7000)
}
