import WebApp from '@twa-dev/sdk'
import { User, saveUser, getCurrentUser } from './user'

// Интерфейс для пользователя Telegram
interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  language_code?: string
}

// Проверка, запущено ли приложение в окружении Telegram
export const isInTelegram = (): boolean => {
  return WebApp.isExpanded !== undefined
}

// Получение данных пользователя из Telegram
export const getTelegramUser = (): TelegramUser | null => {
  try {
    // Проверяем, запущено ли приложение в Telegram
    if (!isInTelegram()) {
      console.log('Приложение не запущено в окружении Telegram')
      return null
    }

    // Получаем данные пользователя
    const user = WebApp.initDataUnsafe?.user

    if (!user) {
      console.log('Данные пользователя не найдены')
      return null
    }

    return user
  } catch (error) {
    console.error('Ошибка при получении данных пользователя из Telegram:', error)
    return null
  }
}

// Создание или обновление пользователя на основе данных из Telegram
export const initializeUserFromTelegram = (): User | null => {
  try {
    // Получаем данные пользователя из Telegram
    const telegramUser = getTelegramUser()

    if (!telegramUser) {
      console.log('Не удалось получить данные пользователя из Telegram')
      return null
    }

    // Ищем пользователя по Telegram ID в локальном хранилище
    const existingUsers = Object.keys(localStorage)
      .filter(key => key.startsWith('user_'))
      .map(key => {
        try {
          return JSON.parse(localStorage.getItem(key) || '{}') as User
        } catch {
          return null
        }
      })
      .filter(user => user !== null && user.telegramData?.telegramId === telegramUser.id.toString()) as User[]

    if (existingUsers.length > 0) {
      // Пользователь существует, обновляем время последней активности
      const user = existingUsers[0]
      user.lastActive = Date.now()

      // Обновляем локальное хранилище
      saveUser(user)
      console.log(`Пользователь с Telegram ID ${telegramUser.id} найден и обновлен`)
      return user
    } else {
      // Создаем нового пользователя
      const userId = `user_${Date.now()}`
      const newUser: User = {
        id: userId,
        name: telegramUser.first_name + (telegramUser.last_name ? ' ' + telegramUser.last_name : ''),
        age: 25, // Значение по умолчанию, пользователь сможет изменить позже
        isAnonymous: false,
        interests: [],
        rating: 0,
        createdAt: Date.now(),
        lastActive: Date.now(),
        telegramData: {
          telegramId: telegramUser.id.toString(),
          username: telegramUser.username,
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          photoUrl: telegramUser.photo_url
        }
      }

      // Сохраняем нового пользователя
      saveUser(newUser)
      console.log(`Создан новый пользователь с Telegram ID ${telegramUser.id}`)
      return newUser
    }
  } catch (error) {
    console.error('Ошибка при инициализации пользователя из Telegram:', error)
    return null
  }
}

// Проверка, является ли пользователь авторизованным через Telegram
export const isTelegramUser = (user: User | null): boolean => {
  return user !== null && !!user.telegramData?.telegramId
}

// Уведомить пользователя через нативный интерфейс Telegram
export const notifyUser = (message: string): void => {
  WebApp.showPopup({
    title: 'Уведомление',
    message,
    buttons: [{ type: 'ok' }]
  })
}

// Закрыть приложение Telegram Web App
export const closeApp = (): void => {
  WebApp.close()
}
