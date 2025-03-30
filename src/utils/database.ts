import WebApp from '@twa-dev/sdk'

// Перечисление типов хранилищ данных
export enum StorageType {
  LOCAL_STORAGE = 'local_storage',
  INDEXED_DB = 'indexed_db',
  REMOTE_API = 'remote_api'
}

// Настройки базы данных
interface DatabaseConfig {
  storageType: StorageType
  apiBaseUrl?: string
  apiKey?: string
  useCompression?: boolean
  syncInterval?: number // в миллисекундах
  maxRetries?: number
}

// Класс для работы с данными пользователей
export class UserDatabase {
  private config: DatabaseConfig
  private syncTimer: ReturnType<typeof setInterval> | null = null
  private isSyncing = false
  private pendingChanges = new Set<string>()

  constructor(config: DatabaseConfig) {
    this.config = {
      ...config,
      useCompression: config.useCompression ?? false,
      syncInterval: config.syncInterval ?? 60000, // по умолчанию раз в минуту
      maxRetries: config.maxRetries ?? 3
    }

    // Если используем remote API, запускаем периодическую синхронизацию
    if (this.config.storageType === StorageType.REMOTE_API && this.config.syncInterval) {
      this.startSync()
    }
  }

  // Запуск периодической синхронизации с сервером
  private startSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
    }

    this.syncTimer = setInterval(() => {
      this.syncWithRemote()
    }, this.config.syncInterval)
  }

  // Синхронизация данных с удаленным сервером
  private async syncWithRemote(): Promise<void> {
    if (this.isSyncing || this.pendingChanges.size === 0) return

    this.isSyncing = true

    try {
      // Здесь будет код для синхронизации с API
      console.log('Syncing with remote:', Array.from(this.pendingChanges))

      // Очищаем список изменений после успешной синхронизации
      this.pendingChanges.clear()
    } catch (error) {
      console.error('Failed to sync with remote:', error)
    } finally {
      this.isSyncing = false
    }
  }

  // Сохранение данных
  async saveData<T>(key: string, data: T): Promise<boolean> {
    try {
      const serializedData = JSON.stringify(data)

      switch (this.config.storageType) {
        case StorageType.LOCAL_STORAGE:
          localStorage.setItem(key, serializedData)
          break

        case StorageType.INDEXED_DB:
          // Здесь будет реализация для IndexedDB
          console.warn('IndexedDB storage not fully implemented yet')
          localStorage.setItem(key, serializedData)
          break

        case StorageType.REMOTE_API:
          // Сохраняем локально
          localStorage.setItem(key, serializedData)
          // Отмечаем для последующей синхронизации
          this.pendingChanges.add(key)
          break
      }

      return true
    } catch (error) {
      console.error(`Error saving data for key ${key}:`, error)
      return false
    }
  }

  // Получение данных
  async getData<T>(key: string, defaultValue?: T): Promise<T | null> {
    try {
      let serializedData: string | null = null

      switch (this.config.storageType) {
        case StorageType.LOCAL_STORAGE:
        case StorageType.INDEXED_DB:
        case StorageType.REMOTE_API:
          // Для всех типов хранилищ пробуем получить данные из localStorage
          serializedData = localStorage.getItem(key)
          break
      }

      if (serializedData) {
        return JSON.parse(serializedData) as T
      }

      return defaultValue !== undefined ? defaultValue : null
    } catch (error) {
      console.error(`Error getting data for key ${key}:`, error)
      return defaultValue !== undefined ? defaultValue : null
    }
  }

  // Удаление данных
  async removeData(key: string): Promise<boolean> {
    try {
      switch (this.config.storageType) {
        case StorageType.LOCAL_STORAGE:
          localStorage.removeItem(key)
          break

        case StorageType.INDEXED_DB:
          // Здесь будет реализация для IndexedDB
          localStorage.removeItem(key)
          break

        case StorageType.REMOTE_API:
          // Удаляем локально
          localStorage.removeItem(key)
          // Отмечаем для синхронизации (для удаления на сервере)
          this.pendingChanges.add(`delete:${key}`)
          break
      }

      return true
    } catch (error) {
      console.error(`Error removing data for key ${key}:`, error)
      return false
    }
  }

  // Проверка наличия данных
  async hasData(key: string): Promise<boolean> {
    try {
      switch (this.config.storageType) {
        case StorageType.LOCAL_STORAGE:
        case StorageType.INDEXED_DB:
        case StorageType.REMOTE_API:
          return localStorage.getItem(key) !== null
      }

      return false
    } catch (error) {
      console.error(`Error checking data for key ${key}:`, error)
      return false
    }
  }

  // Полная очистка базы данных
  async clearAllData(): Promise<boolean> {
    try {
      switch (this.config.storageType) {
        case StorageType.LOCAL_STORAGE:
          localStorage.clear()
          break

        case StorageType.INDEXED_DB:
          // Здесь будет реализация для IndexedDB
          localStorage.clear()
          break

        case StorageType.REMOTE_API:
          // Очищаем локальное хранилище
          localStorage.clear()
          // Отмечаем для синхронизации (полная очистка на сервере)
          this.pendingChanges.add('clearAll')
          break
      }

      return true
    } catch (error) {
      console.error('Error clearing all data:', error)
      return false
    }
  }

  // Принудительная синхронизация с удаленным сервером
  async forceSyncWithRemote(): Promise<boolean> {
    if (this.config.storageType !== StorageType.REMOTE_API) {
      return false
    }

    try {
      await this.syncWithRemote()
      return true
    } catch (error) {
      console.error('Error forcing sync with remote:', error)
      return false
    }
  }
}

