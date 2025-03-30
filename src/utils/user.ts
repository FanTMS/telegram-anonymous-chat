import { db, telegramApi } from './database'
import { MatchingStrategy } from './recommendations'
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
      scheme: 'https'
    })
    console.log('FaunaDB client initialized in user.ts')
  } else {
    console.warn('No FaunaDB secret found in user.ts, falling back to local storage')
  }
} catch (error) {
  console.error('Error initializing FaunaDB client in user.ts:', error)
}

// Тип для данных Telegram
export interface TelegramData {
  authDate: number
  telegramId: string
  username?: string
  firstName?: string
  lastName?: string
  photoUrl?: string
  languageCode?: string
}

// Тип для настроек приватности
export interface PrivacySettings {
  privacyLevel?: 'high' | 'medium' | 'low'
  showOnlineStatus?: boolean
  showLastSeen?: boolean
  allowProfileSearch?: boolean
}

// Тип для настроек уведомлений
export interface NotificationSettings {
  newMessages?: boolean
  chatRequests?: boolean
  systemUpdates?: boolean
  sounds?: boolean
}

// Тип для пользовательских настроек
export interface UserSettings {
  // Настройки приватности
  privacyLevel?: 'high' | 'medium' | 'low'
  showOnlineStatus?: boolean
  showLastSeen?: boolean
  allowProfileSearch?: boolean

  // Настройки подбора собеседников
  matchingPreference?: MatchingStrategy

  // Настройки уведомлений
  notifications?: NotificationSettings

  // Настройки внешнего вида
  theme?: 'light' | 'dark' | 'system'
}

// Тип для пользователя
export interface User {
  currentUser: {}
  existingUserByTelegramId: {}
  verified: boolean
  id: string
  name?: string
  bio?: string
  avatar?: string | null
  rating?: number
  chatCount?: number
  friends?: string[]
  interests?: string[]
  age?: number
  city?: string
  isAnonymous: boolean
  createdAt: number
  lastActive: number
  isAdmin?: boolean
  isBlocked?: boolean
  telegramData?: TelegramData

  // Поля для предпочтений пользователя
  settings?: UserSettings     // Пользовательские настройки
  status?: string             // Статус пользователя ("В сети", "Недавно был", и т.д.)
  languages?: string[]        // Языки, которыми владеет пользователь
  region?: string             // Регион/страна пользователя
  favorites?: string[]        // Список ID избранных пользователей
}

// Ключ для хранилища
const USER_KEY_PREFIX = 'user_'
const CURRENT_USER_KEY = 'current_user_id'
const ADMINS_KEY = 'admin_users'

// Инициализация интеграции с Telegram при загрузке модуля
telegramApi.initialize().then(async success => {
  if (success) {
    console.log('Telegram API initialized successfully')

    // Если пользователь авторизован через Telegram, проверяем и создаем профиль
    const telegramId = telegramApi.getUserId()
    if (telegramId) {
      try {
        const existingUser = await getUserByTelegramId(telegramId)

        if (!existingUser) {
          // Создаем нового пользователя из данных Telegram
          createUserFromTelegram(telegramId)
            .then(user => console.log('Created new user from Telegram data'))
            .catch(err => console.error('Failed to create user from Telegram data:', err))
        } else {
          // Обновляем текущего пользователя и его lastActive
          setCurrentUser(existingUser.id)
          existingUser.lastActive = Date.now()
          await saveUser(existingUser)
            .then(() => console.log('Updated existing user session'))
            .catch(err => console.error('Failed to update user session:', err))
        }
      } catch (error) {
        console.error('Error during Telegram user initialization:', error)
      }
    }
  } else {
    // Проверяем, был ли пользователь уже авторизован
    const currentUserId = getCurrentUserId()
    if (currentUserId) {
      console.log('Using existing user session')
    } else {
      console.warn('Telegram API initialization failed, using local mode')
    }
  }
})

