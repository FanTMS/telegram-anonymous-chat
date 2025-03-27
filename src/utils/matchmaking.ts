import { Chat } from './chat'
import { getCurrentUser, getUserById, User } from './user'
import { getInterestScore } from './interests'
import ChatEventManager from './chat-events'

// Представляет пользователя в системе поиска
interface SearchingUser {
  userId: string
  startedAt: number
  interests: string[]
  ageRange: [number, number]
  isRandomSearch: boolean
}

// Интерфейс для уведомления о новом чате
export interface ChatNotification {
  chatId: string
  otherUserId: string
  timestamp: number
  isRead: boolean
}

// Глобальное хранилище поиска
let searchingUsers: SearchingUser[] = []

// Глобальное состояние для сервиса поиска собеседников
let matchmakingServiceId: number | null = null
let timeoutIds: number[] = []

// Максимальное время поиска в миллисекундах (15 минут)
const MAX_SEARCH_TIME = 15 * 60 * 1000

/**
 * Начать поиск собеседника
 */
export const startSearching = (
  isRandomSearch: boolean,
  interests: string[] = [],
  ageRange: [number, number] = [0, 100]
): boolean => {
  try {
    const user = getCurrentUser()
    if (!user) {
      console.error('[matchmaking] Ошибка: Пользователь не авторизован')
      return false
    }

    console.log(`[matchmaking] Начат поиск собеседника для ${user.id}. Режим: ${isRandomSearch ? 'случайный' : 'по интересам'}`)

    // Проверяем, не находится ли пользователь уже в поиске
    const existingIndex = searchingUsers.findIndex((item) => item.userId === user.id)
    if (existingIndex !== -1) {
      console.log(`[matchmaking] Пользователь ${user.id} уже в поиске. Обновляем параметры...`)
      // Если пользователь уже в поиске, обновляем его параметры
      searchingUsers[existingIndex] = {
        userId: user.id,
        startedAt: Date.now(),
        interests: [...interests],
        ageRange,
        isRandomSearch
      }
    } else {
      // Добавляем пользователя в список поиска
      searchingUsers.push({
        userId: user.id,
        startedAt: Date.now(),
        interests: [...interests],
        ageRange,
        isRandomSearch
      })
    }

    // Сохраняем состояние поиска в localStorage
    localStorage.setItem(`searching_${user.id}`, 'true')

    console.log(`[matchmaking] Пользователь ${user.id} добавлен в поиск. Всего в поиске: ${searchingUsers.length}`)
    console.log(searchingUsers)

    // Запускаем немедленную проверку совпадений
    triggerMatchmaking().then((found) => {
      if (found) console.log(`[matchmaking] Найдено совпадение сразу после запуска поиска для ${user.id}!`)
    })

    return true
  } catch (error) {
    console.error('[matchmaking] Ошибка при запуске поиска:', error)
    return false
  }
}

/**
 * Остановить поиск собеседника для конкретного пользователя
 */
export const stopSearching = (userId?: string): boolean => {
  try {
    // Если userId не передан, используем текущего пользователя
    const userToStop = userId || (getCurrentUser()?.id)
    if (!userToStop) {
      console.error('[matchmaking] Ошибка: Не указан ID пользователя для остановки поиска')
      return false
    }

    console.log(`[matchmaking] Остановка поиска для пользователя ${userToStop}`)

    // Удаляем пользователя из списка поиска
    searchingUsers = searchingUsers.filter((user) => user.userId !== userToStop)

    // Сбрасываем флаг поиска в localStorage
    localStorage.removeItem(`searching_${userToStop}`)

    console.log(`[matchmaking] Поиск для ${userToStop} остановлен. Осталось в поиске: ${searchingUsers.length}`)
    return true
  } catch (error) {
    console.error('[matchmaking] Ошибка при остановке поиска:', error)
    return false
  }
}

/**
 * Проверяет, находится ли указанный пользователь в поиске
 */
export const isUserSearching = (userId: string): boolean => {
  try {
    // Проверяем локальное состояние
    const isSearching = searchingUsers.some((user) => user.userId === userId)

    // Проверяем флаг в localStorage
    const storedFlag = localStorage.getItem(`searching_${userId}`) === 'true'

    return isSearching || storedFlag
  } catch (error) {
    console.error('[matchmaking] Ошибка при проверке статуса поиска:', error)
    return false
  }
}

/**
 * Запускает сервис подбора собеседников
 * @param intervalMs Интервал проверки в миллисекундах
 * @returns ID сервиса для последующей остановки
 */
export const startMatchmakingService = (intervalMs: number = 5000): number => {
  // Останавливаем предыдущий сервис, если он был запущен
  if (matchmakingServiceId) {
    stopMatchmakingService(matchmakingServiceId)
  }

  console.log(`[matchmaking] Запуск сервиса подбора собеседников с интервалом ${intervalMs}ms`)

  // Запускаем периодические проверки
  const serviceId = window.setInterval(() => {
    triggerMatchmaking()
  }, intervalMs)

  matchmakingServiceId = serviceId
  return serviceId
}

