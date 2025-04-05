import { db } from '../firebase';
import { doc, setDoc, getDoc, collection, getDocs, query, where, updateDoc, serverTimestamp } from 'firebase/firestore';
import { troubleshootCollection } from '../utils/firebaseUtils';
import { sanitizeData } from '../utils/firebaseUtils';

/**
 * Сервис для работы с коллекцией пользователей
 */
export const UsersService = {
    /**
     * Создать нового пользователя с прямой записью в базу данных
     * @param {string} userId - ID пользователя
     * @param {object} userData - Данные пользователя
     */
    createUser: async (userId, userData) => {
        console.log(`Создание пользователя с ID: ${userId}`);

        try {
            // Проверка коллекции перед записью
            await troubleshootCollection('users');

            // Обогащаем данные пользователя и очищаем от undefined
            const enrichedUserData = sanitizeData({
                ...userData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                lastActive: serverTimestamp()
            });

            // Создаем документ напрямую
            const userDocRef = doc(db, 'users', userId);
            await setDoc(userDocRef, enrichedUserData);

            console.log(`Пользователь ${userId} успешно создан`);
            return { id: userId, ...enrichedUserData };
        } catch (error) {
            console.error(`Ошибка при создании пользователя ${userId}:`, error);

            // Пробуем диагностировать и исправить проблему
            const diagnostics = await troubleshootCollection('users');
            console.log("Результат диагностики:", diagnostics);

            // Если диагностика прошла успешно, пробуем еще раз
            if (diagnostics.exists || diagnostics.created) {
                console.log("Повторная попытка создания пользователя после диагностики...");

                // Очищаем данные от undefined значений
                const cleanUserData = sanitizeData({
                    ...userData,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    lastActive: serverTimestamp()
                });

                // Создаем документ напрямую второй раз
                const userDocRef = doc(db, 'users', userId);
                await setDoc(userDocRef, cleanUserData);

                return { id: userId, ...cleanUserData };
            }

            throw new Error(`Не удалось создать пользователя: ${error.message}`);
        }
    },

    /**
     * Получить пользователя по ID
     * @param {string} userId - ID пользователя
     */
    getUserById: async (userId) => {
        try {
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                return { id: userId, ...userDoc.data() };
            }
            return null;
        } catch (error) {
            console.error(`Ошибка при получении пользователя ${userId}:`, error);
            return null;
        }
    },

    /**
     * Поиск пользователя по Telegram ID
     * @param {string} telegramId - Telegram ID пользователя
     */
    getUserByTelegramId: async (telegramId) => {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('telegramId', '==', telegramId));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                return { id: doc.id, ...doc.data() };
            }
            return null;
        } catch (error) {
            console.error(`Ошибка при поиске пользователя по Telegram ID ${telegramId}:`, error);
            return null;
        }
    }
};

export default UsersService;
