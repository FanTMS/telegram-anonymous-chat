import { User } from './user'
import { db } from './database'
import { storageAPI } from './storage-wrapper'
import faunadb from 'faunadb'
import { config, hasFaunaCredentials } from './config'

// FaunaDB configuration
const q = faunadb.query
let faunaClient: faunadb.Client | null = null

// Initialize FaunaDB client if FAUNA_SECRET is available
try {
  if (hasFaunaCredentials()) {
    faunaClient = new faunadb.Client({
      secret: config.faunaSecret!,
      domain: 'db.fauna.com',
      scheme: 'https',
    })
    console.log('FaunaDB client initialized in chat.ts')
  } else {
    console.warn('No FaunaDB secret found in chat.ts, falling back to local storage')
  }
} catch (error) {
  console.error('Error initializing FaunaDB client in chat.ts:', error)
}

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
  ended: any
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

// Получить все активные чаты пользователя с поддержкой FaunaDB
export const getUserChats = async (userId: string): Promise<Chat[]> => {
  try {
    // Пытаемся получить чаты из FaunaDB
    if (faunaClient) {
      try {
        // Поиск всех чатов, в которых участвует пользователь
        const result = await faunaClient.query(
          q.Map(
            q.Paginate(
              q.Match(q.Index('chat_by_participant'), userId),
              { size: 1000 }
            ),
            q.Lambda('chatRef', q.Get(q.Var('chatRef')))
          )
        ) as { data?: any[] };

        if (result && result.data && Array.isArray(result.data)) {
          const chats = result.data.map((item: any) => item.data) as Chat[];
          console.log(`Получено ${chats.length} чатов из FaunaDB для пользователя ${userId}`);

          // Сохраняем копию в localStorage для offline доступа
          storageAPI.setItem('chats', JSON.stringify(chats));

          return chats;
        }
      } catch (faunaError) {
        console.error('Ошибка при получении чатов из FaunaDB:', faunaError);
        // Если произошла ошибка, используем локальное хранилище
      }
    }

    // Резервный вариант - получаем из localStorage
    const chatsData = localStorage.getItem('chats');
    const chats: Chat[] = chatsData ? JSON.parse(chatsData) : [];

    // Фильтруем чаты, в которых участвует пользователь
    return chats.filter(chat => chat.participants.includes(userId));
  } catch (error) {
    console.error('Ошибка при получении чатов пользователя:', error);
    return [];
  }
}

// Получить конкретный чат по ID с поддержкой FaunaDB
// Interface for FaunaDB document structure
interface FaunaDocument<T> {
  ref: any;
  ts: number;
  data: T;
}

