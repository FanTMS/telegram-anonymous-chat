import { User } from './user'

// Интерфейс для сообщения
export interface Message {
  id: string
  chatId: string
  senderId: string
  text: string
  timestamp: number
  isRead: boolean
  isSystem?: boolean // Флаг для системных сообщений
}

// Интерфейс для чата с дополнительными полями
export interface Chat {
  id: string
  participants: string[] // ID участников
  messages: Message[]
  isActive: boolean
  startedAt: number
  endedAt?: number
  userId: string
  partnerId: string
  createdAt: Date
  lastActivity: Date
  isFavorite?: boolean // Добавлено для отметки избранных чатов
  friendRequestSent?: boolean // Был ли отправлен запрос в друзья
  friendRequestAccepted?: boolean // Принят ли запрос в друзья
  gameRequestSent?: boolean // Был ли отправлен запрос на игру
  gameRequestAccepted?: boolean // Принят ли запрос на игру
  gameData?: GameResult // Данные текущей или последней игры
}

// Интерфейс для результатов игры "Камень-ножницы-бумага"
export type GameChoice = 'rock' | 'paper' | 'scissors'

export interface GameResult {
  chatId: string
  player1Id: string
  player2Id: string
  player1Choice?: GameChoice
  player2Choice?: GameChoice
  winner?: string // ID победителя, undefined если ничья
  timestamp: number
  isCompleted: boolean
}

// Получить все активные чаты пользователя
export const getUserChats = (userId: string): Chat[] => {
  try {
    const chatsData = localStorage.getItem('chats')
    const chats: Chat[] = chatsData ? JSON.parse(chatsData) : []

    // Фильтруем чаты, в которых участвует пользователь
    return chats.filter(chat => chat.participants.includes(userId))
  } catch (error) {
    console.error('Ошибка при получении чатов пользователя:', error)
    return []
  }
}

// Получить конкретный чат по ID - убедимся, что функция корректно находит чат
export const getChatById = (chatId: string): Chat | null => {
  try {
    const chatsData = localStorage.getItem('chats');
    if (!chatsData) {
      console.log('Нет сохраненных чатов');
      return null;
    }

    const chats: Chat[] = JSON.parse(chatsData);

    // Проверяем, что chats - это массив
    if (!Array.isArray(chats)) {
      console.error('Данные чатов повреждены');
      return null;
    }

    const chat = chats.find(c => c.id === chatId);

    if (!chat) {
      console.log(`Чат с ID ${chatId} не найден`);
      return null;
    }

    console.log(`Найден чат: ${chat.id}`);
    return chat;
  } catch (error) {
    console.error('Ошибка при получении чата по ID:', error);
    return null;
  }
}

// Отправить сообщение в чат
export const sendMessage = (chatId: string, senderId: string, text: string): Message | null => {
  try {
    const chatsData = localStorage.getItem('chats')
    const chats: Chat[] = chatsData ? JSON.parse(chatsData) : []

    const chatIndex = chats.findIndex(chat => chat.id === chatId)

    if (chatIndex === -1) return null

    // Проверяем, активен ли чат
    if (!chats[chatIndex].isActive) {
      console.error('Нельзя отправить сообщение в завершенный чат');
      return null;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      chatId,
      senderId,
      text,
      timestamp: Date.now(),
      isRead: false
    }

    chats[chatIndex].messages.push(newMessage)
    chats[chatIndex].lastActivity = new Date()

    localStorage.setItem('chats', JSON.stringify(chats))

    return newMessage
  } catch (error) {
    console.error('Ошибка при отправке сообщения:', error)
    return null
  }
}

// Создание нового чата - убедимся, что функция надежно сохраняет чат
export const createChat = (participants: string[]): Chat | null => {
  try {
    if (!participants || participants.length < 2) {
      console.error('Недостаточно участников для создания чата');
      return null;
    }

    // Получаем текущие чаты
    const chatsData = localStorage.getItem('chats');
    let chats: Chat[] = [];

    if (chatsData) {
      try {
        chats = JSON.parse(chatsData);
        // Убедимся, что chats - это массив
        if (!Array.isArray(chats)) {
          console.error('Данные чатов повреждены, создаем новый массив');
          chats = [];
        }
      } catch (e) {
        console.error('Ошибка при чтении данных чатов:', e);
        chats = [];
      }
    }

    // Создаем новый чат
    const newChat: Chat = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      participants: participants,
      messages: [],
      createdAt: new Date(),
      isActive: true,
      startedAt: Date.now(),
      userId: participants[0],
      partnerId: participants[1],
      lastActivity: new Date()
    };

    console.log(`Создаем новый чат с ID: ${newChat.id}`);

    // Добавляем новый чат в список и сохраняем
    chats.push(newChat);
    localStorage.setItem('chats', JSON.stringify(chats));

    console.log(`Чат успешно создан и сохранен: ${newChat.id}`);

    return newChat;
  } catch (error) {
    console.error('Ошибка при создании чата:', error);
    return null;
  }
}

