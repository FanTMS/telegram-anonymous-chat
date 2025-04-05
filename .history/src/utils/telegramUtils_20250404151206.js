import WebApp from '@twa-dev/sdk';

/**
 * Получает данные пользователя из Telegram WebApp
 * @returns {Object|null} Данные пользователя или null
 */
export const getTelegramUser = () => {
    try {
        if (WebApp && WebApp.initDataUnsafe && WebApp.initDataUnsafe.user) {
            return WebApp.initDataUnsafe.user;
        }
        return null;
    } catch (error) {
        console.warn('Failed to get Telegram user data:', error);
        return null;
    }
};

/**
 * Проверяет валидность initData из Telegram WebApp
 * @returns {boolean} Результат проверки
 */
export const isTelegramInitDataValid = () => {
    try {
        return !!WebApp && !!WebApp.initData && WebApp.initData.length > 0;
    } catch (error) {
        return false;
    }
};

/**
 * Безопасный вызов Telegram HapticFeedback
 * @param {string} type - Тип обратной связи ('impact', 'notification', 'selection')
 * @param {string} style - Стиль для impact ('light', 'medium', 'heavy')
 * @param {string} type - Тип для notification ('success', 'warning', 'error')
 * @returns {boolean} Результат операции
 */
export const safeHapticFeedback = (type, style, notificationType) => {
    try {
        if (!WebApp || !WebApp.HapticFeedback) return false;

        switch (type) {
            case 'impact':
                if (WebApp.HapticFeedback.impactOccurred) {
                    WebApp.HapticFeedback.impactOccurred(style || 'medium');
                    return true;
                }
                break;
            case 'notification':
                if (WebApp.HapticFeedback.notificationOccurred) {
                    WebApp.HapticFeedback.notificationOccurred(notificationType || 'success');
                    return true;
                }
                break;
            case 'selection':
                if (WebApp.HapticFeedback.selectionChanged) {
                    WebApp.HapticFeedback.selectionChanged();
                    return true;
                }
                break;
            default:
                return false;
        }

        return false;
    } catch (error) {
        console.warn('Error using haptic feedback:', error);
        return false;
    }
};

/**
 * Безопасный вызов Telegram Popup
 * @param {Object} params - Параметры для popup
 * @returns {Promise<Object|null>} Результат операции
 */
export const safeShowPopup = async (params) => {
    return new Promise((resolve) => {
        try {
            if (!WebApp || !WebApp.showPopup) {
                alert(params.message || '');
                resolve(null);
                return;
            }

            WebApp.showPopup(params, resolve);
        } catch (error) {
            console.warn('Error showing popup:', error);
            alert(params.message || '');
            resolve(null);
        }
    });
};
