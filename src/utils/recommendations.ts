import { User, getUsers, getCurrentUser } from './user'
import { Chat, getChatsByUserId } from './chat'
import { isTestUser } from './friends'

// Типы разных стратегий подбора собеседников
export type MatchingStrategy = 'similar' | 'diverse' | 'random' | 'opposite' | 'rating' | 'location'

// Тип рейтинга пользователя
interface UserRating {
  userId: string
  score: number
  // Список общих интересов, если есть
  commonInterests?: string[]
  // Рейтинг предыдущих взаимодействий с пользователем (если были)
  previousInteractionsRating?: number
  // Был ли хороший опыт общения с этим пользователем
  goodExperience?: boolean
  // Новые поля для расширенных рекомендаций
  conversationLength?: number   // Длина диалога в сообщениях
  responseTime?: number        // Среднее время ответа (в миллисекундах)
  matchQuality?: number        // Вычисленное качество совпадения (от 0 до 100)
  lastChatDate?: number        // Время последнего взаимодействия
}

// Интерфейс для метрик взаимодействия с пользователем
interface UserInteractionMetrics {
  messageCount: number
  avgMessageLength: number
  rating?: number
  conversationDuration?: number  // Длительность разговора в миллисекундах
  responseTime?: number         // Среднее время ответа в миллисекундах
  lastInteractionDate?: number  // Дата последнего взаимодействия
  chatCompletionRate?: number   // Процент завершенных чатов (не брошенных)
  isFavorited?: boolean         // Добавлен ли пользователь в избранное
}

// Временный интерфейс для чата с рейтингом (дополняем интерфейс Chat)
interface ChatWithRating extends Chat {
  rating?: Record<string, number>
}

/**
 * Вычисляет рейтинг пользователей для рекомендаций
 */