export const getChatById = async (chatId: string): Promise<Chat | null> => {
  try {
    if (!chatId) {
      console.error('getChatById: ID чата не указан');
      return null;
    }

    // Пытаемся получить чат из FaunaDB
    if (faunaClient) {
      try {
        const result = await faunaClient.query(
          q.Let(
            {
              chatRef: q.Match(q.Index('chat_by_id'), chatId)
            },
            q.If(
              q.Exists(q.Var('chatRef')),
              q.Get(q.Var('chatRef')),
              null
            )
          )
        ) as FaunaDocument<Chat> | null;

        if (result !== null) {
          const chat = result.data;
          console.log(`Чат с ID ${chatId} найден в FaunaDB`);
          return chat;
        }
      } catch (faunaError) {
        console.error(`Ошибка при получении чата из FaunaDB (ID: ${chatId}):`, faunaError);
        // Если произошла ошибка, используем локальное хранилище
      }
    }

    // Резервный вариант - получаем из localStorage
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

// Сохранение чата в FaunaDB
const saveChatToFauna = async (chat: Chat): Promise<boolean> => {
  if (!faunaClient) return false;

  try {
    await faunaClient.query(
      q.Let(
        {
          chatRef: q.Match(q.Index('chat_by_id'), chat.id)
        },
        q.If(
          q.Exists(q.Var('chatRef')),
          q.Update(
            q.Select('ref', q.Get(q.Var('chatRef'))),
            { data: chat }
          ),
          q.Create(q.Collection('chats'), {
            data: chat
          })
        )
      )
    );

    console.log(`Чат ${chat.id} успешно сохранен в FaunaDB`);
    return true;
  } catch (error) {
    console.error(`Ошибка при сохранении чата в FaunaDB (ID: ${chat.id}):`, error);
    return false;
  }
}

// Отправить сообщение в чат с поддержкой FaunaDB
export const sendMessage = async (chatId: string, senderId: string, text: string): Promise<Message | null> => {
  try {
    // Получаем чат из БД
    const chat = await getChatById(chatId);
    if (!chat) return null;

    // Проверяем, активен ли чат
    if (!chat.isActive) {
      console.error('Нельзя отправить сообщение в завершенный чат');
      return null;
    }

    // Создаем новое сообщение
    const newMessage: Message = {
      id: Date.now().toString(),
      chatId,
      senderId,
      text,
      timestamp: Date.now(),
      isRead: false
    };

    // Добавляем сообщение в чат
    chat.messages.push(newMessage);
    chat.lastActivity = new Date();

    // Сохраняем обновленный чат
    await saveChat(chat);

    return newMessage;
  } catch (error) {
    console.error('Ошибка при отправке сообщения:', error);
    return null;
  }
}

// Общая функция для сохранения чата (FaunaDB + localStorage)
export const saveChat = async (chat: Chat): Promise<boolean> => {
  try {
    // Сохраняем в локальное хранилище
    const chatsData = localStorage.getItem('chats');
    let chats: Chat[] = [];

    if (chatsData) {
      chats = JSON.parse(chatsData);
      const chatIndex = chats.findIndex(c => c.id === chat.id);

      if (chatIndex !== -1) {
        chats[chatIndex] = chat;
      } else {
        chats.push(chat);
      }
    } else {
      chats = [chat];
    }

    localStorage.setItem('chats', JSON.stringify(chats));

    // Сохраняем в FaunaDB если доступна
    if (faunaClient) {
      await saveChatToFauna(chat);
    }

    return true;
  } catch (error) {
    console.error('Ошибка при сохранении чата:', error);
    return false;
  }
}

// Создание нового чата - улучшенная версия с поддержкой FaunaDB
export const createChat = async (participants: string[]): Promise<Chat | null> => {
  try {
    if (!participants || participants.length < 2) {
      console.error('Недостаточно участников для создания чата');
      return null;
    }

    console.log(`[createChat] Создание чата для участников: ${participants.join(', ')}`);

    // Создаем уникальный ID для чата
    const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[createChat] Создан ID чата: ${chatId}`);

    // Создаем новый чат
    const newChat: Chat = {
      id: chatId,
      participants: [...participants], // Создаем копию массива
      messages: [],
      createdAt: new Date(),
      isActive: true,
      startedAt: Date.now(),
      userId: participants[0],
      partnerId: participants[1],
      lastActivity: new Date(),
      ended: undefined
    };

    // Сохраняем чат
    await saveChat(newChat);

    console.log(`[createChat] Чат успешно создан и сохранен: ${newChat.id}`);
    return newChat;
  } catch (error) {
    console.error('[createChat] Ошибка при создании чата:', error);
    return null;
  }
}

// Завершить чат с поддержкой FaunaDB
export const endChat = async (chatId: string): Promise<boolean> => {
  try {
    console.log(`Попытка завершения чата ${chatId}`);

    // Получаем чат
    const chat = await getChatById(chatId);
    if (!chat) {
      console.error(`Чат с ID ${chatId} не найден`);
      return false;
    }

    // Устанавливаем флаг завершения, но не удаляем чат
    chat.isActive = false;
    chat.endedAt = Date.now();

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

    chat.messages.push(systemMessage);

    // Сохраняем обновленный чат
    await saveChat(chat);

    console.log(`Чат ${chatId} успешно завершен и сохранен в истории`);
    return true;
  } catch (error) {
    console.error('Ошибка при завершении чата:', error);
    return false;
  }
};

// Упрощенная функция получения всех чатов пользователя
export const getAllUserChats = async (userId: string): Promise<Chat[]> => {
  if (!userId) {
    console.error('getAllUserChats: ID пользователя не указан');
    return [];
  }

  try {
    const chats = await getUserChats(userId);
    return chats;
  } catch (error) {
    console.error('Error in getAllUserChats:', error);
    return [];
  }
};

// Упрощенные версии функций для активных и завершенных чатов
export const getActiveUserChats = async (userId: string): Promise<Chat[]> => {
  try {
    const allChats = await getAllUserChats(userId);
    return allChats.filter(chat => Boolean(chat.isActive) === true);
  } catch (error) {
    console.error('Error in getActiveUserChats:', error);
    return [];
  }
};

export const getEndedUserChats = async (userId: string): Promise<Chat[]> => {
  try {
    const allChats = await getAllUserChats(userId);
    return allChats.filter(chat => Boolean(chat.isActive) === false);
  } catch (error) {
    console.error('Error in getEndedUserChats:', error);
    return [];
  }
};

// Отметить чат как избранный с поддержкой FaunaDB
export const toggleFavoriteChat = async (chatId: string, isFavorite: boolean): Promise<boolean> => {
  try {
    const chat = await getChatById(chatId);
    if (!chat) return false;

    // Обновляем статус избранного
    chat.isFavorite = isFavorite;

    // Сохраняем обновленный чат
    return await saveChat(chat);
  } catch (error) {
    console.error('Ошибка при изменении статуса избранного чата:', error);
    return false;
  }
};

// Обновить чат с поддержкой FaunaDB
export const updateChat = async (chatId: string, updates: Partial<Chat>): Promise<boolean> => {
  try {
    const chat = await getChatById(chatId);
    if (!chat) return false;

    // Обновляем чат указанными полями
    Object.assign(chat, updates);

    // Сохраняем обновленный чат
    return await saveChat(chat);
  } catch (error) {
    console.error('Ошибка при обновлении чата:', error);
    return false;
  }
};

// Игра "Камень-ножницы-бумага" с поддержкой FaunaDB
export const playGame = async (
  chatId: string,
  player1Id: string,
  player2Id: string,
  player1Choice: GameChoice,
  player2Choice: GameChoice
): Promise<GameResult> => {
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
    // Сохраняем в localStorage
    const gamesData = localStorage.getItem('games');
    const games: GameResult[] = gamesData ? JSON.parse(gamesData) : [];
    games.push(result);
    localStorage.setItem('games', JSON.stringify(games));

    // Сохраняем в FaunaDB если доступна
    if (faunaClient) {
      try {
        await faunaClient.query(
          q.Create(q.Collection('games'), {
            data: result
          })
        );
      } catch (faunaError) {
        console.error('Ошибка при сохранении результата игры в FaunaDB:', faunaError);
      }
    }

    // Обновляем данные игры в чате
    const chat = await getChatById(chatId);
    if (chat) {
      chat.gameData = result;
      await saveChat(chat);
    }
  } catch (error) {
    console.error('Ошибка при сохранении результата игры:', error);
  }

  return result;
};

// Получить чаты по ID пользователя
export const getChatsByUserId = async (userId: string): Promise<Chat[]> => {
  const allChats = await getUserChats(userId);
  return allChats.filter(chat => chat.userId === userId || chat.partnerId === userId);
};

// Добавить системное сообщение в чат с поддержкой FaunaDB
export const addSystemMessage = async (chatId: string, text: string): Promise<Message | null> => {
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

    const chat = await getChatById(chatId);
    if (!chat) return null;

    // Добавляем системное сообщение в чат
    chat.messages.push(systemMessage);

    // Сохраняем чат
    await saveChat(chat);

    return systemMessage;
  } catch (error) {
    console.error('Ошибка при добавлении системного сообщения:', error);
    return null;
  }
};