// Завершить чат (улучшенная версия с сохранением истории)
export const endChat = (chatId: string): boolean => {
  try {
    console.log(`Попытка завершения чата ${chatId}`);

    const chatsData = localStorage.getItem('chats');
    if (!chatsData) {
      console.error('Список чатов не найден');
      return false;
    }

    const chats: Chat[] = JSON.parse(chatsData);
    const chatIndex = chats.findIndex(chat => chat.id === chatId);

    if (chatIndex === -1) {
      console.error(`Чат с ID ${chatId} не найден`);
      return false;
    }

    // Устанавливаем флаг завершения, но не удаляем чат
    chats[chatIndex].isActive = false;
    chats[chatIndex].endedAt = Date.now();

    // Добавляем системное сообщение о завершении чата
    const systemMessage: Message = {
      id: `system_${Date.now()}`,
      chatId,
      senderId: 'system',
      text: 'Чат был завершен',
      timestamp: Date.now(),
      isRead: true,
      isSystem: true
    };

    chats[chatIndex].messages.push(systemMessage);
    localStorage.setItem('chats', JSON.stringify(chats));

    console.log(`Чат ${chatId} успешно завершен и сохранен в истории`);
    return true;
  } catch (error) {
    console.error('Ошибка при завершении чата:', error);
    return false;
  }
};

// Упрощенная функция получения всех чатов пользователя
export const getAllUserChats = (userId: string): Chat[] => {
  if (!userId) {
    console.error('getAllUserChats: ID пользователя не указан');
    return [];
  }

  try {
    const chatsData = localStorage.getItem('chats');
    if (!chatsData) {
      return [];
    }

    let parsedChats;
    try {
      parsedChats = JSON.parse(chatsData);
    } catch (parseError) {
      console.error('Error parsing chats data:', parseError);
      return [];
    }

    if (!Array.isArray(parsedChats)) {
      console.error('Chats data is not an array');
      return [];
    }

    // Фильтруем чаты пользователя с дополнительными проверками
    return parsedChats.filter(chat =>
      chat &&
      typeof chat === 'object' &&
      Array.isArray(chat.participants) &&
      chat.participants.includes(userId)
    );
  } catch (error) {
    console.error('Error in getAllUserChats:', error);
    return [];
  }
};

// Упрощенные версии функций для активных и завершенных чатов
export const getActiveUserChats = (userId: string): Chat[] => {
  try {
    const allChats = getAllUserChats(userId);
    return allChats.filter(chat => Boolean(chat.isActive) === true);
  } catch (error) {
    console.error('Error in getActiveUserChats:', error);
    return [];
  }
};

export const getEndedUserChats = (userId: string): Chat[] => {
  try {
    const allChats = getAllUserChats(userId);
    return allChats.filter(chat => Boolean(chat.isActive) === false);
  } catch (error) {
    console.error('Error in getEndedUserChats:', error);
    return [];
  }
};

// Отметить чат как избранный
export const toggleFavoriteChat = (chatId: string, isFavorite: boolean): boolean => {
  try {
    const chatsData = localStorage.getItem('chats');
    if (!chatsData) return false;

    const chats: Chat[] = JSON.parse(chatsData);
    const chatIndex = chats.findIndex(chat => chat.id === chatId);

    if (chatIndex === -1) return false;

    // Обновляем статус избранного
    chats[chatIndex].isFavorite = isFavorite;
    localStorage.setItem('chats', JSON.stringify(chats));

    return true;
  } catch (error) {
    console.error('Ошибка при изменении статуса избранного чата:', error);
    return false;
  }
};

// Обновить чат
export const updateChat = (chatId: string, updates: Partial<Chat>): boolean => {
  try {
    const chatsData = localStorage.getItem('chats');
    if (!chatsData) return false;

    const chats: Chat[] = JSON.parse(chatsData);
    const chatIndex = chats.findIndex(chat => chat.id === chatId);

    if (chatIndex === -1) return false;

    // Обновляем чат указанными полями
    chats[chatIndex] = { ...chats[chatIndex], ...updates };
    localStorage.setItem('chats', JSON.stringify(chats));

    return true;
  } catch (error) {
    console.error('Ошибка при обновлении чата:', error);
    return false;
  }
};

// Игра "Камень-ножницы-бумага"
export const playGame = (
  chatId: string,
  player1Id: string,
  player2Id: string,
  player1Choice: GameChoice,
  player2Choice: GameChoice
): GameResult => {
  // Определяем победителя
  let winner: string | undefined

  if (player1Choice === player2Choice) {
    winner = undefined // Ничья
  } else if (
    (player1Choice === 'rock' && player2Choice === 'scissors') ||
    (player1Choice === 'paper' && player2Choice === 'rock') ||
    (player1Choice === 'scissors' && player2Choice === 'paper')
  ) {
    winner = player1Id
  } else {
    winner = player2Id
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
  }

  // Сохраняем результат игры
  try {
    const gamesData = localStorage.getItem('games')
    const games: GameResult[] = gamesData ? JSON.parse(gamesData) : []

    games.push(result)

    localStorage.setItem('games', JSON.stringify(games))
  } catch (error) {
    console.error('Ошибка при сохранении результата игры:', error)
  }

  return result
}

// Получить чаты по ID пользователя
export const getChatsByUserId = (userId: string): Chat[] => {
  const allChats: Chat[] = getUserChats(userId)
  return allChats.filter(chat => chat.userId === userId || chat.partnerId === userId)
}

// Добавить системное сообщение в чат
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

    const chatsData = localStorage.getItem('chats');
    if (!chatsData) return null;

    const chats: Chat[] = JSON.parse(chatsData);
    const chatIndex = chats.findIndex(chat => chat.id === chatId);

    if (chatIndex === -1) return null;

    // Добавляем системное сообщение в чат
    chats[chatIndex].messages.push(systemMessage);
    localStorage.setItem('chats', JSON.stringify(chats));

    return systemMessage;
  } catch (error) {
    console.error('Ошибка при добавлении системного сообщения:', error);
    return null;
  }
};
