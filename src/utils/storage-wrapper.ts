// Файл: storage-wrapper.ts
// Обертка над различными типами хранилищ для унифицированного доступа к данным

import WebApp from '@twa-dev/sdk';

/**
 * Класс для работы с различными типами хранилищ (localStorage, WebApp storage, sessionStorage)
 * с единым интерфейсом и автоматическим выбором лучшего доступного варианта.
 */
export class StorageWrapper {
    private static instance: StorageWrapper;
    private useWebAppStorage: boolean;
    private useSessionStorage: boolean;
    private memoryFallback: Record<string, string>; // Запасной вариант в памяти

    /**
     * Приватный конструктор (Singleton паттерн)
     */
    private constructor() {
        this.useWebAppStorage = this.checkWebAppStorageAvailable();
        this.useSessionStorage = this.checkSessionStorageAvailable();
        this.memoryFallback = {};

        console.log(`StorageWrapper инициализирован: WebApp Storage: ${this.useWebAppStorage}, Session Storage: ${this.useSessionStorage}`);
    }

    /**
     * Получить единственный экземпляр класса StorageWrapper
     */
    public static getInstance(): StorageWrapper {
        if (!StorageWrapper.instance) {
            StorageWrapper.instance = new StorageWrapper();
        }
        return StorageWrapper.instance;
    }

    /**
     * Проверка доступности Telegram WebApp Storage API
     */
    private checkWebAppStorageAvailable(): boolean {
        try {
            // Проверяем, запущено ли приложение в среде Telegram и доступно ли хранилище
            return Boolean(WebApp && typeof WebApp.CloudStorage === 'object' && WebApp.isExpanded);
        } catch (e) {
            console.warn('WebApp Storage API недоступен:', e);
            return false;
        }
    }

    /**
     * Проверка доступности sessionStorage
     */
    private checkSessionStorageAvailable(): boolean {
        try {
            const testKey = '__storage_test__';
            sessionStorage.setItem(testKey, testKey);
            sessionStorage.removeItem(testKey);
            return true;
        } catch (e) {
            console.warn('Session Storage недоступен:', e);
            return false;
        }
    }

