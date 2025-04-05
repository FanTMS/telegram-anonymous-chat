/**
 * Утилита для работы с данными пользователя в localStorage
 */

const USER_STORAGE_KEY = 'registeredUser';

/**
 * Сохраняет данные пользователя в localStorage
 * @param {Object} userData - Данные пользователя для сохранения
 * @returns {boolean} - Успешно ли сохранены данные
 */
export const saveUser = (userData) => {
    if (!userData) return false;
    
    try {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
        return true;
    } catch (error) {
        console.error('Ошибка при сохранении данных пользователя:', error);
        return false;
    }
};

/**
 * Получает данные пользователя из localStorage
 * @returns {Object|null} - Данные пользователя или null при отсутствии/ошибке
 */
export const getUser = () => {
    try {
        const userData = localStorage.getItem(USER_STORAGE_KEY);
        return userData ? JSON.parse(userData) : null;
    } catch (error) {
        console.error('Ошибка при получении данных пользователя:', error);
        return null;
    }
};

/**
 * Проверяет, авторизован ли пользователь
 * @returns {boolean} - true, если пользователь авторизован
 */
export const isUserLoggedIn = () => {
    return !!localStorage.getItem(USER_STORAGE_KEY);
};

/**
 * Удаляет данные пользователя из localStorage (разлогин)
 */
export const clearUser = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
};
