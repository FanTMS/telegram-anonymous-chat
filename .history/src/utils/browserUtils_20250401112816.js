/**
 * Утилиты для безопасной работы с браузерным API
 * Помогает избежать ошибок во время сборки и серверного рендеринга
 */

/**
 * Проверяет запущено ли приложение в браузерной среде
 * @returns {boolean} true если код выполняется в браузере
 */
export const isBrowser = () => {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
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
