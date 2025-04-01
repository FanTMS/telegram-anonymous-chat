import WebApp from '@twa-dev/sdk';

/**
 * Получает данные пользователя Telegram
 * @returns {Object|null} - Данные пользователя Telegram или null
 */
export const getTelegramUser = () => {
    try {
        const user = WebApp.initDataUnsafe.user;
        return user || null;
    } catch (error) {
        console.error("Ошибка при получении данных пользователя Telegram:", error);
        return null;
    }
};

/**
 * Проверяет валидность полученных данных Telegram
 * @returns {boolean} - true если данные валидны, false в противном случае
 */
export const isTelegramInitDataValid = () => {
    try {
        // Проверяем наличие базовых полей в данных инициализации
        return !!WebApp.initData && !!WebApp.initDataUnsafe;
    } catch (error) {
        console.error("Ошибка при проверке данных инициализации Telegram:", error);
        return false;
    }
};
