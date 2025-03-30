import WebApp from '@twa-dev/sdk'
import { User, saveUser, getCurrentUser } from './user'

// Интерфейс для данных пользователя из Telegram
export interface TelegramUserData {
  id: string
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

// Проверяем, запущено ли приложение в окружении Telegram WebApp
export const isTelegramWebApp = (): boolean => {
  return !!WebApp.initData && WebApp.initData.length > 0
}

// Получить данные пользователя из Telegram WebApp
export const getTelegramUserData = (): TelegramUserData | null => {
  try {
    if (!isTelegramWebApp()) {
      console.log('Приложение не запущено в Telegram WebApp')
      return null
    }

    // Попытка получить данные пользователя
    const user = WebApp.initDataUnsafe?.user

    if (!user) {
      console.log('Данные пользователя не найдены в Telegram WebApp')
      return null
    }

    // Преобразуем объект пользователя в формат TelegramUserData
    const telegramUserData: TelegramUserData = {
      id: user.id ? user.id.toString() : '',
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      photo_url: user.photo_url,
      auth_date: Math.floor(Date.now() / 1000), // Текущее время в unix timestamp
      hash: WebApp.initData // Используем полный initData в качестве hash для проверки подлинности
    }

    return telegramUserData
  } catch (error) {
    console.error('Ошибка при получении данных пользователя из Telegram:', error)
    return null
  }
}

// Сохранить данные пользователя из Telegram и объединить с существующими данными
export const saveTelegramUserData = (telegramUserData: TelegramUserData): User | null => {
  try {
    // Получаем текущего пользователя, если он есть
    let currentUser = getCurrentUser()

    // Если пользователь не существует, создаем нового
    if (!currentUser) {
      const userId = `user_${Date.now()}`
      currentUser = {
        id: userId,
        name: telegramUserData.first_name + (telegramUserData.last_name ? ' ' + telegramUserData.last_name : ''),
        age: 0, // Возраст не указан, потребуется заполнение профиля
        isAnonymous: false,
        interests: [],
        rating: 0,
        createdAt: Date.now(),
        lastActive: Date.now(),
        verified: true, // Отмечаем как подтвержденного
        telegramData: {
          telegramId: telegramUserData.id,
          username: telegramUserData.username,
          firstName: telegramUserData.first_name,
          lastName: telegramUserData.last_name,
          photoUrl: telegramUserData.photo_url,
          authDate: telegramUserData.auth_date
        }
      }
    } else {
      // Обновляем данные существующего пользователя
      currentUser.verified = true
      if (!currentUser.telegramData) {
        currentUser.telegramData = {}
      }
      currentUser.telegramData.telegramId = telegramUserData.id
      currentUser.telegramData.username = telegramUserData.username
      currentUser.telegramData.firstName = telegramUserData.first_name
      currentUser.telegramData.lastName = telegramUserData.last_name
      currentUser.telegramData.photoUrl = telegramUserData.photo_url
      currentUser.telegramData.authDate = telegramUserData.auth_date

      // Если у пользователя нет имени, устанавливаем имя из Telegram
      if (!currentUser.name) {
        currentUser.name = telegramUserData.first_name + (telegramUserData.last_name ? ' ' + telegramUserData.last_name : '')
      }
    }

    // Сохраняем обновленного пользователя
    saveUser(currentUser)

    // Показываем уведомление об успешной авторизации
    WebApp.showPopup({
      title: 'Успешная авторизация',
      message: `Вы авторизованы как ${telegramUserData.first_name}!`,
      buttons: [{ type: 'ok' }]
    })

    return currentUser
  } catch (error) {
    console.error('Ошибка при сохранении данных пользователя из Telegram:', error)

    // Показываем уведомление об ошибке
    WebApp.showPopup({
      title: 'Ошибка авторизации',
      message: 'Не удалось сохранить данные пользователя. Пожалуйста, попробуйте еще раз.',
      buttons: [{ type: 'ok' }]
    })

    return null
  }
}

// Проверка, авторизован ли пользователь через Telegram
export const isUserVerified = (): boolean => {
  const currentUser = getCurrentUser()
  return !!currentUser?.verified && !!currentUser?.telegramData?.telegramId
}

// Получить URL для авторизации в режиме разработки (когда не запущено в Telegram)
export const getMockTelegramAuthUrl = (): string => {
  return '/verify-telegram-mock'
}

// Начать процесс авторизации через Telegram
export const startTelegramAuth = (): void => {
  // Если приложение запущено в Telegram WebApp
  if (isTelegramWebApp()) {
    const telegramUserData = getTelegramUserData()

    if (telegramUserData) {
      saveTelegramUserData(telegramUserData)
    } else {
      WebApp.showPopup({
        title: 'Ошибка авторизации',
        message: 'Не удалось получить данные пользователя из Telegram. Пожалуйста, попробуйте еще раз.',
        buttons: [{ type: 'ok' }]
      })
    }
  } else {
    // Для тестирования вне Telegram, перенаправляем на страницу с имитацией авторизации
    window.location.href = getMockTelegramAuthUrl()
  }
}
