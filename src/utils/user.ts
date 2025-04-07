import { firebaseService } from '../firebase/service';

// Интерфейс для API телеграма
export interface TelegramApiInterface {
  initialize: () => Promise<boolean>;
  getUserId: () => string | null;
  getUserData?: () => any;
  isReady: () => boolean;
}

// Реализация API для телеграма
export const telegramApi: TelegramApiInterface = {
  initialize: async () => true,
  getUserId: () => null,
  getUserData: () => ({}),
  isReady: () => false
};

// Определение типа для стратегии подбора
export type MatchingStrategy = 'similar' | 'diverse' | 'random';

// Тип для данных Telegram
export interface TelegramData {
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  languageCode?: string;
}

// Тип для настроек приватности
export interface PrivacySettings {
  privacyLevel?: 'high' | 'medium' | 'low';
  showOnlineStatus?: boolean;
  showLastSeen?: boolean;
  allowProfileSearch?: boolean;
}

// Тип для настроек уведомлений
export interface NotificationSettings {
  newMessages?: boolean;
  chatRequests?: boolean;
  systemUpdates?: boolean;
  sounds?: boolean;
}

// Тип для пользовательских настроек
export interface UserSettings {
  // Настройки приватности
  privacyLevel?: 'high' | 'medium' | 'low';
  showOnlineStatus?: boolean;
  showLastSeen?: boolean;
  allowProfileSearch?: boolean;

  // Настройки подбора собеседников
  matchingPreference?: MatchingStrategy;

  // Настройки уведомлений
  notifications?: NotificationSettings;

  // Настройки внешнего вида
  theme?: 'light' | 'dark' | 'system';
}

// Тип для пользователя
export interface User {
  id: string;
  name?: string;
  bio?: string;
  avatar?: string | null;
  rating?: number;
  chatCount?: number;
  friends?: string[];
  interests?: string[];
  age?: number;
  city?: string;
  isAnonymous: boolean;
  createdAt: number;
  lastActive: number;
  isAdmin?: boolean;
  isBlocked?: boolean;
  telegramData?: TelegramData;

  // Поля для предпочтений пользователя
  settings?: UserSettings; // Пользовательские настройки
  status?: string; // Статус пользователя ("В сети", "Недавно был", и т.д.)
  languages?: string[]; // Языки, которыми владеет пользователь
  region?: string; // Регион/страна пользователя
  favorites?: string[]; // Список ID избранных пользователей
}

// Ключ для localStorage
const USER_KEY_PREFIX = 'user_';
const CURRENT_USER_KEY = 'current_user_id';
const ADMINS_KEY = 'admin_users';

// Инициализация интеграции с Telegram при загрузке модуля
telegramApi.initialize().then(success => {
  if (success) {
    console.log('Telegram API initialized successfully');

    // Если пользователь авторизован через Telegram, проверяем и создаем профиль
    const telegramId = telegramApi.getUserId();
    if (telegramId) {
      getUserByTelegramId(telegramId).then(existingUser => {
        if (!existingUser) {
          // Создаем нового пользователя из данных Telegram
          createUserFromTelegram(telegramId)
            .then(user => console.log('Created new user from Telegram data'))
            .catch(err => console.error('Failed to create user from Telegram data:', err));
        } else {
          // Обновляем текущего пользователя и его lastActive
          setCurrentUser(existingUser.id);
          existingUser.lastActive = Date.now();
          saveUser(existingUser)
            .then(() => console.log('Updated existing user session'))
            .catch(err => console.error('Failed to update user session:', err));
        }
      }).catch(err => console.error('Error checking existing user:', err));
    }
  } else {
    // Проверяем, был ли пользователь уже авторизован
    getCurrentUserId().then(currentUserId => {
      if (currentUserId) {
        console.log('Using existing user session');
      } else {
        console.warn('Telegram API initialization failed, using local mode');
      }
    }).catch(err => console.error('Error checking current user ID:', err));
  }
});

// Получение списка всех пользователей - адаптировано для Firebase
export const getUsers = async (): Promise<User[]> => {
  try {
    const users = await firebaseService.getAll('users');
    if (users && users.length > 0) {
      return users;
    }

    // Резервный вариант - попытка получить из localStorage
    const usersData = localStorage.getItem('users');
    if (!usersData) {
      return [];
    }
    return JSON.parse(usersData);
  } catch (error) {
    console.error('Error getting users:', error);
    return []; // Возвращаем пустой массив вместо ошибки
  }
};

