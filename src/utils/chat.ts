import { getItem, setItem, getAllItems, removeItem } from './dbService';
import { Message } from './moderation';
import { User, getCurrentUser, getUserById } from './user';

// Интерфейс для чата
export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: Message;
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
  isModerated?: boolean;
  gameData?: any; // Для игровых данных
  gameRequestAccepted?: boolean; // Для отслеживания принятия запроса на игру
  title?: string; // Название чата, если оно есть
  ended?: boolean; // Флаг, указывающий, что чат завершен
  isFavorite?: boolean; // Флаг, указывающий, что чат в избранном
}

// Создание нового чата
export const createChat = async (participants: string[]): Promise<Chat> => {
  try {
    const chatId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const currentUser = await getCurrentUser();

    const now = Date.now();
    const newChat: Chat = {
      id: chatId,
      participants,
      createdAt: now,
      updatedAt: now,
      isActive: true,
      isModerated: false,
    };

    // Добавляем системное сообщение о создании чата
    const systemMessage: Message = {
      id: `msg_${now}_system`,
      chatId,
      senderId: 'system',
      text: 'Чат создан. Теперь вы можете общаться!',
      timestamp: now,
      isRead: false,
      isSystem: true
    };

    // Сохраняем чат в базу данных
    await setItem(`chats.${chatId}`, newChat);

    // Сохраняем первое сообщение
    await setItem(`messages.${chatId}`, [systemMessage]);

    // Обновляем список чатов каждого пользователя
    for (const userId of participants) {
      const userChats = await getUserChats(userId);
      if (!userChats.includes(chatId)) {
        userChats.push(chatId);
        await setItem(`user_chats.${userId}`, userChats);
      }
    }

    return newChat;
  } catch (error) {
    console.error('Ошибка при создании чата:', error);
    throw error;
  }
};

// Получение чата по идентификатору
export const getChatById = async (chatId: string): Promise<Chat | null> => {
  try {
    const chat = await getItem(`chats.${chatId}`);
    return chat;
  } catch (error) {
    console.error(`Ошибка при получении чата с ID ${chatId}:`, error);
    return null;
  }
};

// Отправка сообщения в чат
export const sendMessage = async (chatId: string, text: string, senderId: string): Promise<Message> => {
  try {
    const chat = await getChatById(chatId);
    if (!chat) {
      throw new Error(`Чат с ID ${chatId} не найден`);
    }

    // Создаем новое сообщение
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = Date.now();

    const newMessage: Message = {
      id: messageId,
      chatId,
      senderId,
      text,
      timestamp: now,
      isRead: false
    };

    // Получаем текущие сообщения чата
    let messages: Message[] = await getItem(`messages.${chatId}`) || [];
    messages.push(newMessage);

    // Обновляем список сообщений
    await setItem(`messages.${chatId}`, messages);

    // Обновляем информацию о чате
    chat.lastMessage = newMessage;
    chat.updatedAt = now;
    await setItem(`chats.${chatId}`, chat);

    return newMessage;
  } catch (error) {
    console.error(`Ошибка при отправке сообщения в чат ${chatId}:`, error);
    throw error;
  }
};

// Получение сообщений из чата
export const getChatMessages = async (chatId: string): Promise<Message[]> => {
  try {
    const messages = await getItem(`messages.${chatId}`);
    return messages || [];
  } catch (error) {
    console.error(`Ошибка при получении сообщений из чата ${chatId}:`, error);
    return [];
  }
};

// Отметить сообщения как прочитанные
export const markMessagesAsRead = async (chatId: string, userId: string): Promise<void> => {
  try {
    const messages = await getChatMessages(chatId);

    let updated = false;
    for (const message of messages) {
      // Отмечаем как прочитанные только сообщения, которые НЕ отправлены текущим пользователем
      if (!message.isRead && message.senderId !== userId) {
        message.isRead = true;
        updated = true;
      }
    }

    if (updated) {
      await setItem(`messages.${chatId}`, messages);
    }
  } catch (error) {
    console.error(`Ошибка при отметке сообщений как прочитанных в чате ${chatId}:`, error);
  }
};

// Получение списка чатов пользователя
export const getUserChats = async (userId: string): Promise<string[]> => {
  try {
    const userChats = await getItem(`user_chats.${userId}`);
    return userChats || [];
  } catch (error) {
    console.error(`Ошибка при получении списка чатов пользователя ${userId}:`, error);
    return [];
  }
};

// Обновление данных чата
export const updateChat = async (chatId: string, updates: Partial<Chat>): Promise<boolean> => {
  try {
    const chat = await getChatById(chatId);
    if (!chat) {
      return false;
    }

    // Объединяем текущие данные с обновлениями
    const updatedChat = { ...chat, ...updates, updatedAt: Date.now() };
    await setItem(`chats.${chatId}`, updatedChat);

    return true;
  } catch (error) {
    console.error(`Ошибка при обновлении чата ${chatId}:`, error);
    return false;
  }
};

// Добавление системного сообщения в чат
export const addSystemMessage = async (chatId: string, text: string): Promise<boolean> => {
  try {
    const chat = await getChatById(chatId);
    if (!chat) {
      return false;
    }

    // Создаем системное сообщение
    const messageId = `msg_${Date.now()}_system`;
    const now = Date.now();
    const systemMessage: Message = {
      id: messageId,
      chatId,
      senderId: 'system',
      text,
      timestamp: now,
      isRead: false,
      isSystem: true
    };

    // Получаем текущие сообщения и добавляем новое
    const messages = await getChatMessages(chatId);
    messages.push(systemMessage);
    await setItem(`messages.${chatId}`, messages);

    // Обновляем информацию о последнем сообщении в чате
    chat.lastMessage = systemMessage;
    chat.updatedAt = now;
    await setItem(`chats.${chatId}`, chat);

    return true;
  } catch (error) {
    console.error(`Ошибка при добавлении системного сообщения в чат ${chatId}:`, error);
    return false;
  }
};