// Получение списка всех пользователей с FaunaDB поддержкой
export const getUsers = async (): Promise<User[]> => {
  try {
    // Попытка получить пользователей из FaunaDB
    if (faunaClient) {
      try {
        const result: any = await faunaClient.query(
          q.Map(
            q.Paginate(q.Documents(q.Collection('users')), { size: 1000 }),
            q.Lambda('ref', q.Get(q.Var('ref')))
          )
        );

        if (result && result.data && Array.isArray(result.data)) {
          const users = result.data.map((doc: any) => doc.data);
          console.log('Получены пользователи из FaunaDB:', users.length);

          // Сохраняем копию в localStorage
          storageAPI.setItem('users', JSON.stringify(users));

          return users as User[];
        }
      } catch (faunaError) {
        console.error('Ошибка при получении пользователей из FaunaDB:', faunaError);
        // Если произошла ошибка, используем локальное хранилище
      }
    }

    // Резервный вариант: используем localStorage
    const usersData = storageAPI.getItem('users')
    if (!usersData) {
      return []
    }
    return JSON.parse(usersData)
  } catch (error) {
    console.error('Error getting users:', error)
    return [] // Возвращаем пустой массив вместо ошибки
  }
}

// Получение пользователя по ID - улучшенная версия с FaunaDB поддержкой
export const getUserById = async (id: string): Promise<User | null> => {
  try {
    console.log(`Поиск пользователя с ID ${id}`);
    if (!id) {
      console.error('getUserById получил пустой ID');
      return null;
    }

    // Попытка получить пользователя из FaunaDB
    if (faunaClient) {
      try {
        const result: any = await faunaClient.query(
          q.Let(
            {
              userRef: q.Match(q.Index('user_by_id'), id)
            },
            q.If(
              q.Exists(q.Var('userRef')),
              q.Get(q.Var('userRef')),
              null
            )
          )
        );

        if (result !== null) {
          const user = result.data as User;
          console.log(`Пользователь найден в FaunaDB: ${user.name} (${user.id})`);

          // Сохраняем в localStorage для кэширования
          const key = `${USER_KEY_PREFIX}${id}`;
          storageAPI.setItem(key, JSON.stringify(user));

          return user;
        }
      } catch (faunaError) {
        console.error(`Ошибка при получении пользователя из FaunaDB (ID: ${id}):`, faunaError);
        // Если произошла ошибка, используем локальное хранилище
      }
    }

    // Резервный вариант: используем localStorage
    const key = `${USER_KEY_PREFIX}${id}`;
    const userData = storageAPI.getItem(key);

    if (userData) {
      try {
        const user = JSON.parse(userData);
        console.log(`Пользователь найден в localStorage: ${user.name} (${user.id})`);
        return user;
      } catch (parseError) {
        console.error('Ошибка при парсинге данных пользователя:', parseError);
      }
    }

    // Если пользователь не найден в индивидуальном хранилище, ищем в общем списке
    const usersData = storageAPI.getItem('users');
    if (usersData) {
      try {
        const users = JSON.parse(usersData);
        if (Array.isArray(users)) {
          // Ищем пользователя по ID
          const user = users.find(u => u && u.id === id);
          if (user) {
            console.log(`Пользователь найден в общем списке: ${user.name} (${user.id})`);
            return user;
          }
        }
      } catch (e) {
        console.error('Ошибка при парсинге списка пользователей', e);
      }
    }

    console.log(`Пользователь с ID ${id} не найден`);
    return null;
  } catch (error) {
    console.error(`Ошибка при получении пользователя по ID (${id}):`, error);
    return null;
  }
}

// Упрощенная синхронная функция получения пользователя
export const getUserByIdSync = (userId: string): User | null => {
  if (!userId) return null;

  try {
    const key = `${USER_KEY_PREFIX}${userId}`;
    const userData = storageAPI.getItem(key);

    if (!userData) {
      return {
        id: userId,
        name: 'Собеседник',
        isAnonymous: true,
        createdAt: Date.now(),
        lastActive: Date.now(),
        currentUser: {},
        existingUserByTelegramId: {},
        verified: false
      };
    }

    return JSON.parse(userData);
  } catch (error) {
    console.error(`Error in getUserByIdSync for ${userId}:`, error);
    return {
      id: userId,
      name: 'Собеседник',
      isAnonymous: true,
      createdAt: Date.now(),
      lastActive: Date.now(),
      currentUser: {},
      existingUserByTelegramId: {},
      verified: false
    };
  }
}

