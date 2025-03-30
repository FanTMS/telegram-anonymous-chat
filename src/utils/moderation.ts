import { getUsers } from './user'
import { getItem, setItem, getAllItems } from './dbService'

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
export const getModerationSettings = async (): Promise<ModerationSettings> => {
  try {
    const settings = await getItem('moderation_settings');

    if (settings) {
      return settings;
    }

    // Если настроек нет, создаем их и сохраняем по умолчанию
    await saveModerationSettings(defaultModerationSettings);
    return defaultModerationSettings;
  } catch (error) {
    console.error('Ошибка при получении настроек модерации:', error);
    return defaultModerationSettings;
  }
}

// Сохранение настроек модерации
export const saveModerationSettings = async (settings: ModerationSettings): Promise<boolean> => {
  try {
    await setItem('moderation_settings', settings);
    return true;
  } catch (error) {
    console.error('Ошибка при сохранении настроек модерации:', error);
    return false;
  }
}

// Проверка текста на запрещенный контент
export const checkForProfanity = async (text: string): Promise<boolean> => {
  if (!text) return false;

  const settings = await getModerationSettings();
  if (!settings.profanityFilter) return false;

  const lowerText = text.toLowerCase();

  // Проверка на запрещенные слова из настроек
  const allBlockedWords = [...blockedWords, ...settings.customBlockedWords];
  return allBlockedWords.some(word => lowerText.includes(word.toLowerCase()));
}

// Проверка текста на спам (упрощенный алгоритм)
export const checkForSpam = async (text: string): Promise<boolean> => {
  if (!text) return false;

  const settings = await getModerationSettings();
  if (!settings.spamFilter) return false;

  // Примитивная проверка на спам - повторяющиеся символы
  const repeatedChars = text.match(/(.)\1{5,}/g);
  if (repeatedChars) return true;

  // Много заглавных букв
  const uppercaseRatio = text.split('').filter(char => char.match(/[А-ЯA-Z]/)).length / text.length;
  if (uppercaseRatio > 0.7 && text.length > 5) return true;

  // Наличие URL и ключевых слов
  const hasLinks = text.match(/https?:\/\/|www\./i);
  const hasSpamKeywords = ['купить сейчас', 'скидка', 'акция', 'выигрыш', 'приз', 'быстрый заработок'].some(
    keyword => text.toLowerCase().includes(keyword)
  );

  return !!(hasLinks && hasSpamKeywords);
}

// Проверка на личные данные (упрощенный алгоритм)
export const checkForPersonalData = async (text: string): Promise<boolean> => {
  if (!text) return false;

  const settings = await getModerationSettings();
  if (!settings.personalDataFilter) return false;

  // Проверка на телефонные номера
  const hasPhoneNumber = !!text.match(/(\+7|8)[- _]?\(?[0-9]{3}\)?[- _]?[0-9]{3}[- _]?[0-9]{2}[- _]?[0-9]{2}/g);

  // Проверка на email
  const hasEmail = !!text.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}/g);

  // Проверка на паспортные данные (упрощенно)
  const hasPassportData = !!text.match(/\b\d{4}\s?\d{6}\b/g);

  return hasPhoneNumber || hasEmail || hasPassportData;
}

// Комплексная проверка сообщения по всем фильтрам
export const moderateMessage = async (message: Message): Promise<{
  isAllowed: boolean,
  violationTypes: ViolationType[],
  autoModerated: boolean
}> => {
  const settings = await getModerationSettings();
  if (!settings.autoModeration) {
    return { isAllowed: true, violationTypes: [], autoModerated: false };
  }

  const violations: ViolationType[] = [];

  // Проверка текста на нецензурную лексику
  if (await checkForProfanity(message.text)) {
    violations.push(ViolationType.PROFANITY);
  }

  // Проверка на спам
  if (await checkForSpam(message.text)) {
    violations.push(ViolationType.SPAM);
  }

  // Проверка на личные данные
  if (await checkForPersonalData(message.text)) {
    violations.push(ViolationType.PERSONAL_DATA);
  }

  return {
    isAllowed: violations.length === 0,
    violationTypes: violations,
    autoModerated: true
  };
}

// Получение всех сообщений из указанного чата
export const getChatMessages = async (chatId: string): Promise<Message[]> => {
  try {
    const messages = await getAllItems(`messages`, { chatId });
    return messages || [];
  } catch (error) {
    console.error(`Ошибка при получении сообщений чата ${chatId}:`, error);
    return [];
  }
}