// Класс для интеграции с Telegram
export class TelegramIntegration {
  private static instance: TelegramIntegration
  private userId?: string
  private isInitialized = false
  private userData: Record<string, any> = {}

  private constructor() {
    // приватный конструктор для паттерна Singleton
  }

  // Получение экземпляра класса
  public static getInstance(): TelegramIntegration {
    if (!TelegramIntegration.instance) {
      TelegramIntegration.instance = new TelegramIntegration()
    }
    return TelegramIntegration.instance
  }

  // Инициализация с данными Telegram
  public async initialize(): Promise<boolean> {
    try {
      // Проверяем, работаем ли мы внутри Telegram WebApp
      if (WebApp && WebApp.initData) {
        // Обрабатываем initData для получения информации о пользователе
        const initData = WebApp.initData

        if (initData) {
          console.log('Telegram WebApp initialized with data');

          // Получаем данные Telegram пользователя
          const user = WebApp.initDataUnsafe.user;
          if (user) {
            this.userId = user.id.toString();
            this.userData = {
              id: user.id,
              firstName: user.first_name,
              lastName: user.last_name,
              username: user.username,
              languageCode: user.language_code
            };

            // Сохраняем telegram ID и другие данные для восстановления сессии
            localStorage.setItem('telegram_user_id', this.userId);
            localStorage.setItem('telegram_user_data', JSON.stringify(this.userData));

            this.isInitialized = true;
            return true;
          }
        }
      }

      // Если нет прямых данных WebApp, пробуем восстановить из localStorage
      const savedTelegramId = localStorage.getItem('telegram_user_id');
      const savedUserData = localStorage.getItem('telegram_user_data');

      if (savedTelegramId) {
        this.userId = savedTelegramId;

        if (savedUserData) {
          try {
            this.userData = JSON.parse(savedUserData);
          } catch (e) {
            console.error('Error parsing saved user data', e);
            this.userData = { id: parseInt(savedTelegramId) };
          }
        } else {
          this.userData = { id: parseInt(savedTelegramId) };
        }

        this.isInitialized = true;
        console.log('Restored Telegram session from localStorage');
        return true;
      }

      // Если мы не внутри Telegram или нет initData и нет сохраненных данных
      console.warn('Not running in Telegram WebApp or missing initData');
      this.isInitialized = false;
      return false;
    } catch (error) {
      console.error('Error initializing Telegram integration:', error);
      this.isInitialized = false;
      return false;
    }
  }

  // Получить уникальный ID пользователя Telegram
  public getUserId(): string | undefined {
    return this.userId
  }

  // Получить данные пользователя Telegram
  public getUserData(): Record<string, any> {
    return { ...this.userData }
  }

