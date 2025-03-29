import { db, telegramApi } from './database'
import { MatchingStrategy } from './recommendations'

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
        createUserFromTelegram(telegramId)
          .then(user => console.log('Created new user from Telegram data'))
          .catch(err => console.error('Failed to create user from Telegram data:', err))
      } else {
        // Обновляем текущего пользователя и его lastActive
        setCurrentUser(existingUser.id)
        existingUser.lastActive = Date.now()
        saveUser(existingUser)
          .then(() => console.log('Updated existing user session'))
          .catch(err => console.error('Failed to update user session:', err))
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
export const getUserById = (id: string): User | null => {
  try {
    console.log(`Поиск пользователя с ID ${id}`);
    if (!id) {
      console.error('getUserById получил пустой ID');
      return null;
    }

    const usersData = localStorage.getItem('users');
    if (!usersData) {
      console.log('Список пользователей пуст');
      return null;
    }

    let users: User[];
    try {
      users = JSON.parse(usersData);

      if (!Array.isArray(users)) {
        console.error('Данные пользователей повреждены (не массив)');
        return null;
      }
    } catch (e) {
      console.error('Ошибка при парсинге данных пользователей', e);
      return null;
    }

    // Ищем пользователя по ID
    const user = users.find(u => u && u.id === id);

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
export const saveUser = async (user: User): Promise<boolean> => {
  try {
    // Обновляем время последней активности
    user.lastActive = Date.now()

    const key = `${USER_KEY_PREFIX}${user.id}`
    // Сохраняем пользователя в localStorage напрямую для надежности
    localStorage.setItem(key, JSON.stringify(user))

    // Если используется db, также сохраняем там
    const result = await db.saveData(key, user)

    // Если это текущий пользователь, обновляем ссылку на него
    const currentUserId = getCurrentUserId()
    if (currentUserId === user.id || !currentUserId) {
      setCurrentUser(user.id)
    }

    return result
  } catch (error) {
    console.error('Failed to save user', error)
    return false
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
    const userId = localStorage.getItem(CURRENT_USER_KEY);
    if (!userId) {
      console.log('No current user ID found');
      return null;
    }

    const key = `${USER_KEY_PREFIX}${userId}`;
    const userData = localStorage.getItem(key);
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