export const calculateUserRecommendations = (
  currentUserId: string,
  strategy: MatchingStrategy = 'similar',
  filters?: {
    ageMin?: number | null
    ageMax?: number | null
    languages?: string[]
    regions?: string[]
  }
): UserRating[] => {
  const currentUser = getCurrentUser()
  if (!currentUser) return []

  // Получаем всех доступных пользователей
  const allUsers = getUsers().filter(user =>
    user.id !== currentUserId && !user.isBlocked && !user.isAdmin
  )

  // Получаем историю чатов пользователя
  const userChats = getChatsByUserId(currentUserId)

  // Создаем карту пользователей, с которыми общался текущий пользователь
  const userInteractions = new Map<string, UserInteractionMetrics>()

  // Анализируем чаты пользователя
  userChats.forEach(chat => {
    // Находим ID другого участника
    const otherUserId = chat.participants.find(id => id !== currentUserId)

    if (otherUserId) {
      // Подсчитываем число сообщений от другого пользователя
      const otherUserMessages = chat.messages.filter(msg => msg.senderId === otherUserId)
      const messageCount = otherUserMessages.length

      // Вычисляем среднюю длину сообщений
      const totalLength = otherUserMessages.reduce((acc, msg) => acc + msg.text.length, 0)
      const avgMessageLength = messageCount > 0 ? totalLength / messageCount : 0

      // Вычисляем среднее время ответа (если в чате более 2 сообщений)
      let responseTime = 0
      if (chat.messages.length > 2) {
        const responseTimes: number[] = []
        let lastMessage = null

        for (const msg of chat.messages) {
          if (lastMessage && msg.senderId !== lastMessage.senderId) {
            responseTimes.push(msg.timestamp - lastMessage.timestamp)
          }
          lastMessage = msg
        }

        if (responseTimes.length > 0) {
          responseTime = responseTimes.reduce((acc, time) => acc + time, 0) / responseTimes.length
        }
      }

      // Определяем продолжительность разговора
      const conversationDuration = chat.messages.length > 0 ?
        chat.messages[chat.messages.length - 1].timestamp - chat.messages[0].timestamp : 0

      // Определяем дату последнего взаимодействия
      const lastInteractionDate = chat.messages.length > 0 ?
        chat.messages[chat.messages.length - 1].timestamp : 0

      // Определяем, завершен ли чат (упрощенно - проверяем по endedAt)
      const chatCompletionRate = chat.endedAt ? 1 : 0

      // Проверяем, есть ли пользователь в избранном
      const isFavorited = currentUser.favorites?.includes(otherUserId) ?? false

      // Получаем существующие данные о взаимодействии (если есть)
      const existingInteraction = userInteractions.get(otherUserId)

      // Безопасно получаем рейтинг
      const chatWithRating = chat as ChatWithRating
      const userRating = chatWithRating.rating ? chatWithRating.rating[otherUserId] : undefined

      // Сохраняем или обновляем данные о взаимодействии
      userInteractions.set(otherUserId, {
        messageCount: (existingInteraction?.messageCount || 0) + messageCount,
        avgMessageLength: existingInteraction ?
          (existingInteraction.avgMessageLength + avgMessageLength) / 2 : avgMessageLength,
        rating: userRating ?? existingInteraction?.rating,
        responseTime,
        conversationDuration,
        lastInteractionDate,
        chatCompletionRate,
        isFavorited
      })
    }
  })

  // Вычисляем рейтинг для каждого пользователя на основе выбранной стратегии
  const userRatings: UserRating[] = allUsers.map(user => {
    // Фильтрация по возрасту
    if (filters?.ageMin !== undefined && filters.ageMin !== null && user.age !== undefined) {
      if (user.age < filters.ageMin) {
        return { userId: user.id, score: -1 } // Не подходит
      }
    }

    if (filters?.ageMax !== undefined && filters.ageMax !== null && user.age !== undefined) {
      if (user.age > filters.ageMax) {
        return { userId: user.id, score: -1 } // Не подходит
      }
    }

    // Фильтрация по языкам (упрощенно)
    if (filters?.languages && filters.languages.length > 0 && user.languages) {
      if (!user.languages.some(lang => filters.languages?.includes(lang))) {
        return { userId: user.id, score: -1 } // Не подходит
      }
    }

    // Фильтрация по регионам (упрощенно)
    if (filters?.regions && filters.regions.length > 0 && user.region) {
      if (!filters.regions.includes(user.region)) {
        return { userId: user.id, score: -1 } // Не подходит
      }
    }

    // Находим общие интересы
    const commonInterests = currentUser.interests.filter(interest =>
      user.interests.includes(interest)
    )

    // Получаем данные о предыдущих взаимодействиях, если они были
    const interaction = userInteractions.get(user.id)

    // Определяем, был ли хороший опыт общения с пользователем
    const goodExperience = interaction?.rating !== undefined && interaction.rating >= 4

    // Вычисляем базовый рейтинг на основе общих интересов
    let score = 0

    // Учитываем пользовательские настройки
    const userMatchingPreference = currentUser.settings?.matchingPreference || 'similar'

    // Если указана стратегия, то используем ее, иначе используем предпочтения пользователя
    const effectiveStrategy = strategy || userMatchingPreference

    switch (effectiveStrategy) {
      case 'similar': // Предпочитает похожих пользователей
        // Больше баллов за общие интересы
        score += commonInterests.length * 10

        // Бонус за хороший опыт общения
        if (goodExperience) {
          score += 20
        }

        // Бонус за активное общение
        if (interaction && interaction.messageCount > 10) {
          score += 5
        }

        // Бонус за добавление в избранное
        if (interaction?.isFavorited) {
          score += 25
        }

        // Бонус за качество взаимодействия (качественные и своевременные ответы)
        if (interaction && interaction.avgMessageLength > 20) {
          score += 5
        }

        // Если пользователь быстро отвечает
        if (interaction?.responseTime && interaction.responseTime < 60000) { // менее минуты
          score += 8
        }
        break

      case 'diverse': // Предпочитает разнообразие
        // Умеренные баллы за общие интересы, но не слишком много
        score += Math.min(commonInterests.length, 2) * 5

        // Бонус за разнообразие интересов
        const uniqueInterests = user.interests.filter(interest =>
          !currentUser.interests.includes(interest)
        ).length
        score += uniqueInterests * 3

        // Небольшой бонус за новых пользователей, с которыми еще не общались
        if (!interaction) {
          score += 15
        }
        // Или бонус за пользователей, с которыми давно не общались
        else if (interaction.lastInteractionDate) {
          const daysSinceLastInteraction = Math.floor(
            (Date.now() - interaction.lastInteractionDate) / (1000 * 60 * 60 * 24)
          )
          // Больше баллов, если прошло больше времени с последнего общения
          if (daysSinceLastInteraction > 7) {
            score += 10
          }
        }

        // Бонус за языковое разнообразие
        if (user.languages && currentUser.languages) {
          const differentLanguages = user.languages.filter(
            lang => !currentUser.languages?.includes(lang)
          ).length
          score += differentLanguages * 2
        }
        break

      case 'random': // Случайный подбор
        // Случайный рейтинг
        score = Math.random() * 100
        break

      // Добавляем обработку других стратегий
      case 'opposite':
      case 'rating':
      case 'location':
      default:
        // Базовый рейтинг + случайность
        score = 50 + Math.random() * 50
        break
    }

    // Общие бонусы для всех стратегий

    // Бонус за активность
    if (Date.now() - user.lastActive < 24 * 60 * 60 * 1000) { // был активен в последние 24 часа
      score += 7
    }

    // Небольшой штраф за слишком частые рекомендации одного и того же пользователя
    if (interaction && interaction.lastInteractionDate) {
      const hoursSinceLastInteraction = (Date.now() - interaction.lastInteractionDate) / (1000 * 60 * 60)
      if (hoursSinceLastInteraction < 1) { // Менее часа назад
        score -= 10
      }
    }

    // Добавляем небольшую случайность для всех стратегий, чтобы избежать одинаковых рекомендаций
    score += Math.random() * 5

    // Создаем объект рейтинга с расширенными данными
    return {
      userId: user.id,
      score,
      commonInterests: commonInterests.length > 0 ? commonInterests : undefined,
      previousInteractionsRating: interaction?.rating,
      goodExperience: interaction?.rating !== undefined ? interaction.rating >= 4 : undefined,
      conversationLength: interaction?.messageCount,
      responseTime: interaction?.responseTime,
      matchQuality: commonInterests.length > 0 ? (commonInterests.length / Math.max(1, currentUser.interests.length)) * 100 : 0,
      lastChatDate: interaction?.lastInteractionDate
    }
  })

  // Отфильтровываем пользователей с отрицательным рейтингом (не прошли фильтры)
  // и сортируем по убыванию рейтинга
  return userRatings
    .filter(rating => rating.score >= 0)
    .sort((a, b) => b.score - a.score)
}