/**
 * Останавливает сервис подбора собеседников
 */
export const stopMatchmakingService = (serviceId?: number): void => {
  const idToStop = serviceId || matchmakingServiceId

  if (idToStop) {
    console.log(`[matchmaking] Остановка сервиса подбора собеседников ${idToStop}`)
    window.clearInterval(idToStop)

    if (serviceId === matchmakingServiceId) {
      matchmakingServiceId = null
    }
  }

  // Очищаем все отложенные вызовы
  timeoutIds.forEach(id => window.clearTimeout(id))
  timeoutIds = []
}

/**
 * Проверяет, не превышено ли максимальное время поиска
 */
export const shouldContinueSearch = (userId: string): boolean => {
  const searchingUser = searchingUsers.find(u => u.userId === userId)
  if (!searchingUser) return false

  const now = Date.now()
  return (now - searchingUser.startedAt) < MAX_SEARCH_TIME
}

/**
 * Запускает поиск совпадений среди пользователей в поиске
 * @returns Promise<boolean> - true если найдено совпадение
 */
export const triggerMatchmaking = async (): Promise<boolean> => {
  try {
    if (searchingUsers.length < 2) {
      // Недостаточно пользователей для поиска пары
      return false
    }

    console.log(`[matchmaking] Запуск поиска совпадений. Пользователей в поиске: ${searchingUsers.length}`)

    // Удаляем пользователей, для которых превышено максимальное время поиска
    searchingUsers = searchingUsers.filter(user => shouldContinueSearch(user.userId))

    // Для каждого пользователя в поиске
    for (let i = 0; i < searchingUsers.length; i++) {
      const user1 = searchingUsers[i]
      const currentUser = await getUserById(user1.userId)

      if (!currentUser) {
        console.warn(`[matchmaking] Пользователь ${user1.userId} из списка поиска не найден в базе`)
        continue
      }

      // Ищем подходящую пару
      for (let j = 0; j < searchingUsers.length; j++) {
        // Пропускаем того же пользователя
        if (i === j) continue

        const user2 = searchingUsers[j]
        const otherUser = await getUserById(user2.userId)

        if (!otherUser) {
          console.warn(`[matchmaking] Пользователь ${user2.userId} из списка поиска не найден в базе`)
          continue
        }

        // Проверяем совместимость
        const compatible = checkCompatibility(user1, user2)

        if (compatible) {
          console.log(`[matchmaking] 🎉 Найдено совпадение между ${user1.userId} и ${user2.userId}!`)

          // Создаем чат
          const chatResult = await createChatForUsers(user1.userId, user2.userId)

          if (chatResult && chatResult.success) {
            // Удаляем пользователей из списка поиска
            stopSearching(user1.userId)
            stopSearching(user2.userId)

            // Отправляем события об успешном совпадении
            ChatEventManager.emitChatCreated(chatResult.chatId, [user1.userId, user2.userId])

            return true
          }
        }
      }
    }

    return false
  } catch (error) {
    console.error('[matchmaking] Ошибка при поиске совпадений:', error)
    return false
  }
}

/**
 * Проверяет совместимость пользователей
 */
const checkCompatibility = (user1: SearchingUser, user2: SearchingUser): boolean => {
  // Если оба ищут случайного собеседника - они совместимы
  if (user1.isRandomSearch && user2.isRandomSearch) {
    return true
  }

  // Если один ищет случайного, а другой по интересам - не совместимы
  if (user1.isRandomSearch !== user2.isRandomSearch) {
    return false
  }

  // Оба ищут по интересам - проверяем совместимость интересов
  if (user1.interests.length === 0 || user2.interests.length === 0) {
    return false
  }

  // Находим общие интересы
  const commonInterests = user1.interests.filter(interest =>
    user2.interests.includes(interest)
  )

  // Если есть хотя бы один общий интерес - пользователи совместимы
  return commonInterests.length > 0
}

/**
 * Создает чат для двух пользователей
 */
const createChatForUsers = async (userId1: string, userId2: string): Promise<{ success: boolean, chatId: string }> => {
  try {
    // Импортируем функцию создания чата только здесь, чтобы избежать циклических зависимостей
    const { createChat } = await import('./chat')

    // Создаем чат с обоими пользователями
    const chat = createChat([userId1, userId2])

    if (!chat) {
      throw new Error('Не удалось создать чат')
    }

    console.log(`[matchmaking] Создан новый чат: ${chat.id} для пользователей ${userId1} и ${userId2}`)

    // Добавляем уведомления о новом чате для обоих пользователей
    addChatNotification(userId1, chat.id, userId2)
    addChatNotification(userId2, chat.id, userId1)

    return { success: true, chatId: chat.id }
  } catch (error) {
    console.error('[matchmaking] Ошибка при создании чата:', error)
    return { success: false, chatId: '' }
  }
}

