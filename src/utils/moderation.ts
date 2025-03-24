import { getUsers } from './user'

// Интерфейс для сообщения
export interface Message {
  id: string
  chatId: string
  senderId: string
  text: string
  timestamp: number
  isRead: boolean
  isModerated?: boolean
  moderationStatus?: 'approved' | 'rejected' | 'pending'
  moderatedBy?: string
  moderationTimestamp?: number
  isSystem?: boolean
  attachments?: string[]
}

// Интерфейс для чата
export interface Chat {
  id: string
  participants: string[]
  lastMessage?: Message
  createdAt: number
  updatedAt: number
  isActive: boolean
  isModerated?: boolean
}

// Типы нарушений для модерации
export enum ViolationType {
  SPAM = 'Спам',
  PROFANITY = 'Нецензурная лексика',
  HARASSMENT = 'Оскорбления',
  INAPPROPRIATE = 'Неприемлемый контент',
  PERSONAL_DATA = 'Личные данные',
  OTHER = 'Другое'
}

// Интерфейс для модерации сообщения
export interface ModerationAction {
  id: string
  messageId: string
  moderatorId: string
  actionType: 'approve' | 'reject'
  violationType?: ViolationType
  comment?: string
  timestamp: number
}

// Интерфейс для настроек модерации
export interface ModerationSettings {
  autoModeration: boolean
  profanityFilter: boolean
  spamFilter: boolean
  personalDataFilter: boolean
  customBlockedWords: string[]
  moderationQueueSize: number
}

// Набор запрещенных слов (упрощенный)
const blockedWords = [
  'плохое_слово_1',
  'плохое_слово_2',
  'оскорбление',
  'нецензурное_слово'
]

// Значения по умолчанию для настроек модерации
const defaultModerationSettings: ModerationSettings = {
  autoModeration: true,
  profanityFilter: true,
  spamFilter: true,
  personalDataFilter: true,
  customBlockedWords: [],
  moderationQueueSize: 50
}

// Получение настроек модерации
export const getModerationSettings = (): ModerationSettings => {
  try {
    const settingsData = localStorage.getItem('moderation_settings')

    if (settingsData) {
      return JSON.parse(settingsData)
    }

    // Если настроек нет, создаем их и сохраняем по умолчанию
    saveModerationSettings(defaultModerationSettings)
    return defaultModerationSettings
  } catch (error) {
    console.error('Ошибка при получении настроек модерации:', error)
    return defaultModerationSettings
  }
}

// Сохранение настроек модерации
export const saveModerationSettings = (settings: ModerationSettings): boolean => {
  try {
    localStorage.setItem('moderation_settings', JSON.stringify(settings))
    return true
  } catch (error) {
    console.error('Ошибка при сохранении настроек модерации:', error)
    return false
  }
}

// Проверка текста на запрещенный контент
export const checkForProfanity = (text: string): boolean => {
  if (!text) return false

  const settings = getModerationSettings()
  if (!settings.profanityFilter) return false

  const lowerText = text.toLowerCase()

  // Проверка на запрещенные слова из настроек
  const allBlockedWords = [...blockedWords, ...settings.customBlockedWords]
  return allBlockedWords.some(word => lowerText.includes(word.toLowerCase()))
}

// Проверка текста на спам (упрощенный алгоритм)
export const checkForSpam = (text: string): boolean => {
  if (!text) return false

  const settings = getModerationSettings()
  if (!settings.spamFilter) return false

  // Примитивная проверка на спам - повторяющиеся символы
  const repeatedChars = text.match(/(.)\1{5,}/g)
  if (repeatedChars) return true

  // Много заглавных букв
  const uppercaseRatio = text.split('').filter(char => char.match(/[А-ЯA-Z]/)).length / text.length
  if (uppercaseRatio > 0.7 && text.length > 5) return true

  // Наличие URL и ключевых слов
  const hasLinks = text.match(/https?:\/\/|www\./i)
  const hasSpamKeywords = ['купить сейчас', 'скидка', 'акция', 'выигрыш', 'приз', 'быстрый заработок'].some(
    keyword => text.toLowerCase().includes(keyword)
  )

  return !!(hasLinks && hasSpamKeywords)
}