// Основная функция для получения рекомендованных пользователей
export const getRecommendedUsers = (
  limit: number = 5,
  strategy: MatchingStrategy = 'similar',
  filters?: {
    ageMin?: number | null
    ageMax?: number | null
    languages?: string[]
    regions?: string[]
  }
): { user: User, score: number, commonInterests?: string[] }[] => {
  const currentUser = getCurrentUser()
  if (!currentUser) return []

  // Получаем рейтинги пользователей
  const userRatings = calculateUserRecommendations(currentUser.id, strategy, filters)

  // Получаем полные данные пользователей
  const allUsers = getUsers()

  // Формируем результат
  return userRatings.slice(0, limit).map(rating => {
    const user = allUsers.find(u => u.id === rating.userId)
    if (!user) {
      // Возвращаем пустой объект вместо ошибки
      return { user: {} as User, score: 0 }
    }

    return {
      user,
      score: rating.score,
      commonInterests: rating.commonInterests
    }
  }).filter(item => Object.keys(item.user).length > 0) // Фильтруем пустые пользователи
}

// Функция для поиска наилучшего соответствия
export const findBestMatch = (
  strategy: MatchingStrategy = 'similar',
  filters?: {
    ageMin?: number | null
    ageMax?: number | null
    languages?: string[]
    regions?: string[]
  }
): User | null => {
  const recommended = getRecommendedUsers(1, strategy, filters)
  return recommended.length > 0 ? recommended[0].user : null
}

// Функция подбора похожих пользователей (простая версия)
export const getSimilarUsers = (user: User, limit: number = 10): User[] => {
  if (!user || !Array.isArray(user.interests)) {
    return []
  }

  const allUsers = getUsers()

  // Отфильтровываем тестовых пользователей и самого пользователя
  const potentialMatches = allUsers.filter(u =>
    u.id !== user.id &&
    !isTestUser(u) &&
    !u.isBlocked &&
    Array.isArray(u.interests) // Проверяем, что interests - массив
  )

  // Рассчитываем "схожесть" интересов
  const usersWithSimilarity = potentialMatches.map(potentialMatch => {
    // Находим общие интересы
    const commonInterests = user.interests.filter(interest =>
      potentialMatch.interests.includes(interest)
    )

    const similarity = commonInterests.length /
      Math.max(1, Math.max(user.interests.length, potentialMatch.interests.length))

    return {
      user: potentialMatch,
      similarity
    }
  })

  // Сортируем по убыванию схожести и возвращаем первые limit записей
  return usersWithSimilarity
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
    .map(item => item.user)
}
