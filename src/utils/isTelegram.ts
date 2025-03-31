/**
 * Утилиты для определения среды запуска приложения
 */

/**
 * Проверяет, запущено ли приложение в Telegram
 * @returns {boolean} true если запущено в Telegram
 */
export function isTelegram(): boolean {
    try {
        // Проверяем наличие объекта Telegram.WebApp
        const hasTelegramWebApp =
            typeof window !== 'undefined' &&
            window.Telegram !== undefined &&
            window.Telegram.WebApp !== undefined;

        // Проверяем, есть ли initData (подтверждает, что это запуск в Telegram)
        if (hasTelegramWebApp) {
            const webApp = window.Telegram.WebApp;
            // Если есть initData или initDataUnsafe, это точно Telegram
            return Boolean(webApp.initData) || Boolean(webApp.initDataUnsafe);
        }

        return false;
    } catch (e) {
        console.error('Ошибка при проверке Telegram:', e);
        return false;
    }
}

/**
 * Проверяет, запущено ли приложение в мобильном Telegram
 * @returns {boolean} true если запущено в мобильном Telegram
 */
export function isMobileTelegram(): boolean {
    if (!isTelegram()) return false;

    try {
        const ua = navigator.userAgent || '';
        return ua.includes('Android') || ua.includes('iPhone') || ua.includes('iPad') || ua.includes('Mobile');
    } catch (e) {
        return false;
    }
}

/**
 * Проверяет, запущено ли приложение в десктопной версии Telegram
 * @returns {boolean} true если запущено в десктопном Telegram
 */
export function isDesktopTelegram(): boolean {
    return isTelegram() && !isMobileTelegram();
}

export default {
    isTelegram,
    isMobileTelegram,
    isDesktopTelegram
};
