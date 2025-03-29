import WebApp from '@twa-dev/sdk'
import axios from 'axios'

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
  private pendingChanges = new Map<string, { action: 'save' | 'delete', data?: any }>()
  private apiBaseUrl: string
  private lastSyncTime = 0
  private syncRetryCount = 0
  private syncError: Error | null = null
  private isOnline = true

  constructor(config: DatabaseConfig) {
    this.config = {
      ...config,
      useCompression: config.useCompression ?? false,
      syncInterval: config.syncInterval ?? 60000, // по умолчанию раз в минуту
      maxRetries: config.maxRetries ?? 3
    }

    this.apiBaseUrl = this.config.apiBaseUrl || '/.netlify/functions/database-api'

    // Слушаем изменения состояния сети
    window.addEventListener('online', this.handleNetworkChange.bind(this))
    window.addEventListener('offline', this.handleNetworkChange.bind(this))
    this.isOnline = navigator.onLine

    // Если используем remote API, запускаем периодическую синхронизацию
    if (this.config.storageType === StorageType.REMOTE_API && this.config.syncInterval) {
      this.startSync()
    }
  }

  // Обработка изменений состояния сети
  private handleNetworkChange(event: Event): void {
    this.isOnline = navigator.onLine
    console.log(`Network status changed: ${this.isOnline ? 'online' : 'offline'}`)

    if (this.isOnline && this.pendingChanges.size > 0) {
      // Если снова онлайн, и есть несинхронизированные изменения, запускаем синхронизацию
      this.syncWithRemote()
    }
  }

  // Запуск периодической синхронизации с сервером
  private startSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
    }

    this.syncTimer = setInterval(() => {
      if (this.isOnline && this.pendingChanges.size > 0) {
        this.syncWithRemote()
      }
    }, this.config.syncInterval)
  }

  // Синхронизация данных с удаленным сервером
  private async syncWithRemote(): Promise<void> {
    if (this.isSyncing || this.pendingChanges.size === 0 || !this.isOnline) return

    this.isSyncing = true
    this.syncError = null

    try {
      console.log(`Синхронизация с сервером, ${this.pendingChanges.size} изменений`)

      for (const [key, changeData] of this.pendingChanges.entries()) {
        try {
          if (key === 'clearAll') {
            // Обработка полной очистки данных
            console.log('Выполняем полную очистку данных на сервере')
            // TODO: Добавить код для полной очистки данных на сервере
            continue
          }

          // Проверяем, удаление это или сохранение
          if (changeData.action === 'delete') {
            // Удаление данных
            const collection = key.split('_')[0] || 'users' // Определяем коллекцию
            const itemKey = key

            await axios.delete(`${this.apiBaseUrl}/${collection}/${itemKey}`)
            console.log(`Удалены данные: ${key}`)
          } else {
            // Сохранение данных
            const collection = key.split('_')[0] || 'users' // Определяем коллекцию
            const itemKey = key

            await axios.post(
              `${this.apiBaseUrl}/${collection}/${itemKey}`,
              changeData.data || localStorage.getItem(key)
            )
            console.log(`Синхронизированы данные: ${key}`)
          }

          // После успешной синхронизации удаляем из списка ожидающих
          this.pendingChanges.delete(key)
        } catch (error) {
          console.error(`Ошибка при синхронизации ${key}:`, error)
          this.syncRetryCount++

          if (this.syncRetryCount > this.config.maxRetries) {
            console.error(`Превышено количество попыток синхронизации для ${key}, пропускаем`)
            this.pendingChanges.delete(key) // Удаляем из списка, чтобы не блокировать остальные
          }
        }
      }

      this.lastSyncTime = Date.now()
      this.syncRetryCount = 0
      console.log('Синхронизация завершена')

    } catch (error) {
      console.error('Ошибка при синхронизации с сервером:', error)
      this.syncError = error as Error
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

          // Добавляем в очередь синхронизации
          this.pendingChanges.set(key, {
            action: 'save',
            data: data
          })

          // Если онлайн и первое изменение, запускаем синхронизацию немедленно
          if (this.isOnline && this.pendingChanges.size === 1) {
            this.syncWithRemote()
          }
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
      let data: T | null = null
      let serializedData: string | null = null

      switch (this.config.storageType) {
        case StorageType.LOCAL_STORAGE:
        case StorageType.INDEXED_DB:
          serializedData = localStorage.getItem(key)
          if (serializedData) {
            data = JSON.parse(serializedData) as T
          }
          break

        case StorageType.REMOTE_API:
          // Сначала проверяем локальный кэш
          serializedData = localStorage.getItem(key)

          if (serializedData) {
            data = JSON.parse(serializedData) as T
          }

          // Если мы онлайн, пытаемся получить актуальные данные с сервера
          if (this.isOnline) {
            try {
              const collection = key.split('_')[0] || 'users'
              const response = await axios.get(`${this.apiBaseUrl}/${collection}/${key}`)

              if (response.data && response.status === 200) {
                data = response.data as T
                // Обновляем локальный кэш
                localStorage.setItem(key, JSON.stringify(data))
              }
            } catch (error) {
              // Если данные не найдены на сервере, используем локальные
              if (axios.isAxiosError(error) && error.response?.status === 404) {
                console.log(`Данные ${key} не найдены на сервере, используем локальные`)
              } else {
                console.error(`Ошибка при получении данных с сервера для ${key}:`, error)
              }
            }
          }
          break
      }

      return data !== null ? data : (defaultValue !== undefined ? defaultValue : null)
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

          // Добавляем в очередь на удаление
          this.pendingChanges.set(key, { action: 'delete' })

          // Если онлайн, запускаем синхронизацию сразу
          if (this.isOnline) {
            this.syncWithRemote()
          }
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
      // Сначала проверяем локально
      const hasLocal = localStorage.getItem(key) !== null

      if (this.config.storageType !== StorageType.REMOTE_API || !this.isOnline) {
        return hasLocal
      }

      // Если удаленное хранилище и мы онлайн, проверяем на сервере
      try {
        const collection = key.split('_')[0] || 'users'
        const response = await axios.get(`${this.apiBaseUrl}/${collection}/${key}`)
        return response.status === 200
      } catch (error) {
        // Если получили 404, данных нет
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          return false
        }
        // При других ошибках полагаемся на локальные данные
        return hasLocal
      }
    } catch (error) {
      console.error(`Error checking data for key ${key}:`, error)
      return false
    }
  }

  // Полная очистка базы данных
  async clearAllData(): Promise<boolean> {
    try {
      // Очищаем локальное хранилище во всех случаях
      localStorage.clear()

      if (this.config.storageType === StorageType.REMOTE_API && this.isOnline) {
        // Добавляем задачу на полную очистку
        this.pendingChanges.set('clearAll', { action: 'delete' })
        this.syncWithRemote()
      }

      return true
    } catch (error) {
      console.error('Error clearing all data:', error)
      return false
    }
  }

  // Принудительная синхронизация с удаленным сервером
  async forceSyncWithRemote(): Promise<boolean> {
    if (this.config.storageType !== StorageType.REMOTE_API || !this.isOnline) {
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

  // Получить статус синхронизации
  getSyncStatus() {
    return {
      pending: this.pendingChanges.size,
      isSyncing: this.isSyncing,
      lastSync: this.lastSyncTime,
      error: this.syncError?.message,
      isOnline: this.isOnline
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

// Простой интерфейс для работы с данными
const dbInstance = new UserDatabase({
  storageType: StorageType.REMOTE_API,
  apiBaseUrl: '/.netlify/functions/database-api',
  syncInterval: 10000, // Синхронизация каждые 10 секунд
  useCompression: false,
  maxRetries: 3
})

// Обновляем экспортируемый объект db
export const db = {
  async getData(key: string): Promise<any> {
    return dbInstance.getData(key)
  },

  async saveData(key: string, data: any): Promise<boolean> {
    return dbInstance.saveData(key, data)
  },

  async removeData(key: string): Promise<boolean> {
    return dbInstance.removeData(key)
  },

  async hasData(key: string): Promise<boolean> {
    return dbInstance.hasData(key)
  },

  async clearAllData(): Promise<boolean> {
    return dbInstance.clearAllData()
  },

  async forceSyncWithRemote(): Promise<boolean> {
    return dbInstance.forceSyncWithRemote()
  },

  getSyncStatus() {
    return dbInstance.getSyncStatus()
  }
}

// Интеграция с Telegram API
export const telegramApi = TelegramIntegration.getInstance();

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