// Проверка на личные данные (упрощенный алгоритм)
export const checkForPersonalData = (text: string): boolean => {
  if (!text) return false

  const settings = getModerationSettings()
  if (!settings.personalDataFilter) return false

  // Проверка на телефонные номера
  const hasPhoneNumber = !!text.match(/(\+7|8)[- _]?\(?[0-9]{3}\)?[- _]?[0-9]{3}[- _]?[0-9]{2}[- _]?[0-9]{2}/g)

  // Проверка на email
  const hasEmail = !!text.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g)

  // Проверка на паспортные данные (упрощенно)
  const hasPassportData = !!text.match(/\b\d{4}\s?\d{6}\b/g)

  return hasPhoneNumber || hasEmail || hasPassportData
}

// Комплексная проверка сообщения по всем фильтрам
export const moderateMessage = (message: Message): {
  isAllowed: boolean,
  violationTypes: ViolationType[],
  autoModerated: boolean
} => {
  const settings = getModerationSettings()
  if (!settings.autoModeration) {
    return { isAllowed: true, violationTypes: [], autoModerated: false }
  }

  const violations: ViolationType[] = []

  // Проверка текста на нецензурную лексику
  if (checkForProfanity(message.text)) {
    violations.push(ViolationType.PROFANITY)
  }

  // Проверка на спам
  if (checkForSpam(message.text)) {
    violations.push(ViolationType.SPAM)
  }

  // Проверка на личные данные
  if (checkForPersonalData(message.text)) {
    violations.push(ViolationType.PERSONAL_DATA)
  }

  return {
    isAllowed: violations.length === 0,
    violationTypes: violations,
    autoModerated: true
  }
}

// Получение всех сообщений из указанного чата
export const getChatMessages = (chatId: string): Message[] => {
  try {
    const messagesKey = `messages_${chatId}`
    const messagesData = localStorage.getItem(messagesKey)

    if (messagesData) {
      return JSON.parse(messagesData) as Message[]
    }

    return []
  } catch (error) {
    console.error(`Ошибка при получении сообщений чата ${chatId}:`, error)
    return []
  }
}

// Получение всех сообщений со статусом на модерации
export const getPendingModerationMessages = (): Message[] => {
  try {
    // Собираем все ключи сообщений
    const chatKeys = Object.keys(localStorage).filter(key => key.startsWith('messages_'))
    let pendingMessages: Message[] = []

    // Проходим по всем ключам сообщений
    chatKeys.forEach(key => {
      const messages = JSON.parse(localStorage.getItem(key) || '[]') as Message[]
      // Фильтруем сообщения, ожидающие модерации
      const pending = messages.filter(msg =>
        msg.moderationStatus === 'pending' ||
        (msg.isModerated === true && !msg.moderationStatus)
      )
      pendingMessages = [...pendingMessages, ...pending]
    })

    // Сортируем по времени создания (новые в начале)
    return pendingMessages.sort((a, b) => b.timestamp - a.timestamp)
  } catch (error) {
    console.error('Ошибка при получении сообщений для модерации:', error)
    return []
  }
}

// Получение всех сообщений, отклоненных модерацией
export const getRejectedMessages = (): Message[] => {
  try {
    const chatKeys = Object.keys(localStorage).filter(key => key.startsWith('messages_'))
    let rejectedMessages: Message[] = []

    chatKeys.forEach(key => {
      const messages = JSON.parse(localStorage.getItem(key) || '[]') as Message[]
      const rejected = messages.filter(msg => msg.moderationStatus === 'rejected')
      rejectedMessages = [...rejectedMessages, ...rejected]
    })

    return rejectedMessages.sort((a, b) => b.timestamp - a.timestamp)
  } catch (error) {
    console.error('Ошибка при получении отклоненных сообщений:', error)
    return []
  }
}

