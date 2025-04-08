import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// Ключ для хранения идентификатора пользователя в sessionStorage
const USER_ID_KEY = 'tg_chat_user_id';

/**
 * Сохраняет ID пользователя в sessionStorage
 * @param {string} userId - ID пользователя
 */
export const saveUserSession = (userId) => {
    try {
        sessionStorage.setItem(USER_ID_KEY, userId);
        console.log('Сессия пользователя сохранена:', userId);
    } catch (error) {
        console.error('Ошибка при сохранении сессии пользователя:', error);
    }
};

/**
 * Получает ID пользователя из sessionStorage
 * @returns {string|null} ID пользователя или null
 */
export const getUserSession = () => {
    try {
        return sessionStorage.getItem(USER_ID_KEY);
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
        sessionStorage.removeItem(USER_ID_KEY);
        console.log('Сессия пользователя очищена');
    } catch (error) {
        console.error('Ошибка при очистке сессии пользователя:', error);
    }
};

/**
 * Получение пользователя по ID
 * @param {string} userId - ID пользователя
 * @returns {Promise<object|null>} - Данные пользователя или null
 */
export const getUserById = async (userId) => {
    try {
        if (!userId) {
            console.error('getUserById: ID пользователя не указан');
            return null;
        }

        console.log('Запрос пользователя с ID:', userId);

        // Проверяем сначала в sessionStorage (для кэширования)
        const savedUserData = sessionStorage.getItem('current_user');
        const savedUserId = sessionStorage.getItem('current_user_id');

        if (savedUserId === userId && savedUserData) {
            try {
                const localUser = JSON.parse(savedUserData);
                console.log('Найден пользователь в sessionStorage:', localUser);
                return localUser;
            } catch (e) {
                console.error('Ошибка при парсинге данных пользователя из sessionStorage:', e);
            }
        }

        // Если в sessionStorage не найден, ищем в Firestore
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = { id: userSnap.id, ...userSnap.data() };
            console.log('Найден пользователь в Firestore:', userData);

            // Сохраняем в sessionStorage для кэширования
            sessionStorage.setItem('current_user', JSON.stringify(userData));
            sessionStorage.setItem('current_user_id', userData.id);

            return userData;
        } else {
            console.error(`Пользователь с ID ${userId} не найден в Firestore`);
            return null;
        }
    } catch (error) {
        console.error('Ошибка при получении пользователя:', error);
        return null;
    }
};

/**
 * Сохранение пользователя в базу данных
 * @param {object} userData - Данные пользователя
 * @returns {Promise<boolean>} - Результат сохранения
 */
export const saveUser = async (userData) => {
    try {
        if (!userData || !userData.id) {
            console.error('saveUser: Некорректные данные пользователя', userData);
            return false;
        }

        console.log('Сохранение пользователя:', userData);

        // Добавляем метку времени обновления
        const userDataWithTimestamp = {
            ...userData,
            lastUpdated: serverTimestamp()
        };

        // Удаляем id из данных, так как он используется как ключ документа
        const { id, ...dataToSave } = userDataWithTimestamp;

        // Сохраняем в Firestore
        await setDoc(doc(db, 'users', id), dataToSave);

        // Сохраняем в sessionStorage
        sessionStorage.setItem('current_user', JSON.stringify(userData));
        sessionStorage.setItem('current_user_id', id);

        console.log('Пользователь успешно сохранен');
        return true;
    } catch (error) {
        console.error('Ошибка при сохранении пользователя:', error);
        return false;
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
