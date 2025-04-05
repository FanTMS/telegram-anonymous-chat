import WebApp from '@twa-dev/sdk';

/**
 * Обновляет цветовые переменные CSS в соответствии с темой Telegram
 */
export const updateTelegramThemeVars = () => {
    try {
        // Устанавливаем переменные темы в :root
        document.documentElement.style.setProperty('--tg-theme-bg-color', WebApp.backgroundColor || '#ffffff');
        document.documentElement.style.setProperty('--tg-theme-text-color', WebApp.textColor || '#222222');
        document.documentElement.style.setProperty('--tg-theme-hint-color', WebApp.subtitleColor || '#999999');
        document.documentElement.style.setProperty('--tg-theme-link-color', WebApp.linkColor || '#2481cc');
        document.documentElement.style.setProperty('--tg-theme-button-color', WebApp.buttonColor || '#3390ec');
        document.documentElement.style.setProperty('--tg-theme-button-text-color', WebApp.buttonTextColor || '#ffffff');
        document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', WebApp.secondaryBackgroundColor || '#f5f5f5');

        // Устанавливаем data-attribute для более удобного выбора в CSS
        document.documentElement.setAttribute('data-theme', WebApp.colorScheme || 'light');

        // Добавляем безопасную область для iOS устройств
        document.documentElement.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top, 0px)');
        document.documentElement.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom, 0px)');
        document.documentElement.style.setProperty('--safe-area-inset-left', 'env(safe-area-inset-left, 0px)');
        document.documentElement.style.setProperty('--safe-area-inset-right', 'env(safe-area-inset-right, 0px)');

    } catch (error) {
        console.warn('Ошибка при настройке темы Telegram:', error);
    }
};

/**
 * Проверяет поддержку тёмной темы
 * @returns {boolean} Поддерживается ли тёмная тема
 */
export const isDarkTheme = () => {
    try {
        return WebApp.colorScheme === 'dark';
    } catch (error) {
        // Фолбэк на системные предпочтения
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
};

/**
 * Добавляет слушатель изменений темы Telegram
 * @param {Function} callback Функция, вызываемая при изменении темы
 */
export const addThemeChangeListener = (callback) => {
    try {
        if (WebApp.onEvent) {
            WebApp.onEvent('themeChanged', () => {
                updateTelegramThemeVars();
                if (typeof callback === 'function') callback(WebApp.colorScheme);
            });
        }
    } catch (error) {
        console.warn('Ошибка при добавлении обработчика изменения темы:', error);
    }
};
