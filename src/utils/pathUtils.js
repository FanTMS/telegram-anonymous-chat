/**
 * Вспомогательные функции для работы с путями в приложении
 */

/**
 * Получает публичный URL для статических ресурсов
 * @param {string} path - Относительный путь к ресурсу
 * @returns {string} - Абсолютный путь к ресурсу
 */
export const getPublicUrl = (path) => {
    const publicUrl = process.env.PUBLIC_URL || '';
    return `${publicUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

/**
 * Получает URL для навигации между страницами
 * @param {string} path - Относительный путь к странице
 * @returns {string} - Правильно сформированный путь для react-router
 */
export const getAppUrl = (path) => {
    // Для Router с basename мы не добавляем PUBLIC_URL
    return path.startsWith('/') ? path : `/${path}`;
};