// Получение пользователя по ID - адаптировано для Firebase
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    if (!userId) return null;
    const userKey = `user_${userId}`;
    const userData = localStorage.getItem(userKey);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error(`Error getting user ${userId}:`, error);
    return null;
  }
};

// Упрощенная синхронная функция получения пользователя
export const getUserByIdSync = (userId: string): User | null => {
  try {
    if (!userId) return null;
    const userKey = `user_${userId}`;
    const userData = localStorage.getItem(userKey);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error(`Error getting user ${userId}:`, error);
    return null;
  }
};

// Получение пользователя по Telegram ID - адаптировано для Firebase
export const getUserByTelegramId = async (telegramId: string): Promise<User | null> => {
  try {
    // Ищем пользователя по полю telegramData.telegramId
    const users = await firebaseService.findByField('users', 'telegramData.telegramId', telegramId);
    if (users && users.length > 0) {
      return users[0];
    }

    // Резервный вариант - поиск в localStorage
    const localUsers = getUsers();
    const user = (await localUsers).find(user => user.telegramData?.telegramId === telegramId);
    return user || null;
  } catch (error) {
    console.error(`Failed to get user by Telegram ID ${telegramId}`, error);
    return null;
  }
};

// Сохранение пользователя - адаптировано для Firebase
export const saveUser = async (user: User): Promise<boolean> => {
  try {
    // Обновляем время последней активности
    user.lastActive = Date.now();

    // Сохраняем в Firebase
    await firebaseService.setItem('users', user.id, user);

    const key = `${USER_KEY_PREFIX}${user.id}`;
    // Сохраняем также в localStorage для совместимости
    localStorage.setItem(key, JSON.stringify(user));

    // Если это текущий пользователь, обновляем ссылку на него
    const currentUserId = await getCurrentUserId();
    if (currentUserId === user.id || !currentUserId) {
      await setCurrentUser(user.id);
    }

    return true;
  } catch (error) {
    console.error('Failed to save user', error);
    return false;
  }
};

// Установка текущего пользователя - адаптировано для Firebase
export const setCurrentUser = async (userId: string): Promise<void> => {
  try {
    await firebaseService.setItem('app_settings', 'current_user', { userId });
    localStorage.setItem(CURRENT_USER_KEY, userId);
  } catch (error) {
    console.error('Failed to set current user', error);
  }
};

// Получение ID текущего пользователя - адаптировано для Firebase
export const getCurrentUserId = async (): Promise<string | null> => {
  try {
    const currentUserData = await firebaseService.getItem('app_settings', 'current_user');
    if (currentUserData && currentUserData.userId) {
      return currentUserData.userId;
    }

    // Резервный вариант - localStorage
    return localStorage.getItem(CURRENT_USER_KEY);
  } catch (error) {
    console.error('Failed to get current user ID', error);
    return null;
  }
};

// Синхронная версия получения текущего пользователя
export const getCurrentUserSync = (): User | null => {
  try {
    const userIdData = localStorage.getItem('current_user_id');
    if (!userIdData) return null;

    const userId = userIdData;
    const userKey = `user_${userId}`;
    const userData = localStorage.getItem(userKey);

    if (!userData) return null;
    return JSON.parse(userData);
  } catch (error) {
    console.error('Error getting current user synchronously:', error);
    return null;
  }
};

// Сделаем getCurrentUser асинхронной функцией
export const getCurrentUser = async (userId?: string): Promise<User | null> => {
  try {
    // Если передан userId, используем его для получения пользователя
    if (userId) {
      return getUserByIdSync(userId);
    }

    // Иначе получаем текущего пользователя
    const userIdData = localStorage.getItem('current_user_id');
    if (!userIdData) return null;

    const userKey = `user_${userIdData}`;
    const userData = localStorage.getItem(userKey);

    if (!userData) return null;
    return JSON.parse(userData);
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Более надежная функция получения текущего пользователя
export const getCurrentUserAsync = async (): Promise<User | null> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.log('No current user ID found');
      return null;
    }

    return await getUserById(userId);
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
};

// Создание пользователя из данных Telegram
export const createUserFromTelegram = async (telegramId: string, customName?: string): Promise<User | null> => {
  try {
    // Инициализируем API если еще не сделано
    if (!telegramApi.isReady()) {
      await telegramApi.initialize();
    }

    // Получаем данные пользователя
    const telegramData = telegramApi.getUserData();
    const userId = `user_${Date.now()}`;

    // Формируем имя из данных Telegram или используем переданное имя
    const name = customName || (telegramData.firstName || 'Пользователь');

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
    };

    // Сохраняем нового пользователя
    const saved = await saveUser(newUser);

    if (saved) {
      // Устанавливаем как текущего пользователя
      setCurrentUser(userId);
      return newUser;
    }

    return null;
  } catch (error) {
    console.error('Failed to create user from Telegram', error);
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
};

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
      addAdmin(telegramId);

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
      addAdmin(telegramId);

      return adminUser;
    }
  } catch (error) {
    console.error('Failed to create admin user', error);
    return null;
  }
};

