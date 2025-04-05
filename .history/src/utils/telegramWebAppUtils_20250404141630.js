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
 * Безопасно вызывает HapticFeedback метод с проверкой на доступность
 * @param {string} feedbackType Тип обратной связи ('impact', 'notification', 'selection')
 * @param {string} intensity Интенсивность для impact ('light', 'medium', 'heavy', 'rigid', 'soft')
 * @param {string} notificationType Тип уведомления ('success', 'warning', 'error')
 */
export const safeHapticFeedback = (feedbackType, intensity = 'medium', notificationType = 'success') => {
    try {
        if (!WebApp || !WebApp.HapticFeedback) return;

        switch (feedbackType) {
            case 'impact':
                if (typeof WebApp.HapticFeedback.impactOccurred === 'function') {
                    WebApp.HapticFeedback.impactOccurred(intensity);
                }
                break;
            case 'notification':
                if (typeof WebApp.HapticFeedback.notificationOccurred === 'function') {
                    WebApp.HapticFeedback.notificationOccurred(notificationType);
                }
                break;
            case 'selection':
                if (typeof WebApp.HapticFeedback.selectionChanged === 'function') {
                    WebApp.HapticFeedback.selectionChanged();
                }
                break;
            default:
                if (typeof WebApp.HapticFeedback.impactOccurred === 'function') {
                    WebApp.HapticFeedback.impactOccurred('medium');
                }
        }
    } catch (error) {
        console.warn(`Ошибка при использовании HapticFeedback: ${error.message}`);
    }
};

/**
 * Безопасно показывает всплывающее окно с проверкой на доступность
 * @param {object} options Опции для всплывающего окна
 * @returns {Promise<any>} Результат вызова или null в случае ошибки
 */
export const safeShowPopup = async (options) => {
    try {
        if (WebApp && typeof WebApp.showPopup === 'function') {
            return WebApp.showPopup(options);
        }
        // Запасной вариант - используем обычный alert
        alert(`${options.title}\n\n${options.message}`);
        return null;
    } catch (error) {
        console.warn(`Ошибка при показе всплывающего окна: ${error.message}`);
        alert(`${options.title}\n\n${options.message}`);
        return null;
    }
};

/**
 * Проверяет, поддерживается ли метод WebApp
 * @param {string} methodPath Путь к методу (например, 'HapticFeedback.impactOccurred')
 * @returns {boolean} true если метод поддерживается
 */
export const isWebAppMethodSupported = (methodPath) => {
    try {
        if (!WebApp) return false;

        const pathParts = methodPath.split('.');
        let currentObj = WebApp;

        for (const part of pathParts) {
            if (!currentObj[part]) return false;
            currentObj = currentObj[part];
        }

        return typeof currentObj === 'function';
    } catch (error) {
        return false;
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
