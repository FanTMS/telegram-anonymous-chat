import WebApp from '@twa-dev/sdk';

/**
 * Утилиты для взаимодействия с Telegram Web App
 */

/**
 * Проверяет, запущено ли приложение внутри Telegram
 */
export const isTelegramApp = () => {
    return window.Telegram && window.Telegram.WebApp;
};

/**
 * Получает экземпляр Telegram WebApp API
 */
export const getTelegramWebApp = () => {
    if (isTelegramApp()) {
        return window.Telegram.WebApp;
    }
    return null;
};

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
 * Выполняет хаптическую обратную связь (вибрацию)
 * @param {string} type - тип обратной связи ('impact', 'notification', 'selection')
 */
export const triggerHapticFeedback = (type = 'impact') => {
    const webApp = getTelegramWebApp();
    if (webApp && webApp.HapticFeedback) {
        try {
            switch (type) {
                case 'impact':
                    webApp.HapticFeedback.impactOccurred('medium');
                    break;
                case 'notification':
                    webApp.HapticFeedback.notificationOccurred('success');
                    break;
                case 'selection':
                    webApp.HapticFeedback.selectionChanged();
                    break;
                default:
                    webApp.HapticFeedback.impactOccurred('medium');
            }
        } catch (error) {
            console.warn('Haptic feedback error:', error);
        }
    }
};

/**
 * Безопасный вызов тактильной обратной связи
 * @param {string} type - Тип тактильной обратной связи ('impact', 'notification', 'selection')
 * @param {string|null} style - Интенсивность для impact ('light', 'medium', 'heavy', 'rigid', 'soft')
 * @param {string|null} notificationType - Тип уведомления ('success', 'warning', 'error')
 * @returns {boolean} Результат операции
 */
export const safeHapticFeedback = (type, style = null, notificationType = null) => {
    try {
        const WebApp = getTelegramWebApp();
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
                console.warn('Unknown haptic feedback type:', type);
        }
    } catch (error) {
        console.warn('Haptic feedback failed:', error);
    }
    return false;
};

/**
 * Адаптирует стили приложения под цветовую схему Telegram
 */
export const adaptToTelegramTheme = () => {
    const webApp = getTelegramWebApp();
    if (webApp) {
        document.body.classList.add('telegram-app');

        // Добавляем переменные с цветами темы Telegram в корневой элемент CSS
        const root = document.documentElement;
        if (webApp.themeParams) {
            Object.entries(webApp.themeParams).forEach(([key, value]) => {
                root.style.setProperty(`--tg-theme-${key}`, value);
            });
        }
    }
};

/**
 * Настраивает кнопку главной панели Telegram
 * @param {string} text - текст кнопки
 * @param {Function} onClick - обработчик нажатия
 */
export const setupMainButton = (text, onClick) => {
    const webApp = getTelegramWebApp();
    if (webApp && webApp.MainButton) {
        webApp.MainButton.setText(text);
        webApp.MainButton.onClick(onClick);

        // Подстраиваем цвета под тему, если они не установлены Telegram
        if (!webApp.MainButton.isVisible) {
            webApp.MainButton.show();
        }
    }
};

/**
 * Скрывает главную кнопку Telegram
 */
export const hideMainButton = () => {
    const webApp = getTelegramWebApp();
    if (webApp && webApp.MainButton && webApp.MainButton.isVisible) {
        webApp.MainButton.hide();
    }
};

/**
 * Показывает всплывающее уведомление в Telegram
 * @param {string} message - текст уведомления
 */
export const showTelegramPopup = (message) => {
    const webApp = getTelegramWebApp();
    if (webApp && webApp.showPopup) {
        webApp.showPopup({
            title: 'Уведомление',
            message: message,
            buttons: [{ type: 'ok' }]
        });
    }
};

/**
 * Инициализирует приложение для Telegram
 * Вызывайте эту функцию при запуске приложения
 */
export const initTelegramApp = () => {
    const webApp = getTelegramWebApp();
    if (webApp) {
        adaptToTelegramTheme();

        // Расширяем область для отображения веб-приложения на весь экран
        webApp.expand();

        // Готовность приложения к работе
        webApp.ready();
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