// Функция поиска пользователя по Telegram ID с поддержкой FaunaDB
export const getUserByTelegramId = async (telegramId: string): Promise<User | null> => {
  try {
    if (!telegramId) {
      console.warn('getUserByTelegramId: telegramId не предоставлен');
      return null;
    }

    // Пытаемся найти пользователя в FaunaDB
    if (faunaClient) {
      try {
        const result: any = await faunaClient.query(
          q.Let(
            {
              userRef: q.Match(q.Index('user_by_telegram_id'), telegramId)
            },
            q.If(
              q.Exists(q.Var('userRef')),
              q.Get(q.Var('userRef')),
              null
            )
          )
        );

        if (result !== null) {
          const user = result.data as User;
          console.log(`Пользователь с Telegram ID ${telegramId} найден в FaunaDB: ${user.name} (ID: ${user.id})`);

          // Сохраняем в localStorage для кэширования
          const userKey = `${USER_KEY_PREFIX}${user.id}`;
          storageAPI.setItem(userKey, JSON.stringify(user));

          // Создаем ссылку для быстрого поиска
          const telegramUserKey = `telegram_user_${telegramId}`;
          storageAPI.setItem(telegramUserKey, JSON.stringify({ userId: user.id, timestamp: Date.now() }));

          return user;
        }
      } catch (faunaError) {
        console.error(`Ошибка при поиске пользователя в FaunaDB по Telegram ID (${telegramId}):`, faunaError);
        // Если произошла ошибка, используем локальное хранилище
      }
    }

    // Сначала пробуем найти пользователя в индивидуальных записях пользователей (более быстрый поиск)
    const telegramUserKey = `telegram_user_${telegramId}`;
    const linkedUserData = storageAPI.getItem(telegramUserKey);

    if (linkedUserData) {
      try {
        // Если найдена ссылка на пользователя по Telegram ID, получаем пользователя по его ID
        const userId = JSON.parse(linkedUserData).userId;
        if (userId) {
          const userKey = `${USER_KEY_PREFIX}${userId}`;
          const userData = storageAPI.getItem(userKey);
          if (userData) {
            return JSON.parse(userData);
          }
        }
      } catch (e) {
        console.error('Ошибка при обработке связи Telegram-пользователь:', e);
      }
    }

    // Если не нашли в индивидуальных записях, ищем в общем списке пользователей
    const users = await getUsers();

    // Ищем пользователя с заданным Telegram ID
    const user = users.find(user =>
      user.telegramData &&
      user.telegramData.telegramId &&
      user.telegramData.telegramId === telegramId
    );

    if (user) {
      console.log(`Найден пользователь с Telegram ID ${telegramId}: ${user.name} (ID: ${user.id})`);

      // Создаем ссылку в хранилище для ускорения будущих поисков
      try {
        storageAPI.setItem(telegramUserKey, JSON.stringify({ userId: user.id, timestamp: Date.now() }));
      } catch (e) {
        console.warn('Не удалось создать ссылку Telegram ID -> User ID:', e);
      }

      return user;
    } else {
      console.log(`Пользователь с Telegram ID ${telegramId} не найден`);
      return null;
    }
  } catch (error) {
    console.error('Ошибка при поиске пользователя по Telegram ID:', error);
    return null;
  }
}

// Сохранение пользователя с поддержкой FaunaDB
export const saveUser = async (user: User): Promise<boolean> => {
  try {
    // Обновляем время последней активности
    user.lastActive = Date.now()

    const key = `${USER_KEY_PREFIX}${user.id}`
    // Сохраняем пользователя в хранилище напрямую для надежности
    storageAPI.setItem(key, JSON.stringify(user))

    // Сохраняем в FaunaDB, если клиент инициализирован
    if (faunaClient) {
      try {
        await faunaClient.query(
          q.Let(
            {
              userRef: q.Match(q.Index('user_by_id'), user.id)
            },
            q.If(
              q.Exists(q.Var('userRef')),
              q.Update(
                q.Select('ref', q.Get(q.Var('userRef'))),
                { data: user }
              ),
              q.Create(q.Collection('users'), {
                data: user
              })
            )
          )
        );
        console.log(`Пользователь ${user.name} (${user.id}) сохранен в FaunaDB`);
      } catch (faunaError) {
        console.error('Ошибка при сохранении пользователя в FaunaDB:', faunaError);
        // Продолжаем выполнение, так как данные уже сохранены в localStorage
      }
    }

    // Если используется db, также сохраняем там
    await db.saveData(key, user)

    // Если это текущий пользователь, обновляем ссылку на него
    const currentUserId = getCurrentUserId()
    if (currentUserId === user.id || !currentUserId) {
      setCurrentUser(user.id)
    }

    // Обновляем пользователя в общем списке
    updateUserInUsersList(user);

    return true;
  } catch (error) {
    console.error('Failed to save user', error)
    return false
  }
}

