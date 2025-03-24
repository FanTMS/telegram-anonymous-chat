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

// Функция для проверки и исправления данных в localStorage
export const validateLocalStorage = () => {
  try {
    // Проверка чатов
    const chatsData = localStorage.getItem('chats');
    if (chatsData) {
      try {
        const chats = JSON.parse(chatsData);
        if (!Array.isArray(chats)) {
          console.error('Данные чатов не являются массивом, сбрасываем');
          localStorage.setItem('chats', JSON.stringify([]));
        }
      } catch (e) {
        console.error('Ошибка при парсинге данных чатов, сбрасываем', e);
        localStorage.setItem('chats', JSON.stringify([]));
      }
    }

    // Проверка текущего пользователя
    const currentUserId = localStorage.getItem('current_user_id');
    if (currentUserId) {
      const userKey = `user_${currentUserId}`;
      const userData = localStorage.getItem(userKey);

      if (!userData) {
        console.error('Текущий пользователь не найден, сбрасываем ID');
        localStorage.removeItem('current_user_id');
      } else {
        try {
          JSON.parse(userData);
        } catch (e) {
          console.error('Ошибка при парсинге данных пользователя, сбрасываем', e);
          localStorage.removeItem(userKey);
          localStorage.removeItem('current_user_id');
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Ошибка при валидации localStorage:', error);
    return false;
  }
};

// Создаем и экспортируем экземпляр базы данных с более стабильными настройками
export const db = new UserDatabase({
  // Используем localStorage в любом окружении для стабильности
  storageType: StorageType.LOCAL_STORAGE,
  // Увеличим интервал синхронизации чтобы снизить нагрузку
  syncInterval: 60000, // раз в минуту
  // Только в production используем сжатие
  useCompression: import.meta.env.PROD
});

// Экспортируем экземпляр интеграции с Telegram
export const telegramApi = TelegramIntegration.getInstance()
