import WebApp from '@twa-dev/sdk';

// Функция для безопасной инициализации Telegram WebApp
export const initTelegramApp = () => {
    try {
        // Проверяем, что мы находимся в контексте Telegram WebApp
        if (WebApp.initData) {
            // Инициализация успешна
            return WebApp;
        }
        // Если не в Telegram WebApp, возвращаем заглушку
        return {
            isSupported: false,
            ready: () => { },
            expand: () => { },
            MainButton: {
                show: () => { },
                hide: () => { },
                setText: () => { },
                onClick: () => { }
            }
        };
    } catch (error) {
        console.error('Ошибка при инициализации Telegram WebApp:', error);
        // Возвращаем заглушку в случае ошибки
        return {
            isSupported: false,
            ready: () => { },
            expand: () => { },
            MainButton: {
                show: () => { },
                hide: () => { },
                setText: () => { },
                onClick: () => { }
            }
        };
    }
};

// Экспортируем экземпляр для использования в компонентах
export const telegramApp = initTelegramApp();
