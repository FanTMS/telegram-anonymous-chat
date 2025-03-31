/**
 * Модуль для изолированного хранилища пользовательских данных
 * Каждый пользователь видит только свои данные
 */

// Префикс для хранения данных в localStorage по ID пользователя
const STORAGE_PREFIX = 'tg_user_';

class UserStorage {
    private userId: string | null = null;
    private initialized = false;
    private initializationAttempts = 0;
    private readonly MAX_INITIALIZATION_ATTEMPTS = 3;

    /**
     * Инициализация хранилища для конкретного пользователя
     * @param userId - ID пользователя (обычно Telegram ID)
     */
    initialize(userId: string | number): boolean {
        try {
            // Проверяем, не превысили ли лимит попыток
            if (this.initializationAttempts >= this.MAX_INITIALIZATION_ATTEMPTS) {
                console.warn(`Превышен лимит попыток инициализации хранилища (${this.MAX_INITIALIZATION_ATTEMPTS})`);
                return false;
            }

            this.initializationAttempts++;

            // Преобразуем ID в строку
            const userIdStr = String(userId);

            if (!userIdStr || userIdStr === 'undefined' || userIdStr === 'null') {
                console.error('Попытка инициализации хранилища с некорректным userId:', userId);
                return false;
            }

            this.userId = userIdStr;
            this.initialized = true;
            console.log(`Хранилище успешно инициализировано для пользователя ${this.userId}`);
            return true;
        } catch (error) {
            console.error('Ошибка при инициализации хранилища:', error);
            return false;
        }
    }

    /**
     * Проверка инициализации хранилища
     */
    isInitialized(): boolean {
        return this.initialized && this.userId !== null;
    }

    /**
     * Получить ID текущего пользователя
     */
    getUserId(): string | null {
        return this.userId;
    }

    /**
     * Сформировать ключ хранилища для текущего пользователя
     */
    private getStorageKey(key: string): string {
        if (!this.isInitialized()) {
            console.error('Попытка доступа к хранилищу до инициализации');
            return `${STORAGE_PREFIX}undefined_${key}`;
        }
        return `${STORAGE_PREFIX}${this.userId}_${key}`;
    }

    /**
     * Получить данные из хранилища
     * @param key - ключ данных
     * @param defaultValue - значение по умолчанию
     */
    getItem<T>(key: string, defaultValue: T): T {
        try {
            if (!this.isInitialized()) {
                console.warn('UserStorage не инициализирован, возвращаем значение по умолчанию');
                return defaultValue;
            }

            const storageKey = this.getStorageKey(key);
            const valueJson = localStorage.getItem(storageKey);

            if (valueJson === null) {
                return defaultValue;
            }

            return JSON.parse(valueJson) as T;
        } catch (error) {
            console.error(`Ошибка при получении значения по ключу ${key}:`, error);
            return defaultValue;
        }
    }

    /**
     * Сохранить данные в хранилище
     * @param key - ключ данных
     * @param value - значение для сохранения
     */
    setItem<T>(key: string, value: T): boolean {
        try {
            if (!this.isInitialized()) {
                console.error('Попытка сохранения до инициализации хранилища');
                return false;
            }

            const storageKey = this.getStorageKey(key);
            localStorage.setItem(storageKey, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Ошибка при сохранении значения по ключу ${key}:`, error);
            return false;
        }
    }

    /**
     * Удалить данные из хранилища
     * @param key - ключ данных
     */
    removeItem(key: string): boolean {
        try {
            if (!this.isInitialized()) {
                console.error('Попытка удаления до инициализации хранилища');
                return false;
            }

            const storageKey = this.getStorageKey(key);
            localStorage.removeItem(storageKey);
            return true;
        } catch (error) {
            console.error(`Ошибка при удалении значения по ключу ${key}:`, error);
            return false;
        }
    }

    /**
     * Очистить все данные текущего пользователя
     */
    clear(): boolean {
        try {
            if (!this.isInitialized()) {
                console.error('Попытка очистки до инициализации хранилища');
                return false;
            }

            // Удаляем только ключи текущего пользователя
            const prefix = `${STORAGE_PREFIX}${this.userId}_`;

            Object.keys(localStorage)
                .filter(key => key.startsWith(prefix))
                .forEach(key => localStorage.removeItem(key));

            console.log(`Удалены все данные пользователя ${this.userId}`);
            return true;
        } catch (error) {
            console.error('Ошибка при очистке хранилища:', error);
            return false;
        }
    }

    /**
     * Получить список всех ключей пользователя
     */
    getAllUserKeys(): string[] {
        try {
            if (!this.isInitialized()) {
                console.error('Попытка получения ключей до инициализации хранилища');
                return [];
            }

            const prefix = `${STORAGE_PREFIX}${this.userId}_`;

            return Object.keys(localStorage)
                .filter(key => key.startsWith(prefix))
                .map(key => key.replace(prefix, ''));
        } catch (error) {
            console.error('Ошибка при получении списка ключей:', error);
            return [];
        }
    }

    /**
     * Сбросить состояние хранилища (для тестирования)
     */
    reset(): void {
        this.userId = null;
        this.initialized = false;
        this.initializationAttempts = 0;
    }
}

// Экспортируем синглтон экземпляр
export const userStorage = new UserStorage();

// Дополнительные типы для использования с хранилищем
export interface StorageOptions {
    expires?: number; // Время жизни в миллисекундах
}

export default userStorage;
