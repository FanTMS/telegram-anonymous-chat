import WebApp from '@twa-dev/sdk';

/**
 * Интерфейс для данных пользователя Telegram
 */
interface TelegramUserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

/**
 * API для работы с данными Telegram
 */
export const telegramApi = {
  /**
   * Проверяет, готов ли API к использованию
   */
  isReady(): boolean {
    try {
      return typeof WebApp !== 'undefined' &&
        WebApp.initDataUnsafe &&
        WebApp.initDataUnsafe.user !== undefined;
    } catch (error) {
      console.error('Ошибка при проверке готовности telegramApi:', error);
      return false;
    }
  },

  /**
   * Получает ID пользователя из данных Telegram WebApp
   */
  getUserId(): number | null {
    try {
      if (this.isReady() && WebApp.initDataUnsafe.user) {
        return WebApp.initDataUnsafe.user.id;
      }
      return null;
    } catch (error) {
      console.error('Ошибка при получении ID пользователя:', error);
      return null;
    }
  },

  /**
   * Получает данные текущего пользователя из Telegram WebApp
   */
  getUserData(): TelegramUserData | null {
    try {
      if (this.isReady() && WebApp.initDataUnsafe.user) {
        return { ...WebApp.initDataUnsafe.user };
      }
      return null;
    } catch (error) {
      console.error('Ошибка при получении данных пользователя:', error);
      return null;
    }
  },

  /**
   * Проверяет, запущено ли приложение в рамках Telegram WebApp
   */
  isRunningInTelegram(): boolean {
    try {
      return typeof WebApp !== 'undefined' &&
        WebApp.isExpanded !== undefined;
    } catch (error) {
      console.error('Ошибка при проверке запуска в Telegram:', error);
      return false;
    }
  },

  /**
   * Проверяет наличие обязательных параметров в initData
   */
  validateInitData(): boolean {
    try {
      if (!this.isReady()) return false;

      // Проверяем наличие обязательных полей
      const { user } = WebApp.initDataUnsafe;
      return user && typeof user.id === 'number' &&
        typeof user.first_name === 'string';
    } catch (error) {
      console.error('Ошибка при валидации initData:', error);
      return false;
    }
  },

  /**
   * Инициализирует API
   */
  async initialize(): Promise<boolean> {
    try {
      // В реальном приложении здесь может быть дополнительная логика инициализации,
      // например, запрос на сервер для валидации initData
      if (this.isRunningInTelegram()) {
        console.log('Telegram WebApp инициализирован');
        WebApp.ready();
        return true;
      }

      console.log('Приложение не запущено в Telegram');
      return false;
    } catch (error) {
      console.error('Ошибка при инициализации telegramApi:', error);
      return false;
    }
  },

  /**
   * Получает язык пользователя
   */
  getUserLanguage(): string {
    try {
      if (this.isReady() && WebApp.initDataUnsafe.user?.language_code) {
        return WebApp.initDataUnsafe.user.language_code;
      }
      return navigator.language.split('-')[0] || 'ru';
    } catch (error) {
      console.error('Ошибка при получении языка пользователя:', error);
      return 'ru';
    }
  },

  /**
   * Получает URL аватара пользователя, если доступен
   */
  getUserPhotoUrl(): string | null {
    try {
      if (this.isReady() && WebApp.initDataUnsafe.user?.photo_url) {
        return WebApp.initDataUnsafe.user.photo_url;
      }
      return null;
    } catch (error) {
      console.error('Ошибка при получении URL аватара:', error);
      return null;
    }
  },

  /**
   * Проверяет, является ли пользователь премиум-пользователем Telegram
   */
  isUserPremium(): boolean {
    try {
      return !!this.isReady() &&
        !!WebApp.initDataUnsafe.user?.is_premium;
    } catch (error) {
      console.error('Ошибка при проверке премиум-статуса:', error);
      return false;
    }
  },

  /**
   * Получает полное имя пользователя
   */
  getUserFullName(): string {
    try {
      if (!this.isReady() || !WebApp.initDataUnsafe.user) return '';

      const { first_name, last_name } = WebApp.initDataUnsafe.user;
      return [first_name, last_name].filter(Boolean).join(' ');
    } catch (error) {
      console.error('Ошибка при получении полного имени пользователя:', error);
      return '';
    }
  }
};

export default telegramApi;
