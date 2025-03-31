import WebApp from '@twa-dev/sdk';

/**
 * Служба для работы с изолированным хранилищем пользователя
 */
export class UserStorageService {
    private userId: string | null = null;
    private initialized: boolean = false;
    private readonly prefix: string = 'tg_user_';

    /**
     * Инициализирует сервис с идентификатором пользователя
     * @param userId Telegram ID пользователя или другой уникальный идентификатор
     */
    initialize(userId: string | number | undefined): boolean {
        if (!userId) {
            console.warn('UserStorageService: Не указан ID пользователя');
            return false;
        }

        this.userId = String(userId);
        this.initialized = true;
        console.log(`UserStorageService: Инициализировано для пользователя ${this.userId}`);
        return true;
    }

    /**
     * Получает изолированный ключ для конкретного пользователя
     */
    private getUserKey(baseKey: string): string {
        if (!this.initialized || !this.userId) {
            return baseKey; // Если не инициализировано, используем стандартный ключ
        }
        return `${this.prefix}${this.userId}_${baseKey}`;
    }

    /**
     * Сохраняет данные в хранилище
     */
    setItem<T>(key: string, value: T): void {
        const userKey = this.getUserKey(key);
        try {
            localStorage.setItem(userKey, JSON.stringify(value));
        } catch (error) {
            console.error(`UserStorageService: Ошибка при сохранении данных для ключа '${key}'`, error);
        }
    }

    /**
     * Получает данные из хранилища
     */
    getItem<T>(key: string, defaultValue: T | null = null): T | null {
        const userKey = this.getUserKey(key);
        try {
            const data = localStorage.getItem(userKey);
            if (data === null) {
                return defaultValue;
            }
            return JSON.parse(data) as T;
        } catch (error) {
            console.error(`UserStorageService: Ошибка при получении данных для ключа '${key}'`, error);
            return defaultValue;
        }
    }

    /**
     * Удаляет данные из хранилища
     */
    removeItem(key: string): void {
        const userKey = this.getUserKey(key);
        try {
            localStorage.removeItem(userKey);
        } catch (error) {
            console.error(`UserStorageService: Ошибка при удалении данных для ключа '${key}'`, error);
        }
    }

    /**
     * Проверяет наличие ключа в хранилище
     */
    hasItem(key: string): boolean {
        const userKey = this.getUserKey(key);
        return localStorage.getItem(userKey) !== null;
    }

    /**
     * Получает все ключи текущего пользователя из хранилища
     */
    getAllUserKeys(): string[] {
        if (!this.initialized || !this.userId) {
            return [];
        }

        const userPrefix = `${this.prefix}${this.userId}_`;
        const keys: string[] = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(userPrefix)) {
                // Возвращаем ключ без префикса пользователя
                keys.push(key.substring(userPrefix.length));
            }
        }

        return keys;
    }

    /**
     * Очищает все данные текущего пользователя
     */
    clearUserData(): void {
        if (!this.initialized || !this.userId) {
            return;
        }

        const userPrefix = `${this.prefix}${this.userId}_`;
        const keysToRemove: string[] = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(userPrefix)) {
                keysToRemove.push(key);
            }
        }

        // Удаляем все найденные ключи
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`UserStorageService: Удалено ${keysToRemove.length} ключей для пользователя ${this.userId}`);
    }

    /**
     * Проверяет инициализированность сервиса
     */
    isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Получает ID текущего пользователя
     */
    getUserId(): string | null {
        return this.userId;
    }
}

// Создаем и экспортируем единый экземпляр для всего приложения
export const userStorage = new UserStorageService();
