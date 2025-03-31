import WebApp from '@twa-dev/sdk';
import { getCurrentUser } from './user';
import { userStorage } from './userStorage';

/**
 * Утилиты для отладки Telegram Mini-App
 */
export const debugUtils = {
    /**
     * Выводит информацию о Telegram WebApp в консоль
     */
    logWebAppInfo(): void {
        try {
            console.group('Telegram WebApp Debug Info');

            console.log('WebApp доступен:', typeof WebApp !== 'undefined');

            if (typeof WebApp !== 'undefined') {
                console.log('WebApp.initData:', WebApp.initData);
                console.log('WebApp.colorScheme:', WebApp.colorScheme);
                console.log('WebApp.themeParams:', WebApp.themeParams);
                console.log('WebApp.isExpanded:', WebApp.isExpanded);
                console.log('WebApp.viewportHeight:', WebApp.viewportHeight);
                console.log('WebApp.viewportStableHeight:', WebApp.viewportStableHeight);

                // Проверка пользовательских данных
                if (WebApp.initDataUnsafe && WebApp.initDataUnsafe.user) {
                    console.log('WebApp пользователь:', {
                        id: WebApp.initDataUnsafe.user.id,
                        first_name: WebApp.initDataUnsafe.user.first_name,
                        last_name: WebApp.initDataUnsafe.user.last_name,
                        username: WebApp.initDataUnsafe.user.username,
                        language_code: WebApp.initDataUnsafe.user.language_code,
                    });
                } else {
                    console.log('WebApp пользователь: Нет данных');
                }
            }

            console.groupEnd();
        } catch (e) {
            console.error('Ошибка при отладке WebApp:', e);
        }
    },

    /**
     * Выводит информацию о текущем пользователе в консоль
     */
    logCurrentUserInfo(): void {
        try {
            console.group('Текущий пользователь');

            const user = getCurrentUser();
            if (user) {
                console.log('ID:', user.id);
                console.log('Имя:', user.name);
                console.log('Возраст:', user.age);
                console.log('Интересы:', user.interests);
                console.log('Telegram ID:', user.telegramData?.telegramId);
                console.log('Последняя активность:', new Date(user.lastActive).toLocaleString());
            } else {
                console.log('Пользователь не найден');
            }

            console.groupEnd();
        } catch (e) {
            console.error('Ошибка при отладке пользователя:', e);
        }
    },

    /**
     * Выводит информацию о UserStorage
     */
    logStorageInfo(): void {
        try {
            console.group('UserStorage Info');

            console.log('Инициализирован:', userStorage.isInitialized());
            console.log('Текущий пользователь:', userStorage.getUserId());

            if (userStorage.isInitialized()) {
                const keys = userStorage.getAllUserKeys();
                console.log('Ключи хранилища:', keys);

                console.group('Содержимое хранилища');
                keys.forEach(key => {
                    const value = userStorage.getItem(key, null);
                    console.log(`${key}:`, value);
                });
                console.groupEnd();
            }

            console.groupEnd();
        } catch (e) {
            console.error('Ошибка при отладке хранилища:', e);
        }
    },

    /**
     * Выводит информацию о системе и окружении
     */
    logSystemInfo(): void {
        try {
            console.group('System Info');

            console.log('User Agent:', navigator.userAgent);
            console.log('Платформа:', navigator.platform);
            console.log('Язык:', navigator.language);
            console.log('Размер экрана:', `${window.innerWidth}x${window.innerHeight}`);
            console.log('Pixel Ratio:', window.devicePixelRatio);
            console.log('Тема системы:', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

            console.groupEnd();
        } catch (e) {
            console.error('Ошибка при отладке системы:', e);
        }
    },

    /**
     * Запускает полную отладку
     */
    runFullDebug(): void {
        console.group('ПОЛНАЯ ДИАГНОСТИКА ПРИЛОЖЕНИЯ');
        console.log('Время запуска:', new Date().toLocaleString());

        this.logSystemInfo();
        this.logWebAppInfo();
        this.logCurrentUserInfo();
        this.logStorageInfo();

        console.groupEnd();
    },

    /**
     * Сбрасывает все данные пользователя (для отладки)
     */
    resetUserData(): boolean {
        try {
            if (!userStorage.isInitialized()) return false;

            userStorage.clear();
            localStorage.removeItem('current_user_id');

            // Удаляем все ключи, связанные с пользователем
            Object.keys(localStorage)
                .filter(key => key.startsWith('user_') || key.startsWith('chat_'))
                .forEach(key => localStorage.removeItem(key));

            console.log('Данные пользователя сброшены');
            return true;
        } catch (e) {
            console.error('Ошибка при сбросе данных пользователя:', e);
            return false;
        }
    }
};

export default debugUtils;
