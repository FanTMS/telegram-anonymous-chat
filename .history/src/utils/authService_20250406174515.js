import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

// Ключ для хранения идентификатора пользователя в localStorage
const USER_ID_KEY = 'tg_chat_user_id';

/**
 * Сохраняет ID пользователя в localStorage
 * @param {string} userId - ID пользователя
 */
export const saveUserSession = (userId) => {
    try {
        localStorage.setItem(USER_ID_KEY, userId);
        console.log('Сессия пользователя сохранена:', userId);
    } catch (error) {
        console.error('Ошибка при сохранении сессии пользователя:', error);
    }
};

/**
 * Получает ID пользователя из localStorage
 * @returns {string|null} ID пользователя или null
 */
export const getUserSession = () => {
    try {
        return localStorage.getItem(USER_ID_KEY);
    } catch (error) {
        console.error('Ошибка при получении сессии пользователя:', error);
        return null;
    }
};

/**
 * Очищает сессию пользователя
 */
export const clearUserSession = () => {
    try {
        localStorage.removeItem(USER_ID_KEY);
        console.log('Сессия пользователя очищена');
    } catch (error) {
        console.error('Ошибка при очистке сессии пользователя:', error);
    }
};

/**
 * Получает данные пользователя из Firestore по ID
 * @param {string} userId - ID пользователя
 * @returns {Promise<Object|null>} - Данные пользователя или null
 */
export const getUserById = async (userId) => {
    if (!userId) return null;

    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            return {
                id: userDoc.id,
                ...userDoc.data()
            };
        }

        return null;
    } catch (error) {
        console.error('Ошибка при получении данных пользователя:', error);
        return null;
    }
};

/**
 * Обновляет или создает данные пользователя в Firestore
 * @param {string} userId - ID пользователя
 * @param {Object} userData - Данные пользователя
 * @returns {Promise<boolean>} - Результат операции
 */
export const updateUserData = async (userId, userData) => {
    if (!userId) return false;

    try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, userData, { merge: true });
        return true;
    } catch (error) {
        console.error('Ошибка при обновлении данных пользователя:', error);
        return false;
    }
};