    /**
     * Проверка доступности localStorage
     */
    private checkLocalStorageAvailable(): boolean {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            console.warn('Local Storage недоступен:', e);
            return false;
        }
    }

    /**
     * Получить значение из хранилища
     * @param key - ключ
     * @returns значение или null, если ключ отсутствует
     */
    public getItem(key: string): string | null {
        try {
            // 1. Сначала пробуем Telegram WebApp Storage, если доступно
            if (this.useWebAppStorage && WebApp.CloudStorage) {
                // Асинхронное API, но мы возвращаем синхронно для совместимости
                // Реальные данные будут получены при следующем вызове после загрузки
                const cachedValue = sessionStorage.getItem(`tg_cache_${key}`);
                if (cachedValue !== null) {
                    return cachedValue;
                }

                // Запускаем асинхронное получение данных для следующего вызова
                this.getFromWebAppAsync(key);

                // Пробуем получить из localStorage как запасной вариант
                return localStorage.getItem(key);
            }

            // 2. Затем пробуем localStorage
            if (this.checkLocalStorageAvailable()) {
                return localStorage.getItem(key);
            }

            // 3. Затем sessionStorage
            if (this.useSessionStorage) {
                return sessionStorage.getItem(key);
            }

            // 4. Наконец, используем память как последний вариант
            return this.memoryFallback[key] || null;
        } catch (error) {
            console.error(`Ошибка при получении данных из хранилища для ключа ${key}:`, error);
            return null;
        }
    }

    /**
     * Асинхронно получает данные из WebApp CloudStorage и кэширует их в sessionStorage
     */
    private getFromWebAppAsync(key: string): void {
        if (this.useWebAppStorage && WebApp.CloudStorage) {
            WebApp.CloudStorage.getItem(key, (error, value) => {
                if (error) {
                    console.error(`Ошибка при получении данных из WebApp Storage для ключа ${key}:`, error);
                } else if (value !== null && this.useSessionStorage) {
                    // Кэшируем значение в sessionStorage для быстрого доступа
                    sessionStorage.setItem(`tg_cache_${key}`, value);
                }
            });
        }
    }

    /**
     * Сохранить значение в хранилище
     * @param key - ключ
     * @param value - значение
     */
    public setItem(key: string, value: string): void {
        try {
            // 1. Пробуем сохранить в Telegram WebApp Storage, если доступно
            if (this.useWebAppStorage && WebApp.CloudStorage) {
                WebApp.CloudStorage.setItem(key, value, (error) => {
                    if (error) {
                        console.error(`Ошибка при сохранении в WebApp Storage для ключа ${key}:`, error);
                    }
                });

                // Обновляем кэш в sessionStorage
                if (this.useSessionStorage) {
                    sessionStorage.setItem(`tg_cache_${key}`, value);
                }
            }

            // 2. Сохраняем в localStorage (для совместимости и как запасной вариант)
            if (this.checkLocalStorageAvailable()) {
                localStorage.setItem(key, value);
            }

            // 3. Сохраняем в sessionStorage как запасной вариант
            if (this.useSessionStorage) {
                sessionStorage.setItem(key, value);
            }

            // 4. Сохраняем в памяти как последний вариант
            this.memoryFallback[key] = value;
        } catch (error) {
            console.error(`Ошибка при сохранении данных в хранилище для ключа ${key}:`, error);

            // В случае ошибки, пытаемся использовать запасные варианты
            try {
                if (this.useSessionStorage) {
                    sessionStorage.setItem(key, value);
                }
                this.memoryFallback[key] = value;
            } catch (e) {
                console.error('Все методы хранения не доступны:', e);
            }
        }
    }

    /**
     * Удалить значение из хранилища
     * @param key - ключ
     */
    public removeItem(key: string): void {
        try {
            // 1. Удаляем из Telegram WebApp Storage
            if (this.useWebAppStorage && WebApp.CloudStorage) {
                WebApp.CloudStorage.removeItem(key, (error) => {
                    if (error) {
                        console.error(`Ошибка при удалении из WebApp Storage для ключа ${key}:`, error);
                    }
                });

                // Удаляем из кэша
                if (this.useSessionStorage) {
                    sessionStorage.removeItem(`tg_cache_${key}`);
                }
            }

            // 2. Удаляем из localStorage
            if (this.checkLocalStorageAvailable()) {
                localStorage.removeItem(key);
            }

            // 3. Удаляем из sessionStorage
            if (this.useSessionStorage) {
                sessionStorage.removeItem(key);
            }

            // 4. Удаляем из памяти
            delete this.memoryFallback[key];
        } catch (error) {
            console.error(`Ошибка при удалении данных из хранилища для ключа ${key}:`, error);
        }
    }

    /**
     * Получить все ключи из хранилища
     */
    public keys(): string[] {
        try {
            if (this.checkLocalStorageAvailable()) {
                return Object.keys(localStorage);
            } else if (this.useSessionStorage) {
                return Object.keys(sessionStorage);
            } else {
                return Object.keys(this.memoryFallback);
            }
        } catch (error) {
            console.error('Ошибка при получении ключей из хранилища:', error);
            return Object.keys(this.memoryFallback);
        }
    }

    /**
     * Очистить хранилище
     */
    public clear(): void {
        try {
            // Очищаем только данные приложения, а не все хранилище
            const keysToRemove = this.keys();

            for (const key of keysToRemove) {
                this.removeItem(key);
            }

            this.memoryFallback = {};
        } catch (error) {
            console.error('Ошибка при очистке хранилища:', error);
        }
    }
}

// Экспортируем один экземпляр для использования в приложении
export const storage = StorageWrapper.getInstance();

// Для обратной совместимости предоставляем аналоги localStorage API
export const storageAPI = {
    getItem: (key: string) => storage.getItem(key),
    setItem: (key: string, value: string) => storage.setItem(key, value),
    removeItem: (key: string) => storage.removeItem(key),
    clear: () => storage.clear(),
    keys: () => storage.keys(),
    // Для полной совместимости с localStorage добавляем length и key
    get length(): number {
        return storage.keys().length;
    },
    key: (index: number): string | null => {
        const keys = storage.keys();
        return index >= 0 && index < keys.length ? keys[index] : null;
    }
};