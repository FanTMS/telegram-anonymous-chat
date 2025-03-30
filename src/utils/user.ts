import { db, telegramApi } from './database'
import { MatchingStrategy } from './recommendations'
import { getItem, setItem, getAllItems, removeItem } from './dbService';

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
telegramApi.initialize().then(async success => {
  if (success) {
    console.log('Telegram API initialized successfully');

    // Если пользователь авторизован через Telegram, проверяем и создаем профиль
    const telegramId = telegramApi.getUserId();
    if (telegramId) {
      try {
        const existingUser = await getUserByTelegramId(telegramId);

        if (!existingUser) {
          // Создаем нового пользователя из данных Telegram
          await createUserFromTelegram(telegramId);
          console.log('Created new user from Telegram data');
        } else {
          // Обновляем текущего пользователя и его lastActive
          await setCurrentUser(existingUser.id);
          existingUser.lastActive = Date.now();
          await saveUser(existingUser);
          console.log('Updated existing user session');
        }
      } catch (err) {
        console.error('Error in Telegram initialization:', err);
      }
    }
  } else {
    // Проверяем, был ли пользователь уже авторизован
    try {
      const currentUserId = await getCurrentUserId();
      if (currentUserId) {
        console.log('Using existing user session');
      } else {
        console.warn('Telegram API initialization failed, using local mode');
      }
    } catch (err) {
      console.error('Error checking current user:', err);
    }
  }
});

// Получение списка всех пользователей
export const getUsers = async (): Promise<User[]> => {
  try {
    const users = await getAllItems('users', {});
    return users || [];
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
}

// Получение пользователя по ID - улучшенная версия с дополнительными проверками
export const getUserById = async (id: string): Promise<User | null> => {
  try {
    console.log(`Поиск пользователя с ID ${id}`);
    if (!id) {
      console.error('getUserById получил пустой ID');
      return null;
    }

    const user = await getItem(`user_${id}`);
    if (!user) {
      console.log(`Пользователь с ID ${id} не найден`);
      return null;
    }

    console.log(`Пользователь найден: ${user.name} (${user.id})`);
    return user;
  } catch (error) {
    console.error(`Ошибка при получении пользователя по ID (${id}):`, error);
    return null;
  }
}

// Упрощенная синхронная функция получения пользователя
export const getUserByIdSync = async (userId: string): Promise<User | null> => {
  if (!userId) return null;

  try {
    const user = await getItem(`user_${userId}`);
    if (!user) {
      return {
        id: userId,
        name: 'Собеседник',
        isAnonymous: true,
        createdAt: Date.now(),
        lastActive: Date.now()
      };
    }

    return user;
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
export const getUserByTelegramId = async (telegramId: string): Promise<User | null> => {
  try {
    const users = await getUsers();
    return users.find(user => user.telegramData?.telegramId === telegramId) || null;
  } catch (error) {
    console.error(`Failed to get user by Telegram ID ${telegramId}`, error);
    return null;
  }
}

// Сохранение пользователя - исправленная версия с поддержкой Promise
export const saveUser = async (user: User): Promise<boolean> => {
  try {
    // Обновляем время последней активности
    user.lastActive = Date.now();

    const key = `${USER_KEY_PREFIX}${user.id}`;

    // Сохраняем пользователя в MongoDB
    await setItem(key, user);

    // Если используется db, также сохраняем там для обратной совместимости
    try {
      // Сохраняем пользователя в localStorage напрямую для надежности
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(user));
      }

      const result = await db.saveData(key, user);

      // Если это текущий пользователь, обновляем ссылку на него
      const currentUserId = await getCurrentUserId();
      if (currentUserId === user.id || !currentUserId) {
        await setCurrentUser(user.id);
      }

      return !!result;
    } catch (e) {
      console.warn('Failed to save user to legacy storage', e);
      return true; // Считаем успешным, так как в MongoDB сохранили
    }
  } catch (error) {
    console.error('Failed to save user', error);
    return false;
  }
}

// Установка текущего пользователя
export const setCurrentUser = async (userId: string): Promise<void> => {
  try {
    await setItem(CURRENT_USER_KEY, userId);
  } catch (error) {
    console.error('Failed to set current user', error);
  }
}

// Получение ID текущего пользователя
export const getCurrentUserId = async (): Promise<string | null> => {
  try {
    return await getItem(CURRENT_USER_KEY);
  } catch (error) {
    console.error('Failed to get current user ID', error);
    return null;
  }
}

// Более надежная функция получения текущего пользователя
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const userId = await getItem(CURRENT_USER_KEY);
    if (!userId) {
      return null;
    }

    const user = await getItem(`user_${userId}`);
    return user;
  } catch (error) {
    console.error('Failed to get current user', error);
    return null;
  }
}