// Обновление пользователя в общем списке пользователей
const updateUserInUsersList = async (user: User): Promise<void> => {
  try {
    const users = await getUsers();
    const userIndex = users.findIndex(u => u.id === user.id);

    if (userIndex !== -1) {
      users[userIndex] = user;
    } else {
      users.push(user);
    }

    storageAPI.setItem('users', JSON.stringify(users));
  } catch (error) {
    console.error('Ошибка при обновлении пользователя в общем списке:', error);
  }
}

// Установка текущего пользователя
export const setCurrentUser = (userId: string): void => {
  try {
    storageAPI.setItem(CURRENT_USER_KEY, userId)
  } catch (error) {
    console.error('Failed to set current user', error)
  }
}

// Получение ID текущего пользователя
export const getCurrentUserId = (): string | null => {
  try {
    return storageAPI.getItem(CURRENT_USER_KEY)
  } catch (error) {
    console.error('Failed to get current user ID', error)
    return null
  }
}

// Более надежная функция получения текущего пользователя
export const getCurrentUser = (): User | null => {
  try {
    const userId = storageAPI.getItem(CURRENT_USER_KEY);
    if (!userId) {
      console.log('No current user ID found');
      return null;
    }

    const key = `${USER_KEY_PREFIX}${userId}`;
    const userData = storageAPI.getItem(key);
    if (!userData) {
      console.log(`User data not found for ID ${userId}`);
      return null;
    }

    try {
      return JSON.parse(userData);
    } catch (parseError) {
      console.error('Error parsing user data:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}

// Функция создания пользователя из Telegram с улучшенной поддержкой множества пользователей
export const createUserFromTelegram = async (telegramId: string, preferredName?: string): Promise<User | null> => {
  try {
    // Получаем данные пользователя из Telegram API
    const telegramData = await telegramApi.getUserData();

    if (!telegramData) {
      console.error('Не удалось получить данные пользователя из Telegram');
      return null;
    }

    // Проверяем, существует ли уже пользователь с таким Telegram ID
    const existingUser = await getUserByTelegramId(telegramId);

    if (existingUser) {
      console.log(`Пользователь с Telegram ID ${telegramId} уже существует, обновляем последнюю активность`);

      // Обновляем последнюю активность
      existingUser.lastActive = Date.now();
      saveUser(existingUser);

      // Устанавливаем текущего пользователя
      setCurrentUser(existingUser.id);

      return existingUser;
    }

    // Создаем уникальный ID для нового пользователя
    const userId = `user_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    // Формируем имя пользователя
    const userName = preferredName ||
      telegramData.first_name ||
      `Пользователь ${telegramId.substring(0, 4)}`;

    // Создаем нового пользователя
    const newUser: User = {
      id: userId,
      name: userName,
      age: 0, // По умолчанию возраст не указан
      isAnonymous: false,
      interests: [],
      rating: 0,
      createdAt: Date.now(),
      lastActive: Date.now(),
      verified: true, // Пользователь верифицирован через Telegram
      telegramData: {
        authDate: Math.floor(Date.now() / 1000), // Current timestamp in seconds
        telegramId: telegramId,
        username: telegramData.username || '',
        firstName: telegramData.first_name || '',
        lastName: telegramData.last_name || '',
        photoUrl: telegramData.photo_url || ''
      },
      currentUser: {},
      existingUserByTelegramId: {}
    };

    // Проверяем, является ли пользователь администратором
    const adminTelegramIds = storageAPI.getItem('admin_telegram_ids');
    if (adminTelegramIds) {
      try {
        const adminIds = JSON.parse(adminTelegramIds);
        if (Array.isArray(adminIds) && adminIds.includes(telegramId)) {
          console.log(`Пользователь с Telegram ID ${telegramId} получает права администратора`);
          newUser.isAdmin = true;

          // Добавляем в список администраторов
          addAdmin(userId);
        }
      } catch (e) {
        console.error('Ошибка при проверке прав администратора:', e);
      }
    }

    // Сохраняем пользователя в индивидуальной записи
    await saveUser(newUser);

    // Создаем ссылку в хранилище для ускорения будущих поисков
    try {
      storageAPI.setItem(`telegram_user_${telegramId}`, JSON.stringify({
        userId: newUser.id,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('Не удалось создать ссылку Telegram ID -> User ID:', e);
    }

    // Добавляем в общий список пользователей
    try {
      const usersData = storageAPI.getItem('users');
      const users = usersData ? JSON.parse(usersData) : [];
      users.push(newUser);
      storageAPI.setItem('users', JSON.stringify(users));
    } catch (e) {
      console.error('Ошибка при добавлении пользователя в общий список:', e);
    }

    // Устанавливаем текущего пользователя
    setCurrentUser(userId);

    console.log(`Создан новый пользователь с Telegram ID ${telegramId}: ${newUser.name} (ID: ${userId})`);

    return newUser;
  } catch (error) {
    console.error('Ошибка при создании пользователя из Telegram:', error);
    return null;
  }
};

// Создание демо-пользователя с опциональным именем
export const createDemoUser = (customName?: string): User => {
  const userId = `demo_${Date.now()}`;

  // Генерируем случайные интересы
  const allInterests = [
    'Музыка', 'Кино', 'Путешествия', 'Спорт', 'Искусство',
    'Программирование', 'Животные', 'Игры', 'Книги', 'Кулинария'
  ];

  // Случайно выбираем 2-4 интереса
  const interestCount = Math.floor(Math.random() * 3) + 2;
  const shuffled = [...allInterests].sort(() => 0.5 - Math.random());
  const selectedInterests = shuffled.slice(0, interestCount);

  const demoUser: User = {
    id: userId,
    name: customName || 'Демо Пользователь',
    age: 20 + Math.floor(Math.random() * 15), // Случайный возраст 20-35
    city: ['Москва', 'Санкт-Петербург', 'Казань', 'Новосибирск'][Math.floor(Math.random() * 4)],
    rating: 4 + Math.random(), // Рейтинг 4.0-5.0
    interests: selectedInterests,
    isAnonymous: false,
    createdAt: Date.now(),
    lastActive: Date.now(),
    currentUser: {},
    existingUserByTelegramId: {},
    verified: false,
    // Добавляем базовые настройки
    bio: 'Привет! Я демо-пользователь для тестирования системы. Люблю общаться и находить новых друзей.',
    settings: {
      privacyLevel: 'medium',
      showOnlineStatus: true,
      showLastSeen: true,
      allowProfileSearch: true,
      matchingPreference: 'similar',
      notifications: {
        newMessages: true,
        chatRequests: true,
        systemUpdates: true,
        sounds: true
      },
      theme: 'system'
    },
    languages: ['Русский', 'Английский'],
    region: 'Россия'
  };

  saveUser(demoUser);

  console.log(`Создан демо пользователь: ${demoUser.name} (${userId})`);

  return demoUser;
}

// Создание администратора из данных Telegram
export const createAdminUserFromTelegram = async (telegramId: string, adminName: string): Promise<User | null> => {
  try {
    // Проверяем, существует ли пользователь
    const existingUser = await getUserByTelegramId(telegramId)

    if (existingUser) {
      // Если пользователь существует, делаем его администратором
      existingUser.isAdmin = true
      await saveUser(existingUser)

      // Добавляем в список администраторов
      addAdmin(telegramId)

      return existingUser
    } else {
      // Создаем нового пользователя-администратора
      const userId = `user_${Date.now()}`
      const adminUser: User = {
        id: userId,
        name: adminName,
        rating: 5.0,
        interests: [],
        isAnonymous: false,
        createdAt: Date.now(),
        lastActive: Date.now(),
        currentUser: {},
        existingUserByTelegramId: {},
        verified: true,
        telegramData: {
          authDate: Math.floor(Date.now() / 1000), // Current timestamp in seconds
          telegramId
        },
        settings: {
          privacyLevel: 'high',
          showOnlineStatus: false,
          showLastSeen: false,
          allowProfileSearch: false,
          theme: 'system'
        }
      }

      await saveUser(adminUser)

      // Добавляем в список администраторов
      addAdmin(telegramId)

      return adminUser
    }
  } catch (error) {
    console.error('Failed to create admin user', error)
    return null
  }
}

// Добавление Telegram ID в список администраторов
export const addAdmin = (telegramId: string): void => {
  try {
    const admins = getAdmins()

    if (!admins.includes(telegramId)) {
      admins.push(telegramId)
      storageAPI.setItem(ADMINS_KEY, JSON.stringify(admins))
    }
  } catch (error) {
    console.error('Failed to add admin', error)
  }
}

// Получение списка Telegram ID администраторов
export const getAdmins = (): string[] => {
  try {
    const admins = storageAPI.getItem(ADMINS_KEY)
    return admins ? JSON.parse(admins) : []
  } catch (error) {
    console.error('Failed to get admins list', error)
    return []
  }
}

// Установка статуса администратора по Telegram ID
export const setAdminByTelegramId = async (telegramId: string): Promise<boolean> => {
  try {
    const user = await getUserByTelegramId(telegramId)

    if (user) {
      user.isAdmin = true
      await saveUser(user)

      // Добавляем в список администраторов
      addAdmin(telegramId)

      return true
    }

    return false
  } catch (error) {
    console.error('Failed to set admin by Telegram ID', error)
    return false
  }
}

// Модифицируем функцию для проверки админских прав с учетом локальной разработки
export const isAdmin = (): boolean => {
  try {
    // Проверяем захардкоженное значение ID администратора (для вашего случая)
    const targetAdminId = '5394381166';

    // Проверяем, запущено ли приложение локально
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('192.168.');

    // Если это локальная разработка, автоматически даем права администратора
    if (isLocalhost) {
      console.log('Локальный запуск: права администратора предоставлены автоматически');
      return true;
    }

    // Получаем список админов и выводим в консоль для диагностики
    const admins = getAdmins();
    console.log('Список администраторов при проверке:', admins);

    // Проверяем текущего пользователя
    const currentUser = getCurrentUser();
    console.log('Текущий пользователь при проверке:', currentUser);

    // Если у пользователя явно указан флаг isAdmin
    if (currentUser?.isAdmin) {
      console.log('Пользователь имеет флаг isAdmin: true');
      return true;
    }

    // Проверяем через Telegram ID текущего пользователя
    if (currentUser?.telegramData?.telegramId) {
      const isTelegramAdmin = admins.includes(currentUser.telegramData.telegramId);
      console.log(`Проверка через Telegram ID: ${currentUser.telegramData.telegramId}, результат: ${isTelegramAdmin}`);

      // Если пользователь в списке администраторов, но флаг isAdmin не установлен, исправляем это
      if (isTelegramAdmin && !currentUser.isAdmin) {
        currentUser.isAdmin = true;
        saveUser(currentUser);
        console.log('Обновлен флаг isAdmin для текущего пользователя');
      }

      // Дополнительная проверка для конкретного ID администратора
      if (currentUser.telegramData.telegramId === targetAdminId) {
        console.log(`Обнаружен целевой администратор с ID: ${targetAdminId}`);
        // Если этот пользователь имеет целевой ID, но не в списке администраторов, добавляем его
        if (!admins.includes(targetAdminId)) {
          addAdmin(targetAdminId);
          console.log(`Целевой администратор ${targetAdminId} добавлен в список`);
        }

        // Устанавливаем флаг isAdmin, если он еще не установлен
        if (!currentUser.isAdmin) {
          currentUser.isAdmin = true;
          saveUser(currentUser);
          console.log('Обновлен флаг isAdmin для целевого администратора');
        }

        return true;
      }

      return isTelegramAdmin;
    }

    // Проверка для бота-помощника и других специальных случаев
    if (currentUser?.id?.startsWith('bot_') || currentUser?.id?.startsWith('system_')) {
      console.log('Системный пользователь, права администратора предоставлены');
      return true;
    }

    console.log('Пользователь не имеет прав администратора');
    return false;
  } catch (error) {
    console.error('Failed to check admin status', error);
    return false;
  }
}

// Блокировка пользователя
export const blockUser = (userId: string): boolean => {
  try {
    const key = `${USER_KEY_PREFIX}${userId}`
    const userData = storageAPI.getItem(key)

    if (userData) {
      const user: User = JSON.parse(userData)
      user.isBlocked = true
      storageAPI.setItem(key, JSON.stringify(user))
      return true
    }

    return false
  } catch (error) {
    console.error('Failed to block user', error)
    return false
  }
}

// Разблокировка пользователя
export const unblockUser = (userId: string): boolean => {
  try {
    const key = `${USER_KEY_PREFIX}${userId}`
    const userData = storageAPI.getItem(key)

    if (userData) {
      const user: User = JSON.parse(userData)
      user.isBlocked = false
      storageAPI.setItem(key, JSON.stringify(user))
      return true
    }

    return false
  } catch (error) {
    console.error('Failed to unblock user', error)
    return false
  }
}

// Очистка всей базы данных
export const clearDatabase = async (): Promise<boolean> => {
  try {
    return await db.clearAllData()
  } catch (error) {
    console.error('Failed to clear database', error)
    return false
  }
}

// Обновление рейтинга пользователя
export const updateUserRating = async (userId: string, newRating: number): Promise<boolean> => {
  try {
    // Получаем текущего пользователя
    const user = await getUserById(userId)
    if (!user) {
      return false
    }

    // Обновляем рейтинг
    user.rating = newRating

    // Сохраняем пользователя
    return await saveUser(user)
  } catch (error) {
    console.error('Failed to update user rating:', error)
    return false
  }
}

// Обновление статуса пользователя
export const updateUserStatus = async (userId: string, status: string): Promise<boolean> => {
  try {
    const user = await getUserById(userId)
    if (!user) {
      return false
    }

    user.status = status
    return await saveUser(user)
  } catch (error) {
    console.error('Failed to update user status:', error)
    return false
  }
}

// Обновление пользовательских настроек
export const updateUserSettings = async (userId: string, settings: Partial<UserSettings>): Promise<boolean> => {
  try {
    // Сначала получаем текущего пользователя напрямую из хранилища для надежности
    let user: User | null = null;
    const key = `${USER_KEY_PREFIX}${userId}`;
    const userData = storageAPI.getItem(key);

    if (userData) {
      user = JSON.parse(userData);
    } else {
      // Если нет в хранилище, пробуем получить через db
      user = await getUserById(userId);
    }

    if (!user) {
      console.error('User not found for settings update');
      return false;
    }

    // Объединяем текущие настройки с новыми
    user.settings = {
      ...(user.settings || {}),
      ...settings
    };

    // Сохраняем напрямую в хранилище для надежности
    storageAPI.setItem(key, JSON.stringify(user));

    // И также через абстракцию db
    return await saveUser(user);
  } catch (error) {
    console.error('Failed to update user settings:', error);
    return false;
  }
}

// Функция для создания тестового пользователя (для отладки)
export const createTestUser = (name: string = "Тест"): User | null => {
  try {
    const id = `test_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newUser: User = {
      id,
      name,
      interests: ['Тестирование', 'Отладка'],
      isAnonymous: true,
      rating: 5,
      createdAt: Date.now(),
      lastActive: Date.now(),
      currentUser: {},
      existingUserByTelegramId: {},
      verified: false
    };

    // Сохраняем пользователя
    const usersData = storageAPI.getItem('users');
    const users = usersData ? JSON.parse(usersData) : [];
    users.push(newUser);
    storageAPI.setItem('users', JSON.stringify(users));

    console.log(`Создан тестовый пользователь: ${name} (${id})`);
    return newUser;
  } catch (error) {
    console.error('Ошибка при создании тестового пользователя:', error);
    return null;
  }
}