// Действие модерации сообщения
export const moderateMessageAction = (
  messageId: string,
  chatId: string,
  action: 'approve' | 'reject',
  moderatorId: string,
  violationType?: ViolationType,
  comment?: string
): boolean => {
  try {
    const messagesKey = `messages_${chatId}`
    const messagesData = localStorage.getItem(messagesKey)

    if (!messagesData) {
      console.error(`Чат ${chatId} не найден`)
      return false
    }

    const messages = JSON.parse(messagesData) as Message[]
    const messageIndex = messages.findIndex(msg => msg.id === messageId)

    if (messageIndex === -1) {
      console.error(`Сообщение ${messageId} не найдено в чате ${chatId}`)
      return false
    }

    // Обновляем статус модерации сообщения
    messages[messageIndex].isModerated = true
    // Преобразуем статус действия (approve -> approved, reject -> rejected)
    messages[messageIndex].moderationStatus = action === 'approve' ? 'approved' : 'rejected'
    messages[messageIndex].moderatedBy = moderatorId
    messages[messageIndex].moderationTimestamp = Date.now()

    // Сохраняем действие модерации
    const moderationAction: ModerationAction = {
      id: `mod_${Date.now()}`,
      messageId,
      moderatorId,
      actionType: action,
      violationType,
      comment,
      timestamp: Date.now()
    }

    // Сохраняем обновленный список сообщений
    localStorage.setItem(messagesKey, JSON.stringify(messages))

    // Сохраняем действие модерации в истории
    const moderationHistoryKey = 'moderation_history'
    const moderationHistoryData = localStorage.getItem(moderationHistoryKey)
    let moderationHistory: ModerationAction[] = []

    if (moderationHistoryData) {
      moderationHistory = JSON.parse(moderationHistoryData)
    }

    moderationHistory.push(moderationAction)
    localStorage.setItem(moderationHistoryKey, JSON.stringify(moderationHistory))

    return true
  } catch (error) {
    console.error('Ошибка при модерации сообщения:', error)
    return false
  }
}

// Получение истории модерации
export const getModerationHistory = (): ModerationAction[] => {
  try {
    const moderationHistoryKey = 'moderation_history'
    const moderationHistoryData = localStorage.getItem(moderationHistoryKey)

    if (moderationHistoryData) {
      return JSON.parse(moderationHistoryData) as ModerationAction[]
    }

    return []
  } catch (error) {
    console.error('Ошибка при получении истории модерации:', error)
    return []
  }
}

// Получение статистики модерации
export const getModerationStats = () => {
  try {
    const history = getModerationHistory()
    const pendingCount = getPendingModerationMessages().length
    const rejectedCount = getRejectedMessages().length

    // Количество действий за последние 24 часа
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
    const recentActions = history.filter(action => action.timestamp > oneDayAgo)

    // Количество по типам нарушений
    const violationCounts: Record<string, number> = {}
    history.forEach(action => {
      if (action.violationType) {
        violationCounts[action.violationType] = (violationCounts[action.violationType] || 0) + 1
      }
    })

    return {
      totalModerated: history.length,
      pendingCount,
      rejectedCount,
      recentActionsCount: recentActions.length,
      approvedCount: history.filter(h => h.actionType === 'approve').length,
      rejectedTotal: history.filter(h => h.actionType === 'reject').length,
      violationCounts
    }
  } catch (error) {
    console.error('Ошибка при получении статистики модерации:', error)
    return {
      totalModerated: 0,
      pendingCount: 0,
      rejectedCount: 0,
      recentActionsCount: 0,
      approvedCount: 0,
      rejectedTotal: 0,
      violationCounts: {}
    }
  }
}

// Обновление списка запрещенных слов
export const updateBlockedWordsList = (words: string[]): boolean => {
  try {
    const settings = getModerationSettings()
    settings.customBlockedWords = words
    saveModerationSettings(settings)
    return true
  } catch (error) {
    console.error('Ошибка при обновлении списка запрещенных слов:', error)
    return false
  }
}

// Проверить, требует ли сообщение модерации перед отправкой
export const messageRequiresModeration = (text: string): boolean => {
  const settings = getModerationSettings()

  if (!settings.autoModeration) {
    return false
  }

  return checkForProfanity(text) ||
         checkForSpam(text) ||
         checkForPersonalData(text)
}

// Получить все чаты
export const getAllChats = (): Chat[] => {
  try {
    const chatKeys = Object.keys(localStorage).filter(key => key.startsWith('chat_'))
    const chats: Chat[] = []

    chatKeys.forEach(key => {
      const chatData = localStorage.getItem(key)
      if (chatData) {
        chats.push(JSON.parse(chatData))
      }
    })

    return chats.sort((a, b) => b.updatedAt - a.updatedAt)
  } catch (error) {
    console.error('Ошибка при получении всех чатов:', error)
    return []
  }
}
