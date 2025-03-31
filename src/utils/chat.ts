import { User } from './user';
import { getCurrentUser } from './user';
import { userStorage } from './userStorage';

// Интерфейс для сообщения
export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: number;
  isRead: boolean;
  isSystem?: boolean; // Флаг для системных сообщений
}

// Интерфейс для чата с дополнительными полями
export interface Chat {
  ended: any;
  id: string;
  participants: string[]; // ID участников
  messages: Message[];
  isActive: boolean;
  startedAt: number;
  endedAt?: number;
  userId: string;
  partnerId: string;
  createdAt: Date;
  lastActivity: Date;
  isFavorite?: boolean; // Добавлено для отметки избранных чатов
  friendRequestSent?: boolean; // Был ли отправлен запрос в друзья
  friendRequestAccepted?: boolean; // Принят ли запрос в друзья
  gameRequestSent?: boolean; // Был ли отправлен запрос на игру
  gameRequestAccepted?: boolean; // Принят ли запрос на игру
  gameData?: GameResult; // Данные текущей или последней игры
}

// Интерфейс для результатов игры "Камень-ножницы-бумага"
export type GameChoice = 'rock' | 'paper' | 'scissors';

export interface GameResult {
  chatId: string;
  player1Id: string;
  player2Id: string;
  player1Choice?: GameChoice;
  player2Choice?: GameChoice;
  winner?: string; // ID победителя, undefined если ничья
  timestamp: number;
  isCompleted: boolean;
}

/**
 * Получить чат по идентификатору
 */
export const getChatById = (chatId: string): Chat | null => {
  try {
    if (!chatId) {
      console.error('getChatById: ID чата не указан');
      return null;
    }

    // Используем изолированное хранилище пользователя
    const userChats = userStorage.getItem<Chat[]>('chats', []);
    return userChats.find(chat => chat.id === chatId) || null;
  } catch (error) {
    console.error(`Ошибка при получении чата ${chatId}:`, error);
    return null;
  }
};

/**
 * Получить все чаты пользователя
 */
export const getUserChats = (): Chat[] => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      console.error('Не удалось получить чаты: пользователь не авторизован');
      return [];
    }

    // Используем изолированное хранилище пользователя
    return userStorage.getItem<Chat[]>('chats', []);
  } catch (error) {
    console.error('Ошибка при получении чатов:', error);
    return [];
  }
};

/**
 * Сохранить новый чат
 */
export const saveChat = (chat: Chat): boolean => {
  try {
    if (!chat || !chat.id) {
      console.error('saveChat: Невалидный объект чата');
      return false;
    }

    // Получаем текущие чаты из изолированного хранилища
    const chats = userStorage.getItem<Chat[]>('chats', []);

    // Проверяем, существует ли чат с таким ID
    const existingChatIndex = chats.findIndex(c => c.id === chat.id);

    if (existingChatIndex !== -1) {
      // Обновляем существующий чат
      chats[existingChatIndex] = chat;
    } else {
      // Добавляем новый чат
      chats.push(chat);
    }

    // Сохраняем обновленный список чатов
    userStorage.setItem('chats', chats);
    return true;
  } catch (error) {
    console.error('Ошибка при сохранении чата:', error);
    return false;
  }
};

/**
 * Удалить чат по ID
 */
export const deleteChat = (chatId: string): boolean => {
  try {
    // Получаем чаты из изолированного хранилища
    const chats = userStorage.getItem<Chat[]>('chats', []);
    const updatedChats = chats.filter(chat => chat.id !== chatId);

    // Сохраняем обновленный список
    userStorage.setItem('chats', updatedChats);
    return true;
  } catch (error) {
    console.error(`Ошибка при удалении чата ${chatId}:`, error);
    return false;
  }
};

/**
 * Обновить чат
 */
export const updateChat = (chatId: string, updates: Partial<Chat>): boolean => {
  try {
    // Получаем чаты из изолированного хранилища
    const chats = userStorage.getItem<Chat[]>('chats', []);
    const chatIndex = chats.findIndex(chat => chat.id === chatId);

    if (chatIndex === -1) {
      console.error(`Чат ${chatId} не найден`);
      return false;
    }

    // Обновляем чат
    chats[chatIndex] = { ...chats[chatIndex], ...updates };

    // Сохраняем обновленный список
    userStorage.setItem('chats', chats);
    return true;
  } catch (error) {
    console.error(`Ошибка при обновлении чата ${chatId}:`, error);
    return false;
  }
};

/**
 * Игра "Камень-ножницы-бумага"
 */