/**
 * Возвращает список пользователей в поиске
 */
export const getSearchingUsers = (): SearchingUser[] => {
  return searchingUsers
}

/**
 * Добавляет уведомление о новом чате
 */
const addChatNotification = (userId: string, chatId: string, otherUserId: string): void => {
  try {
    // Создаем флаг нового чата
    localStorage.setItem(`new_chat_flag_${userId}`, 'true')

    // Создаем уведомление о чате
    const notification: ChatNotification = {
      chatId,
      otherUserId,
      timestamp: Date.now(),
      isRead: false
    }

    localStorage.setItem(`new_chat_notification_${userId}`, JSON.stringify(notification))

    // Отправляем событие уведомления о новом чате
    ChatEventManager.emitNewChatNotification(chatId, userId, otherUserId)

    console.log(`[matchmaking] Добавлено уведомление о чате ${chatId} для пользователя ${userId}`)
  } catch (error) {
    console.error('[matchmaking] Ошибка при создании уведомления о чате:', error)
  }
}

/**
 * Проверяет наличие нового чата для пользователя
 */
export const hasNewChat = (userId: string): boolean => {
  return localStorage.getItem(`new_chat_flag_${userId}`) === 'true'
}

/**
 * Возвращает уведомление о новом чате
 */
export const getNewChatNotification = (userId: string): ChatNotification | null => {
  try {
    const notification = localStorage.getItem(`new_chat_notification_${userId}`)
    return notification ? JSON.parse(notification) : null
  } catch (error) {
    console.error('[matchmaking] Ошибка при получении уведомления о чате:', error)
    return null
  }
}

/**
 * Помечает уведомление о чате как прочитанное
 */
export const markChatNotificationAsRead = (userId: string): void => {
  try {
    localStorage.removeItem(`new_chat_flag_${userId}`)

    const notificationKey = `new_chat_notification_${userId}`
    const notificationData = localStorage.getItem(notificationKey)

    if (notificationData) {
      const notification: ChatNotification = JSON.parse(notificationData)
      notification.isRead = true
      localStorage.setItem(notificationKey, JSON.stringify(notification))
    }
  } catch (error) {
    console.error('[matchmaking] Ошибка при пометке уведомления как прочитанного:', error)
  }
}

/**
 * Создает тестовый чат для отладки
 * Эта функция должна использоваться только на странице отладки
 */
export const createTestChat = async (userId: string, partnerName?: string): Promise<string | null> => {
  try {
    // Получаем текущего пользователя
    const currentUser = getCurrentUser()
    if (!currentUser) {
      throw new Error('Пользователь не авторизован')
    }

    // Создаем фиктивного пользователя, если не указано имя
    const testPartnerName = partnerName || `Test Partner ${Date.now().toString().slice(-4)}`

    // Генерируем уникальный ID для тестового пользователя
    const testPartnerId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    // Создаем тестового пользователя
    const testPartner: User = {
      id: testPartnerId,
      name: testPartnerName,
      username: `test_${testPartnerName.toLowerCase().replace(/\s+/g, '_')}`,
      isAnonymous: true,
      interests: ['Тестирование', 'Отладка'],
      rating: 5,
      createdAt: Date.now(),
      lastActive: Date.now()
    }

    // Сохраняем тестового пользователя в базу
    localStorage.setItem(`user_${testPartnerId}`, JSON.stringify(testPartner))

    // Импортируем функцию создания чата
    const { createChat } = await import('./chat')

    // Создаем чат
    const chat = createChat([currentUser.id, testPartnerId])

    if (!chat) {
      throw new Error('Не удалось создать тестовый чат')
    }

    console.log(`[matchmaking] Создан тестовый чат: ${chat.id} с партнером ${testPartnerName}`)

    // Добавляем уведомление о новом чате для пользователя
    addChatNotification(currentUser.id, chat.id, testPartnerId)

    // Отправляем событие создания чата
    ChatEventManager.emitChatCreated(chat.id, [currentUser.id, testPartnerId])

    return chat.id
  } catch (error) {
    console.error('[matchmaking] Ошибка при создании тестового чата:', error)
    return null
  }
}

/**
 * Получает чат по его идентификатору
 * @param chatId Идентификатор чата
 * @returns Объект чата или null, если чат не найден
 */
export const getChatById = (chatId: string): any | null => {
  try {
    const chatKey = `chat_${chatId}`;
    const chatData = localStorage.getItem(chatKey);
    if (!chatData) {
      return null;
    }
    return JSON.parse(chatData);
  } catch (error) {
    console.error('[matchmaking] Ошибка при получении чата по ID:', error);
    return null;
  }
}

