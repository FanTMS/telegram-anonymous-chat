/**
 * Утилиты для безопасной работы с браузерным API
 * Помогает избежать ошибок во время сборки и серверного рендеринга
 */

/**
 * Проверяет, является ли текущая среда браузером
 * @returns {boolean} - true, если код выполняется в браузере
 */
export const isBrowser = () => {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined';
};

/**
 * Проверяет доступность объекта WebApp
 * @returns {boolean} - true если WebApp определен и инициализирован
 */
export const isWebAppAvailable = () => {
  try {
    return isBrowser() && window.Telegram && window.Telegram.WebApp;
  } catch (e) {
    console.warn('Ошибка при проверке доступности WebApp:', e);
    return false;
  }
};

/**
 * Проверяет совместимость браузера с основными требуемыми функциями
 * @returns {boolean} true если браузер совместим
 */
export const checkBrowserCompatibility = () => {
    if (!isBrowser()) return true;

    try {
        // Проверка базовых современных функций
        const isCompatible =
            typeof document.querySelector === 'function' &&
            typeof window.localStorage !== 'undefined' &&
            typeof window.addEventListener === 'function';

        return isCompatible;
    } catch (error) {
        console.warn("Ошибка при проверке совместимости браузера:", error);
        return true;
    }
};

/**
 * Безопасно выполняет функцию только в браузерной среде
 * @param {Function} callback Функция для выполнения
 * @param {any} fallbackValue Значение по умолчанию, если не браузерная среда
 * @returns {any} Результат выполнения функции или fallbackValue
 */
export const safelyRunInBrowser = (callback, fallbackValue = null) => {
    if (!isBrowser()) return fallbackValue;

    try {
        return callback();
    } catch (error) {
        console.warn("Ошибка при выполнении функции в браузере:", error);
        return fallbackValue;
    }
};