// Добавление Telegram ID в список администраторов
export const addAdmin = (telegramId: string): void => {
  try {
    const admins = getAdmins();

    if (!admins.includes(telegramId)) {
      admins.push(telegramId);
      localStorage.setItem(ADMINS_KEY, JSON.stringify(admins));
    }
  } catch (error) {
    console.error('Failed to add admin', error);
  }
};

// Получение списка Telegram ID администраторов
export const getAdmins = (): string[] => {
  try {
    const admins = localStorage.getItem(ADMINS_KEY);
    return admins ? JSON.parse(admins) : [];
  } catch (error) {
    console.error('Failed to get admins list', error);
    return [];
  }
};

// Установка статуса администратора по Telegram ID
export const setAdminByTelegramId = async (telegramId: string): Promise<boolean> => {
  try {
    const user = await getUserByTelegramId(telegramId);

    if (user) {
      user.isAdmin = true;
      await saveUser(user);

      // Добавляем в список администраторов
      addAdmin(telegramId);

      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to set admin by Telegram ID', error);
    return false;
  }
};

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
};

// Блокировка пользователя
export const blockUser = (userId: string): boolean => {
  try {
    const key = `${USER_KEY_PREFIX}${userId}`;
    const userData = localStorage.getItem(key);

    if (userData) {
      const user: User = JSON.parse(userData);
      user.isBlocked = true;
      localStorage.setItem(key, JSON.stringify(user));
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to block user', error);
    return false;
  }
};

// Разблокировка пользователя
export const unblockUser = (userId: string): boolean => {
  try {
    const key = `${USER_KEY_PREFIX}${userId}`;
    const userData = localStorage.getItem(key);

    if (userData) {
      const user: User = JSON.parse(userData);
      user.isBlocked = false;
      localStorage.setItem(key, JSON.stringify(user));
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to unblock user', error);
    return false;
  }
};

// Очистка всей базы данных - адаптировано для Firebase
export const clearDatabase = async (): Promise<boolean> => {
  try {
    // Удаляем данные из Firebase
    const collections = ['users', 'chats', 'searching_users', 'app_settings'];
    for (const collectionName of collections) {
      const items = await firebaseService.getAll(collectionName);
      for (const item of items) {
        if (item.id) {
          await firebaseService.removeItem(collectionName, item.id);
        }
      }
    }

    // Также очищаем localStorage для совместимости
    localStorage.clear();

    return true;
  } catch (error) {
    console.error('Failed to clear database', error);
    return false;
  }
};

// Обновление рейтинга пользователя
export const updateUserRating = async (userId: string, newRating: number): Promise<boolean> => {
  try {
    // Получаем текущего пользователя
    const user = await getUserById(userId);
    if (!user) {
      return false;
    }

    // Обновляем рейтинг
    user.rating = newRating;

    // Сохраняем пользователя
    return await saveUser(user);
  } catch (error) {
    console.error('Failed to update user rating:', error);
    return false;
  }
};

// Обновление статуса пользователя
export const updateUserStatus = async (userId: string, status: string): Promise<boolean> => {
  try {
    const user = await getUserById(userId);
    if (!user) {
      return false;
    }

    user.status = status;
    return await saveUser(user);
  } catch (error) {
    console.error('Failed to update user status:', error);
    return false;
  }
};

// Обновление пользовательских настроек
export const updateUserSettings = async (userId: string, settings: Partial<UserSettings>): Promise<boolean> => {
  try {
    // Сначала получаем текущего пользователя напрямую из localStorage для надежности
    let user: User | null = null;
    const key = `${USER_KEY_PREFIX}${userId}`;
    const userData = localStorage.getItem(key);

    if (userData) {
      user = JSON.parse(userData);
    } else {
      // Если нет в localStorage, пробуем получить через db
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

    // Сохраняем напрямую в localStorage для надежности
    localStorage.setItem(key, JSON.stringify(user));

    // И также через абстракцию db
    return await saveUser(user);
  } catch (error) {
    console.error('Failed to update user settings:', error);
    return false;
  }
};

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
};

// Добавляем typeGuard для проверки User
export const isUser = (obj: any): obj is User => {
  return obj && typeof obj === 'object' && 'id' in obj;
};
