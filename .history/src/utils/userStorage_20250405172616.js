/**
 * Утилиты для работы с данными пользователя в локальном хранилище
 */

// Ключ для хранения данных пользователя в localStorage
const USER_STORAGE_KEY = 'registeredUser';

/**
 * Сохраняет данные пользователя в localStorage
 * @param {Object} userData - Данные пользователя для сохранения
 */
export const saveUserData = (userData) => {
    if (!userData) return;
    
    try {
        const userDataString = JSON.stringify(userData);
        localStorage.setItem(USER_STORAGE_KEY, userDataString);
        console.log('Данные пользователя сохранены в localStorage');
    } catch (error) {
        console.error('Ошибка при сохранении данных пользователя:', error);
    }
};

/**
 * Получает данные пользователя из localStorage
 * @returns {Object|null} Данные пользователя или null, если данные не найдены
 */
export const getUserData = () => {
    try {
        const userDataString = localStorage.getItem(USER_STORAGE_KEY);
        if (!userDataString) return null;
        
        return JSON.parse(userDataString);
    } catch (error) {
        console.error('Ошибка при получении данных пользователя:', error);
        return null;
    }
};

/**
 * Очищает данные пользователя из localStorage
 */
export const clearUserData = () => {
    try {
        localStorage.removeItem(USER_STORAGE_KEY);
        console.log('Данные пользователя удалены из localStorage');
    } catch (error) {
        console.error('Ошибка при удалении данных пользователя:', error);
    }
};

/**
 * Проверяет, есть ли данные пользователя в localStorage
 * @returns {boolean} true, если данные пользователя есть, иначе false
 */
export const isUserLoggedIn = () => {
    return !!getUserData();
};

/**
 * Обновляет данные пользователя в localStorage
 * @param {Object} newData - Новые данные пользователя (будут объединены с существующими)
 */
export const updateUserData = (newData) => {
    if (!newData) return;
    
    try {
        const existingData = getUserData() || {};
        const updatedData = { ...existingData, ...newData };
        saveUserData(updatedData);
    } catch (error) {
        console.error('Ошибка при обновлении данных пользователя:', error);
    }
};