  // Проверить, инициализирована ли интеграция
  public isReady(): boolean {
    return this.isInitialized
  }

  // Отправить данные в Telegram (для backend-as-a-service)
  public async sendData(endpoint: string, data: any): Promise<any> {
    try {
      // В реальном приложении здесь был бы код для отправки данных
      // на ваш BaaS, который затем взаимодействует с Telegram Bot API
      console.log(`Sending data to ${endpoint}:`, data)

      // Имитация ответа от API
      return {
        success: true,
        timestamp: Date.now()
      }
    } catch (error) {
      console.error(`Error sending data to ${endpoint}:`, error)
      throw error
    }
  }
}

// Базовый модуль для работы с локальным хранилищем

/**
 * Проверяет и исправляет структуру данных в localStorage
 */
export const validateLocalStorage = (): boolean => {
  try {
    console.log('Проверка структуры данных в localStorage...');

    // Проверяем структуру users
    if (!localStorage.getItem('users')) {
      localStorage.setItem('users', JSON.stringify([]));
      console.log('Инициализирован пустой массив пользователей');
    } else {
      try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        if (!Array.isArray(users)) {
          console.warn('Некорректные данные пользователей, сбрасываем');
          localStorage.setItem('users', JSON.stringify([]));
        }
      } catch (e) {
        console.error('Ошибка при парсинге данных пользователей:', e);
        localStorage.setItem('users', JSON.stringify([]));
      }
    }

    // Проверяем структуру chats
    if (!localStorage.getItem('chats')) {
      localStorage.setItem('chats', JSON.stringify([]));
      console.log('Инициализирован пустой массив чатов');
    } else {
      try {
        const chats = JSON.parse(localStorage.getItem('chats') || '[]');
        if (!Array.isArray(chats)) {
          console.warn('Некорректные данные чатов, сбрасываем');
          localStorage.setItem('chats', JSON.stringify([]));
        }
      } catch (e) {
        console.error('Ошибка при парсинге данных чатов:', e);
        localStorage.setItem('chats', JSON.stringify([]));
      }
    }

    // Проверяем структуру searching_users
    if (!localStorage.getItem('searching_users')) {
      localStorage.setItem('searching_users', JSON.stringify([]));
      console.log('Инициализирован пустой массив ищущих пользователей');
    } else {
      try {
        const searchingUsers = JSON.parse(localStorage.getItem('searching_users') || '[]');
        if (!Array.isArray(searchingUsers)) {
          console.warn('Некорректные данные поиска, сбрасываем');
          localStorage.setItem('searching_users', JSON.stringify([]));
        }
      } catch (e) {
        console.error('Ошибка при парсинге данных поиска:', e);
        localStorage.setItem('searching_users', JSON.stringify([]));
      }
    }

    console.log('Проверка структуры данных в localStorage завершена успешно');
    return true;
  } catch (error) {
    console.error('Ошибка при проверке структуры данных:', error);
    return false;
  }
};

// Простой интерфейс для работы с данными
export const db = {
  async getData(key: string): Promise<any> {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Ошибка при получении данных для ${key}:`, error);
      return null;
    }
  },

  async saveData(key: string, data: any): Promise<boolean> {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Ошибка при сохранении данных для ${key}:`, error);
      return false;
    }
  },

  async removeData(key: string): Promise<boolean> {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Ошибка при удалении данных для ${key}:`, error);
      return false;
    }
  },

  async clearAllData(): Promise<boolean> {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Ошибка при очистке всех данных:', error);
      return false;
    }
  }
};

// Интеграция с Telegram API
export const telegramApi = {
  isInitialized: false,

  isReady(): boolean {
    return this.isInitialized;
  },

  async initialize(): Promise<boolean> {
    try {
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize Telegram API:', error);
      return false;
    }
  },

  getUserId(): string | null {
    // Заглушка для локального тестирования
    return '12345678';
  },

  getUserData(): any {
    // Заглушка для локального тестирования
    return {
      id: '12345678',
      first_name: 'TestUser',
      username: 'test_user',
      language_code: 'ru'
    };
  }
};