// Создание пользователя из данных Telegram
export const createUserFromTelegram = async (telegramId: string, customName?: string): Promise<User | null> => {
  try {
    // Инициализируем API если еще не сделано
    if (!telegramApi.isReady()) {
      await telegramApi.initialize()
    }

    // Получаем данные пользователя
    const telegramData = telegramApi.getUserData()
    const userId = `user_${Date.now()}`

    // Формируем имя из данных Telegram или используем переданное имя
    const name = customName || (telegramData.firstName || 'Пользователь')

    const newUser: User = {
      id: userId,
      name,
      rating: 5.0,
      interests: [],
      isAnonymous: false,
      createdAt: Date.now(),
      lastActive: Date.now(),
      telegramData: {
        telegramId,
        username: telegramData.username,
        firstName: telegramData.firstName,
        lastName: telegramData.lastName,
        languageCode: telegramData.languageCode
      },
      // Добавляем базовые настройки
      settings: {
        privacyLevel: 'medium',
        showOnlineStatus: true,
        showLastSeen: false,
        allowProfileSearch: true,
        matchingPreference: 'similar',
        notifications: {
          newMessages: true,
          chatRequests: true,
          systemUpdates: true,
          sounds: true
        },
        theme: 'system'
      }
    }

    // Сохраняем нового пользователя
    const saved = await saveUser(newUser)

    if (saved) {
      // Устанавливаем как текущего пользователя
      setCurrentUser(userId)
      return newUser
    }

    return null
  } catch (error) {
    console.error('Failed to create user from Telegram', error)
    return null
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
export const createAdminUserFromTelegram = async (telegramId: string, adminName: string): Promise<User | null> => {
  try {
    // Проверяем, существует ли пользователь
    const existingUser = await getUserByTelegramId(telegramId);

    if (existingUser) {
      // Если пользователь существует, делаем его администратором
      existingUser.isAdmin = true;
      await saveUser(existingUser);

      // Добавляем в список администраторов
      await addAdmin(telegramId);

      return existingUser;
    } else {
      // Создаем нового пользователя-администратора
      const userId = `user_${Date.now()}`;
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
      };

      await saveUser(adminUser);

      // Добавляем в список администраторов
      await addAdmin(telegramId);

      return adminUser;
    }
  } catch (error) {
    console.error('Failed to create admin user', error);
    return null;
  }
}

// Добавление Telegram ID в список администраторов
export const addAdmin = async (telegramId: string): Promise<void> => {
  try {
    const admins = await getAdmins();

    if (!admins.includes(telegramId)) {
      admins.push(telegramId);
      await setItem(ADMINS_KEY, admins);
    }
  } catch (error) {
    console.error('Failed to add admin', error);
  }
}

// Получение списка Telegram ID администраторов
export const getAdmins = async (): Promise<string[]> => {
  try {
    const admins = await getItem(ADMINS_KEY);
    return admins || [];
  } catch (error) {
    console.error('Failed to get admins list', error);
    return [];
  }
}

// Установка статуса администратора по Telegram ID
export const setAdminByTelegramId = async (telegramId: string): Promise<boolean> => {
  try {
    const user = await getUserByTelegramId(telegramId);

    if (user) {
      user.isAdmin = true;
      await saveUser(user);

      // Добавляем в список администраторов
      await addAdmin(telegramId);

      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to set admin by Telegram ID', error);
    return false;
  }
}

// Модифицируем функцию для проверки админских прав с учетом локальной разработки
export const isAdmin = async (): Promise<boolean> => {
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
    const currentUser = await getCurrentUser();

    if (currentUser && currentUser.isAdmin) {
      return true;
    }

    // Проверяем через Telegram ID, если есть
    if (currentUser && currentUser.telegramData && currentUser.telegramData.telegramId) {
      const admins = await getAdmins();
      return admins.includes(currentUser.telegramData.telegramId);
    }

    return false;
  } catch (error) {
    console.error('Failed to check admin status', error);
    return false;
  }
}

// Блокировка пользователя
export const blockUser = async (userId: string): Promise<boolean> => {
  try {
    const user = await getItem(`user_${userId}`);

    if (user) {
      user.isBlocked = true;
      await setItem(`user_${userId}`, user);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to block user', error);
    return false;
  }
}

// Разблокировка пользователя
export const unblockUser = async (userId: string): Promise<boolean> => {
  try {
    const user = await getItem(`user_${userId}`);

    if (user) {
      user.isBlocked = false;
      await setItem(`user_${userId}`, user);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to unblock user', error);
    return false;
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
export const updateUserSettings = async (userId: string, settings: any): Promise<boolean> => {
  try {
    const user = await getItem(`user_${userId}`);
    if (!user) {
      return false;
    }

    // Объединяем текущие настройки с новыми
    user.settings = {
      ...(user.settings || {}),
      ...settings
    };

    return await setItem(`user_${userId}`, user);
  } catch (error) {
    console.error('Failed to update user settings:', error);
    return false;
  }
}

// Функция для создания тестового пользователя (для отладки)
export const createTestUser = async (name: string = "Тест"): Promise<User | null> => {
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
    const users = await getAllItems('users') || [];
    users.push(newUser);
    await setItem('users', users);

    // Сохраняем отдельно для быстрого доступа
    await setItem(`user_${id}`, newUser);

    return newUser;
  } catch (error) {
    console.error('Error creating test user:', error);
    return null;
  }
}
