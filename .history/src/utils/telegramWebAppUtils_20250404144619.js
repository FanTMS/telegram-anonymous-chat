/**
 * Утилиты для безопасной работы с Telegram WebApp
 */
import WebApp from '@twa-dev/sdk';

/**
 * Безопасно вызывает метод Telegram WebApp с проверкой его доступности
 * @param {Function} method Метод для вызова
 * @param {Array} args Аргументы для передачи методу
 * @param {any} fallback Значение по умолчанию в случае недоступности метода
 * @returns {any} Результат вызова метода или fallback значение
 */
export const safeWebAppCall = (method, args = [], fallback = null) => {
    try {
        if (typeof method === 'function') {
            return method(...args);
        }
        return fallback;
    } catch (error) {
        console.warn(`Ошибка при вызове метода Telegram WebApp: ${error.message}`);
        return fallback;
    }
};

/**
 * Безопасный вызов тактильной обратной связи
 * @param {string} type - Тип тактильной обратной связи ('impact', 'notification', 'selection')
 * @param {string|null} impact - Интенсивность для impact ('light', 'medium', 'heavy', 'rigid', 'soft')
 * @param {string|null} notification - Тип уведомления ('success', 'warning', 'error')
 */
export const safeHapticFeedback = (type, impact = null, notification = null) => {
    try {
        if (WebApp.HapticFeedback) {
            switch (type) {
                case 'impact':
                    WebApp.HapticFeedback.impactOccurred(impact || 'medium');
                    break;
                case 'notification':
                    WebApp.HapticFeedback.notificationOccurred(notification || 'success');
                    break;
                case 'selection':
                    WebApp.HapticFeedback.selectionChanged();
                    break;
                default:
                    console.warn('Unknown haptic feedback type:', type);
            }
        }
    } catch (error) {
        console.warn('Haptic feedback failed:', error);
    }
};

/**
 * Безопасный вызов всплывающего уведомления
 * @param {Object} params - Параметры всплывающего окна
 * @returns {Promise<any>} - Результат выполнения
 */
export const safeShowPopup = async (params) => {
    try {
        if (WebApp.showPopup) {
            return await WebApp.showPopup(params);
        } else {
            // Запасной вариант - обычное окно alert
            alert(params.message || '');
            return null;
        }
    } catch (error) {
        console.warn('Show popup failed:', error);
        // Запасной вариант - обычное окно alert
        alert(params.message || '');
        return null;
    }
};

/**
 * Проверка поддержки метода в Telegram WebApp
 * @param {string} methodName - Название метода
 * @returns {boolean} - true, если метод поддерживается
 */
export const isWebAppMethodSupported = (methodName) => {
    try {
        return WebApp && typeof WebApp[methodName] === 'function';
    } catch (error) {
        return false;
    }
};

/**
 * Получение пользовательских данных из WebApp
 * @returns {Object|null} - Данные пользователя или null
 */
export const getUserData = () => {
    try {
        if (WebApp && WebApp.initDataUnsafe && WebApp.initDataUnsafe.user) {
            return WebApp.initDataUnsafe.user;
        }
        return null;
    } catch (error) {
        console.warn('Failed to get user data from WebApp:', error);
        return null;
    }
};

/**
 * Получение темы из Telegram WebApp
 * @returns {string} - Тема ('light' или 'dark')
 */
export const getWebAppTheme = () => {
    try {
        if (WebApp && WebApp.colorScheme) {
            return WebApp.colorScheme;
        }
        // Резервный метод для определения темы
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    } catch (error) {
        console.warn('Failed to determine WebApp theme:', error);
        return 'light';
    }
};

/**
 * Безопасно вызывает метод hapticFeedback (для pull-to-refresh)
 * @param {Function} callback Функция для выполнения
 */
export const performPullToRefresh = async (callback) => {
    try {
        // Тактильная обратная связь
        safeHapticFeedback('impact', 'light');

        // Выполняем переданную функцию
        await callback();

        // Вибрация при успешном выполнении
        safeHapticFeedback('notification', null, 'success');

        return true;
    } catch (error) {
        console.warn(`Ошибка при выполнении pull-to-refresh: ${error.message}`);

        // Вибрация при ошибке
        safeHapticFeedback('notification', null, 'error');

        return false;
    }
};
