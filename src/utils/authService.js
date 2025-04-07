import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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

        // Проверяем сначала в localStorage (для оффлайн-режима и кэширования)
        const savedUserData = localStorage.getItem('current_user');
        const savedUserId = localStorage.getItem('current_user_id');

        if (savedUserId === userId && savedUserData) {
            try {
                const localUser = JSON.parse(savedUserData);
                console.log('Найден пользователь в localStorage:', localUser);
                return localUser;
            } catch (e) {
                console.error('Ошибка при парсинге данных пользователя из localStorage:', e);
            }
        }

        // Если в localStorage не найден, ищем в Firestore
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            const userData = { id: userSnap.id, ...userSnap.data() };
            console.log('Найден пользователь в Firestore:', userData);

            // Сохраняем в localStorage для доступности оффлайн
            localStorage.setItem('current_user', JSON.stringify(userData));
            localStorage.setItem('current_user_id', userData.id);

            return userData;
        } else {
            console.error(`Пользователь с ID ${userId} не найден в Firestore`);

            // Попробуем найти пользователя по другим полям (например, по telegramId)
            if (localStorage.getItem('current_user')) {
                const localUserData = JSON.parse(localStorage.getItem('current_user'));
                console.log('Используем данные из localStorage после неудачного поиска в Firestore:', localUserData);

                // Попытка синхронизировать данные с Firestore
                try {
                    await setDoc(doc(db, 'users', userId), {
                        ...localUserData,
                        lastUpdated: serverTimestamp(),
                        lastSynced: new Date().toISOString()
                    });
                    console.log('Пользователь синхронизирован с Firestore');
                    return { id: userId, ...localUserData };
                } catch (syncError) {
                    console.error('Ошибка при синхронизации с Firestore:', syncError);
                    return { id: userId, ...localUserData, _needsSync: true };
                }
            }

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

        // Сохраняем в localStorage
        localStorage.setItem('current_user', JSON.stringify(userData));
        localStorage.setItem('current_user_id', id);

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