// Получение всех сообщений со статусом на модерации
export const getPendingModerationMessages = async (): Promise<Message[]> => {
  try {
    // Получаем все сообщения из MongoDB с фильтром по статусу модерации
    const pendingMessages = await getAllItems('messages', {
      $or: [
        { moderationStatus: 'pending' },
        { isModerated: true, moderationStatus: { $exists: false } }
      ]
    });

    return pendingMessages || [];
  } catch (error) {
    console.error(`Ошибка при получении сообщений на модерацию:`, error);
    return [];
  }
}

// Получение всех сообщений, отклоненных модерацией
export const getRejectedMessages = async (): Promise<Message[]> => {
  try {
    const rejectedMessages = await getAllItems('messages', { moderationStatus: 'rejected' });
    return rejectedMessages || [];
  } catch (error) {
    console.error('Ошибка при получении отклоненных сообщений:', error);
    return [];
  }
}

// Действие модерации сообщения
export const moderateMessageAction = async (
  messageId: string,
  chatId: string,
  action: 'approve' | 'reject',
  moderatorId: string,
  violationType?: ViolationType,
  comment?: string
): Promise<boolean> => {
  try {
    const messages = await getAllItems(`messages`, { chatId });
    const messageIndex = messages.findIndex(msg => msg.id === messageId);

    if (messageIndex === -1) {
      console.error(`Сообщение ${messageId} не найдено в чате ${chatId}`);
      return false;
    }

    // Обновляем статус модерации сообщения
    messages[messageIndex].isModerated = true;
    messages[messageIndex].moderationStatus = action === 'approve' ? 'approved' : 'rejected';
    messages[messageIndex].moderatedBy = moderatorId;
    messages[messageIndex].moderationTimestamp = Date.now();

    // Сохраняем действие модерации
    const moderationAction: ModerationAction = {
      id: `mod_${Date.now()}`,
      messageId,
      moderatorId,
      actionType: action,
      violationType,
      comment,
      timestamp: Date.now()
    };

    // Сохраняем обновленный список сообщений
    await setItem(`messages.${chatId}`, messages);

    // Сохраняем действие модерации в истории
    const moderationHistory = await getItem('moderation_history') || [];
    moderationHistory.push(moderationAction);
    await setItem('moderation_history', moderationHistory);

    return true;
  } catch (error) {
    console.error('Ошибка при модерации сообщения:', error);
    return false;
  }
}

// Получение истории модерации
export const getModerationHistory = async (): Promise<ModerationAction[]> => {
  try {
    const moderationHistory = await getItem('moderation_history');
    return moderationHistory || [];
  } catch (error) {
    console.error('Ошибка при получении истории модерации:', error);
    return [];
  }
}

// Получение статистики модерации
export const getModerationStats = async () => {
  try {
    const history = await getModerationHistory();
    const pendingCount = (await getPendingModerationMessages()).length;
    const rejectedCount = (await getRejectedMessages()).length;

    // Количество действий за последние 24 часа
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentActions = history.filter(action => action.timestamp > oneDayAgo);

    // Количество по типам нарушений
    const violationCounts: Record<string, number> = {};
    history.forEach(action => {
      if (action.violationType) {
        violationCounts[action.violationType] = (violationCounts[action.violationType] || 0) + 1;
      }
    });

    return {
      totalModerated: history.length,
      pendingCount,
      rejectedCount,
      recentActionsCount: recentActions.length,
      approvedCount: history.filter(h => h.actionType === 'approve').length,
      rejectedTotal: history.filter(h => h.actionType === 'reject').length,
      violationCounts
    };
  } catch (error) {
    console.error('Ошибка при получении статистики модерации:', error);
    return {
      totalModerated: 0,
      pendingCount: 0,
      rejectedCount: 0,
      recentActionsCount: 0,
      approvedCount: 0,
      rejectedTotal: 0,
      violationCounts: {}
    };
  }
}

// Обновление списка запрещенных слов
export const updateBlockedWordsList = async (words: string[]): Promise<boolean> => {
  try {
    const settings = await getModerationSettings();
    settings.customBlockedWords = words;
    return await saveModerationSettings(settings);
  } catch (error) {
    console.error('Ошибка при обновлении списка запрещенных слов:', error);
    return false;
  }
}

// Проверить, требует ли сообщение модерации перед отправкой
export const messageRequiresModeration = async (text: string): Promise<boolean> => {
  const settings = await getModerationSettings();

  if (!settings.autoModeration) {
    return false;
  }

  return (await checkForProfanity(text)) ||
    (await checkForSpam(text)) ||
    (await checkForPersonalData(text));
}

// Получить все чаты
export const getAllChats = async (): Promise<Chat[]> => {
  try {
    const chats = await getAllItems('chats', {});
    return chats.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch (error) {
    console.error('Ошибка при получении всех чатов:', error);
    return [];
  }
}
