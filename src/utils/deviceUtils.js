/**
 * Проверяет, является ли устройство мобильным
 * @returns {boolean} true, если устройство мобильное
 */
export const isMobileDevice = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
    return mobileRegex.test(userAgent.toLowerCase());
};

/**
 * Проверяет, просматривается ли страница в Telegram WebApp
 * @returns {boolean} true, если страница в WebApp
 */
export const isTelegramWebAppAvailable = () => {
    return !!window.Telegram && !!window.Telegram.WebApp;
};

/**
 * Получает текущую ориентацию устройства
 * @returns {string} 'portrait' или 'landscape'
 */
export const getDeviceOrientation = () => {
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
};

/**
 * Добавляет CSS-классы для текущей платформы и ориентации
 */
export const applyDeviceClasses = () => {
    const isMobile = isMobileDevice();
    const isTelegramApp = isTelegramWebAppAvailable();
    const orientation = getDeviceOrientation();

    document.documentElement.classList.toggle('mobile-device', isMobile);
    document.documentElement.classList.toggle('desktop-device', !isMobile);
    document.documentElement.classList.toggle('telegram-webapp', isTelegramApp);
    document.documentElement.classList.toggle('portrait', orientation === 'portrait');
    document.documentElement.classList.toggle('landscape', orientation === 'landscape');
};

/**
 * Слушает изменения ориентации устройства
 * @param {Function} callback Функция, вызываемая при изменении ориентации
 * @returns {Function} Функция для удаления слушателя
 */
export const listenOrientationChanges = (callback) => {
    const handler = () => {
        const orientation = getDeviceOrientation();
        callback(orientation);
        document.documentElement.classList.toggle('portrait', orientation === 'portrait');
        document.documentElement.classList.toggle('landscape', orientation === 'landscape');
    };

    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
};
