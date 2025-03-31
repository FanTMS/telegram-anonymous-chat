import { db, telegramApi } from './database'
import { MatchingStrategy } from './recommendations'
import { userStorage } from './userStorage';
import WebApp from '@twa-dev/sdk';

// Тип для данных Telegram
export interface TelegramData {
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

// Ключ для localStorage
const USER_KEY_PREFIX = 'user_'
const CURRENT_USER_KEY = 'current_user_id'
const ADMINS_KEY = 'admin_users'

// Инициализация интеграции с Telegram при загрузке модуля
telegramApi.initialize().then(success => {
  if (success) {
    console.log('Telegram API initialized successfully')

    // Если пользователь авторизован через Telegram, проверяем и создаем профиль
    const telegramId = telegramApi.getUserId()
    if (telegramId) {
      const existingUser = getUserByTelegramId(telegramId)

      if (!existingUser) {
        // Создаем нового пользователя из данных Telegram
        createUserFromTelegram()
      } else {
        // Обновляем текущего пользователя и его lastActive
        setCurrentUser(existingUser.id)
        existingUser.lastActive = Date.now()
        saveUser(existingUser)
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

// Получение списка всех пользователей
export const getUsers = (): User[] => {
  try {
    const usersData = localStorage.getItem('users')
    if (!usersData) {
      return []
    }
    return JSON.parse(usersData)
  } catch (error) {
    console.error('Error getting users:', error)
    return [] // Возвращаем пустой массив вместо ошибки
  }
}

// Получение пользователя по ID - улучшенная версия с дополнительными проверками
export const getUserById = (userId: string): User | null => {
  try {
    if (!userId) return null;

    // Проверяем, не является ли запрашиваемый пользователь текущим
    const currentUser = userStorage.getItem<User>('currentUser', null);
    if (currentUser && currentUser.id === userId) {
      return currentUser;
    }

    // Иначе ищем среди всех пользователей
    const users = userStorage.getItem<User[]>('users', []);
    return users.find(user => user.id === userId) || null;
  } catch (error) {
    console.error(`Ошибка при получении пользователя ${userId}:`, error);
    return null;
  }
}

// Упрощенная синхронная функция получения пользователя
export const getUserByIdSync = (userId: string): User | null => {
  if (!userId) return null;

  try {
    const key = `${USER_KEY_PREFIX}${userId}`;
    const userData = localStorage.getItem(key);

    if (!userData) {
      return {
        id: userId,
        name: 'Собеседник',
        isAnonymous: true,
        createdAt: Date.now(),
        lastActive: Date.now()
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
      lastActive: Date.now()
    };
  }
}

// Получение пользователя по Telegram ID
export const getUserByTelegramId = (telegramId: string): User | null => {
  try {
    const users = getUsers()
    return users.find(user => user.telegramData?.telegramId === telegramId) || null
  } catch (error) {
    console.error(`Failed to get user by Telegram ID ${telegramId}`, error)
    return null
  }
}

// Сохранение пользователя
export const saveUser = (user: User): boolean => {
  try {
    if (!user) return false;

    // Сохраняем в изолированное хранилище
    userStorage.setItem('currentUser', user);

    // Также сохраняем в список пользователей, если есть
    const users = userStorage.getItem<User[]>('users', []);
    const userIndex = users.findIndex(u => u.id === user.id);

    if (userIndex === -1) {
      // Добавляем нового пользователя
      users.push(user);
    } else {
      // Обновляем существующего
      users[userIndex] = user;
    }

    userStorage.setItem('users', users);
    return true;
  } catch (error) {
    console.error('Ошибка при сохранении пользователя:', error);
    return false;
  }
}

// Установка текущего пользователя
export const setCurrentUser = (userId: string): void => {
  try {
    localStorage.setItem(CURRENT_USER_KEY, userId)
  } catch (error) {
    console.error('Failed to set current user', error)
  }
}

// Получение ID текущего пользователя
export const getCurrentUserId = (): string | null => {
  try {
    return localStorage.getItem(CURRENT_USER_KEY)
  } catch (error) {
    console.error('Failed to get current user ID', error)
    return null
  }
}

// Более надежная функция получения текущего пользователя
export const getCurrentUser = (): User | null => {
  try {
    // Проверяем, инициализировано ли хранилище
    if (!userStorage.isInitialized()) {
      // Пытаемся инициализировать из Telegram WebApp
      if (WebApp && WebApp.initDataUnsafe && WebApp.initDataUnsafe.user) {
        const telegramId = WebApp.initDataUnsafe.user.id;
        userStorage.initialize(telegramId);
        console.log(`Автоматическая инициализация хранилища для пользователя ${telegramId}`);
      } else {
        // Для локальной разработки
        const devUserId = localStorage.getItem('dev_user_id');
        if (devUserId) {
          userStorage.initialize(devUserId);
          console.log(`Автоматическая инициализация хранилища для разработки с ID ${devUserId}`);
        } else {
          console.warn('Невозможно инициализировать хранилище: нет ID пользователя');
          return null;
        }
      }
    }

    // Используем изолированное хранилище
    return userStorage.getItem<User>('currentUser', null);
  } catch (error) {
    console.error('Ошибка при получении текущего пользователя:', error);
    return null;
  }
}

// Создание пользователя из данных Telegram
export const createUserFromTelegram = (): User | null => {
  try {
    // Проверяем доступность Telegram WebApp
    if (!WebApp || !WebApp.initDataUnsafe || !WebApp.initDataUnsafe.user) {
      console.error('Данные пользователя Telegram недоступны');
      return null;
    }

    const tgUser = WebApp.initDataUnsafe.user;

    const newUser: User = {
      id: tgUser.id.toString(),
      name: tgUser.first_name,
      telegramData: {
        telegramId: tgUser.id.toString(),
        username: tgUser.username || '',
      },
      createdAt: Date.now(),
      lastActive: Date.now(),
      interests: [],
      isAnonymous: false,
      rating: 5
    };

    // Сохраняем пользователя в изолированное хранилище
    userStorage.setItem('currentUser', newUser);

    // Инициализируем хранилище с ID пользователя если ещё не инициализировано
    if (!userStorage.isInitialized()) {
      userStorage.initialize(tgUser.id);
    }

    return newUser;
  } catch (error) {
    console.error('Ошибка при создании пользователя из данных Telegram:', error);
    return null;
  }
}

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
export const createAdminUserFromTelegram = (telegramId: string, adminName: string): User | null => {
  try {
    // Проверяем, существует ли пользователь
    const existingUser = getUserByTelegramId(telegramId)

    if (existingUser) {
      // Если пользователь существует, делаем его администратором
      existingUser.isAdmin = true
      saveUser(existingUser)

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
        isAdmin: true,
        telegramData: {
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

      saveUser(adminUser)

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
      localStorage.setItem(ADMINS_KEY, JSON.stringify(admins))
    }
  } catch (error) {
    console.error('Failed to add admin', error)
  }
}

// Получение списка Telegram ID администраторов
export const getAdmins = (): string[] => {
  try {
    const admins = localStorage.getItem(ADMINS_KEY)
    return admins ? JSON.parse(admins) : []
  } catch (error) {
    console.error('Failed to get admins list', error)
    return []
  }
}

// Установка статуса администратора по Telegram ID
export const setAdminByTelegramId = (telegramId: string): boolean => {
  try {
    const user = getUserByTelegramId(telegramId)

    if (user) {
      user.isAdmin = true
      saveUser(user)

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

    // Стандартная проверка для не-локальных запусков
    const currentUser = getCurrentUser();

    if (currentUser?.isAdmin) {
      return true;
    }

    // Проверяем через Telegram ID, если есть
    if (currentUser?.telegramData?.telegramId) {
      const admins = getAdmins();
      return admins.includes(currentUser.telegramData.telegramId);
    }

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
    const userData = localStorage.getItem(key)

    if (userData) {
      const user: User = JSON.parse(userData)
      user.isBlocked = true
      localStorage.setItem(key, JSON.stringify(user))
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
    const userData = localStorage.getItem(key)

    if (userData) {
      const user: User = JSON.parse(userData)
      user.isBlocked = false
      localStorage.setItem(key, JSON.stringify(user))
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
export const updateUserRating = (userId: string, newRating: number): boolean => {
  try {
    // Получаем текущего пользователя
    const user = getUserById(userId)
    if (!user) {
      return false
    }

    // Обновляем рейтинг
    user.rating = newRating

    // Сохраняем пользователя
    return saveUser(user)
  } catch (error) {
    console.error('Failed to update user rating:', error)
    return false
  }
}

// Обновление статуса пользователя
export const updateUserStatus = (userId: string, status: string): boolean => {
  try {
    const user = getUserById(userId)
    if (!user) {
      return false
    }

    user.status = status
    return saveUser(user)
  } catch (error) {
    console.error('Failed to update user status:', error)
    return false
  }
}

// Обновление пользовательских настроек
export const updateUserSettings = (userId: string, settings: Partial<UserSettings>): boolean => {
  try {
    // Сначала получаем текущего пользователя напрямую из localStorage для надежности
    let user: User | null = null;
    const key = `${USER_KEY_PREFIX}${userId}`;
    const userData = localStorage.getItem(key);

    if (userData) {
      user = JSON.parse(userData);
    } else {
      // Если нет в localStorage, пробуем получить через db
      user = getUserById(userId);
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

    // Сохраняем напрямую в localStorage для надежности
    localStorage.setItem(key, JSON.stringify(user));

    // И также через абстракцию db
    return saveUser(user);
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
      lastActive: Date.now()
    };

    // Сохраняем пользователя
    const usersData = localStorage.getItem('users');
    const users = usersData ? JSON.parse(usersData) : [];
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    console.log(`Создан тестовый пользователь: ${name} (${id})`);
    return newUser;
  } catch (error) {
    console.error('Ошибка при создании тестового пользователя:', error);
    return null;
  }
}