// Завершение чата
export const endChat = async (chatId: string): Promise<boolean> => {
  try {
    const chat = await getChatById(chatId);
    if (!chat) {
      return false;
    }

    // Отмечаем чат как завершенный
    chat.ended = true;
    chat.isActive = false;
    chat.updatedAt = Date.now();

    await setItem(`chats.${chatId}`, chat);

    // Добавляем системное сообщение о завершении чата
    await addSystemMessage(chatId, 'Чат был завершен.');

    return true;
  } catch (error) {
    console.error(`Ошибка при завершении чата ${chatId}:`, error);
    return false;
  }
};

// Получение непрочитанных сообщений
export const getUnreadMessagesCount = async (userId: string, chatId?: string): Promise<number> => {
  try {
    // Если указан chatId, считаем непрочитанные только в этом чате
    if (chatId) {
      const messages = await getChatMessages(chatId);
      return messages.filter(msg => !msg.isRead && msg.senderId !== userId).length;
    }

    // Если chatId не указан, считаем все непрочитанные сообщения
    const userChats = await getUserChats(userId);
    let totalUnread = 0;

    for (const chat of userChats) {
      const messages = await getChatMessages(chat);
      totalUnread += messages.filter(msg => !msg.isRead && msg.senderId !== userId).length;
    }

    return totalUnread;
  } catch (error) {
    console.error(`Ошибка при подсчете непрочитанных сообщений для ${userId}:`, error);
    return 0;
  }
};

// Устанавливаем активный чат для пользователя
export const setActiveChat = async (userId: string, chatId: string): Promise<void> => {
  try {
    await setItem(`active_chat_${userId}`, chatId);
    // Для совместимости также сохраняем общий ключ активного чата
    await setItem('active_chat_id', chatId);
    console.log(`[setActiveChat] Активный чат успешно установлен для ${userId}`);
  } catch (error) {
    console.error('[setActiveChat] Ошибка при установке активного чата:', error);
  }
};

// Получить активный чат пользователя
export const getActiveChat = async (userId: string): Promise<string | null> => {
  try {
    const chatId = await getItem(`active_chat_${userId}`);
    if (!chatId) return null;
    // Проверяем существование чата
    const chat = await getChatById(chatId);
    if (!chat) {
      await removeItem(`active_chat_${userId}`);
      return null;
    }
    return chatId;
  } catch (error) {
    console.error('[getActiveChat] Ошибка при получении активного чата:', error);
    return null;
  }
};

// Переключение избранного статуса чата
export const toggleFavoriteChat = async (chatId: string, userId: string): Promise<boolean> => {
  try {
    const chat = await getChatById(chatId);
    if (!chat) {
      console.error(`[toggleFavoriteChat] Чат с ID ${chatId} не найден`);
      return false;
    }

    // Получаем список избранных чатов пользователя
    const favoriteChats: string[] = await getItem(`favorite_chats.${userId}`) || [];

    // Проверяем, есть ли данный чат в избранном
    const isFavorite = favoriteChats.includes(chatId);

    if (isFavorite) {
      // Удаляем из избранного
      const updatedFavorites = favoriteChats.filter(id => id !== chatId);
      await setItem(`favorite_chats.${userId}`, updatedFavorites);
      console.log(`[toggleFavoriteChat] Чат ${chatId} удален из избранного пользователя ${userId}`);
    } else {
      // Добавляем в избранное
      favoriteChats.push(chatId);
      await setItem(`favorite_chats.${userId}`, favoriteChats);
      console.log(`[toggleFavoriteChat] Чат ${chatId} добавлен в избранное пользователя ${userId}`);
    }

    return true;
  } catch (error) {
    console.error(`[toggleFavoriteChat] Ошибка при изменении статуса избранного для чата ${chatId}:`, error);
    return false;
  }
};

// Получение всех чатов пользователя (включая признак избранного)
export const getAllUserChats = async (userId: string): Promise<Chat[]> => {
  try {
    // Получаем список ID чатов пользователя
    const chatIds = await getUserChats(userId);

    // Получаем список избранных чатов
    const favoriteChats: string[] = await getItem(`favorite_chats.${userId}`) || [];

    // Получаем полные данные о каждом чате
    const chats: Chat[] = [];
    for (const chatId of chatIds) {
      const chat = await getChatById(chatId);
      if (chat) {
        // Дополняем чат информацией о том, находится ли он в избранном
        chat.isFavorite = favoriteChats.includes(chatId);
        chats.push(chat);
      }
    }

    // Сортируем: сначала избранные, затем по дате обновления
    return chats.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return b.updatedAt - a.updatedAt;
    });
  } catch (error) {
    console.error(`[getAllUserChats] Ошибка при получении чатов пользователя ${userId}:`, error);
    return [];
  }
};

// Получение активных чатов пользователя (не завершенные)
export const getActiveUserChats = async (userId: string): Promise<Chat[]> => {
  try {
    const allChats = await getAllUserChats(userId);
    return allChats.filter(chat => !chat.ended);
  } catch (error) {
    console.error(`[getActiveUserChats] Ошибка при получении активных чатов пользователя ${userId}:`, error);
    return [];
  }
};
