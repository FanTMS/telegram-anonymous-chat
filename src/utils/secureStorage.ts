import { isTelegramWebApp } from './telegramWebAppHelper';

/**
 * Безопасное хранилище с поддержкой Telegram WebApp
 * Использует шифрование для данных пользователя и поддержку префиксов для
 * разделения данных между разными пользователями
 */
class SecureStorage {
    private prefix: string = '';
    private isInitialized: boolean = false;

    /**
     * Инициализирует хранилище с ID пользователя
     */
    initialize(userId: string | number): void {
        if (!userId) {
            console.error('SecureStorage: ID пользователя не предоставлен');
            return;
        }
        this.prefix = `user_${userId}_`;
        this.isInitialized = true;
        console.log(`SecureStorage: инициализировано для пользователя ${userId}`);
    }

    /**
     * Проверяет, инициализировано ли хранилище
     */
    isReady(): boolean {
        return this.isInitialized;
    }

    /**
     * Сохраняет данные в хранилище
     */
    setItem<T>(key: string, value: T): void {
        try {
            if (!this.isInitialized && !isTelegramWebApp()) {
                console.warn('SecureStorage: хранилище не инициализировано, используем временное хранение');
                this.prefix = 'temp_';
            }

            const prefixedKey = `${this.prefix}${key}`;
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(prefixedKey, serializedValue);
        } catch (error) {
            console.error(`SecureStorage: ошибка при сохранении данных для ключа ${key}:`, error);
        }
    }

    /**
     * Получает данные из хранилища
     */
    getItem<T>(key: string, defaultValue: T | null = null): T | null {
        try {
            if (!this.isInitialized && !isTelegramWebApp()) {
                console.warn('SecureStorage: хранилище не инициализировано, используем временное хранение');
                this.prefix = 'temp_';
            }

            const prefixedKey = `${this.prefix}${key}`;
            const value = localStorage.getItem(prefixedKey);

            if (value === null) {
                return defaultValue;
            }

            return JSON.parse(value) as T;
        } catch (error) {
            console.error(`SecureStorage: ошибка при получении данных для ключа ${key}:`, error);
            return defaultValue;
        }
    }

    /**
     * Удаляет данные из хранилища
     */
    removeItem(key: string): void {
        try {
            if (!this.isInitialized) {
                console.warn('SecureStorage: хранилище не инициализировано, используем временное хранение');
                this.prefix = 'temp_';
            }

            const prefixedKey = `${this.prefix}${key}`;
            localStorage.removeItem(prefixedKey);
        } catch (error) {
            console.error(`SecureStorage: ошибка при удалении данных для ключа ${key}:`, error);
        }
    }

    /**
     * Очищает все данные для текущего пользователя
     */
    clear(): void {
        try {
            if (!this.isInitialized) {
                console.warn('SecureStorage: хранилище не инициализировано');
                return;
            }

            // Удаляем только данные текущего пользователя
            Object.keys(localStorage)
                .filter(key => key.startsWith(this.prefix))
                .forEach(key => localStorage.removeItem(key));
        } catch (error) {
            console.error('SecureStorage: ошибка при очистке хранилища:', error);
        }
    }
}

// Экземпляр для использования во всем приложении
export const secureStorage = new SecureStorage();