export const playGame = (
  chatId: string,
  player1Id: string,
  player2Id: string,
  player1Choice: GameChoice,
  player2Choice: GameChoice
): GameResult => {
  // Определяем победителя
  let winner: string | undefined;

  if (player1Choice === player2Choice) {
    winner = undefined; // Ничья
  } else if (
    (player1Choice === 'rock' && player2Choice === 'scissors') ||
    (player1Choice === 'paper' && player2Choice === 'rock') ||
    (player1Choice === 'scissors' && player2Choice === 'paper')
  ) {
    winner = player1Id;
  } else {
    winner = player2Id;
  }

  const result: GameResult = {
    chatId,
    player1Id,
    player2Id,
    player1Choice,
    player2Choice,
    winner,
    timestamp: Date.now(),
    isCompleted: true
  };

  // Сохраняем результат игры
  try {
    const gamesData = localStorage.getItem('games');
    const games: GameResult[] = gamesData ? JSON.parse(gamesData) : [];

    games.push(result);

    localStorage.setItem('games', JSON.stringify(games));
  } catch (error) {
    console.error('Ошибка при сохранении результата игры:', error);
  }

  return result;
};

/**
 * Получить чаты по ID пользователя
 */
export const getChatsByUserId = (userId: string): Chat[] => {
  const allChats: Chat[] = getUserChats();
  return allChats.filter(chat => chat.userId === userId || chat.partnerId === userId);
};

/**
 * Добавить системное сообщение в чат
 */
export const addSystemMessage = (chatId: string, text: string): Message | null => {
  try {
    const systemMessage: Message = {
      id: `system_${Date.now()}`,
      chatId,
      senderId: 'system',
      text,
      timestamp: Date.now(),
      isRead: true,
      isSystem: true
    };

    const chats = userStorage.getItem<Chat[]>('chats', []);
    const chatIndex = chats.findIndex(chat => chat.id === chatId);

    if (chatIndex === -1) return null;

    // Добавляем системное сообщение в чат
    chats[chatIndex].messages.push(systemMessage);
    userStorage.setItem('chats', chats);

    return systemMessage;
  } catch (error) {
    console.error('Ошибка при добавлении системного сообщения:', error);
    return null;
  }
};

/**
 * Отправить сообщение в чат
 */
export const sendMessage = (chatId: string, text: string, senderId: string): Message | null => {
  try {
    if (!chatId || !text || !senderId) {
      console.error('sendMessage: Неверные параметры');
      return null;
    }

    const chat = getChatById(chatId);
    if (!chat) {
      console.error(`Чат ${chatId} не найден`);
      return null;
    }

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const message: Message = {
      id: messageId,
      chatId,
      senderId,
      text,
      timestamp: Date.now(),
      isRead: false
    };

    // Добавляем сообщение в чат
    chat.messages.push(message);
    // Обновляем время последней активности в чате
    chat.lastActivity = new Date();
    // Сохраняем чат
    saveChat(chat);

    return message;
  } catch (error) {
    console.error(`Ошибка при отправке сообщения в чат ${chatId}:`, error);
    return null;
  }
};

/**
 * Завершить чат
 */
export const endChat = (chatId: string): boolean => {
  try {
    const chat = getChatById(chatId);
    if (!chat) {
      console.error(`Чат ${chatId} не найден`);
      return false;
    }

    // Отмечаем чат как завершенный
    chat.isActive = false;
    chat.endedAt = Date.now();
    chat.ended = true;

    // Добавляем системное сообщение о завершении чата
    const systemMessage: Message = {
      id: `system_${Date.now()}`,
      chatId,
      senderId: 'system',
      text: 'Чат был завершен.',
      timestamp: Date.now(),
      isRead: true,
      isSystem: true
    };

    chat.messages.push(systemMessage);

    // Сохраняем изменения
    return saveChat(chat);
  } catch (error) {
    console.error(`Ошибка при завершении чата ${chatId}:`, error);
    return false;
  }
};

/**
 * Добавить/удалить чат из избранного
 */
export const toggleFavoriteChat = (chatId: string): boolean => {
  try {
    const chat = getChatById(chatId);
    if (!chat) {
      console.error(`Чат ${chatId} не найден`);
      return false;
    }

    // Переключаем статус избранного
    chat.isFavorite = !chat.isFavorite;

    // Сохраняем изменения
    return saveChat(chat);
  } catch (error) {
    console.error(`Ошибка при изменении статуса избранного для чата ${chatId}:`, error);
    return false;
  }
};

/**
 * Получить все активные чаты пользователя
 */
export const getActiveUserChats = (userId: string): Chat[] => {
  try {
    const allChats = getUserChats();
    return allChats.filter(chat =>
      (chat.userId === userId || chat.partnerId === userId) &&
      chat.isActive === true
    );
  } catch (error) {
    console.error(`Ошибка при получении активных чатов для пользователя ${userId}:`, error);
    return [];
  }
};

/**
 * Получить все чаты пользователя
 */
export const getAllUserChats = (): Chat[] => {
  return getUserChats();
};
