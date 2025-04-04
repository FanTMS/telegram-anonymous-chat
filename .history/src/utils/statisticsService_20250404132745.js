import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

/**
 * Получение статистики пользователя
 * @param {string} userId - ID пользователя
 * @returns {Promise<Object>} - Объект статистики пользователя
 */
export const getUserStatistics = async (userId) => {
    try {
        if (!userId) {
            throw new Error('Не указан ID пользователя');
        }

        const statsRef = doc(db, "userStatistics", userId);
        const statsDoc = await getDoc(statsRef);

        if (statsDoc.exists()) {
            return statsDoc.data();
        } else {
            // Если статистики нет, создаём начальную
            const initialStats = {
                totalChats: 0,
                activeChats: 0,
                completedChats: 0,
                totalMessages: 0,
                lastChatTimestamp: null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            await setDoc(statsRef, initialStats);
            return initialStats;
        }
    } catch (error) {
        console.error("Ошибка при получении статистики пользователя:", error);
        return {
            totalChats: 0,
            activeChats: 0,
            completedChats: 0,
            totalMessages: 0,
            lastChatTimestamp: null
        };
    }
};

/**
 * Обновление счётчика общего количества чатов
 * @param {string} userId - ID пользователя
 * @returns {Promise<boolean>} - Результат операции
 */
export const incrementTotalChats = async (userId) => {
    try {
        if (!userId) return false;

        const statsRef = doc(db, "userStatistics", userId);
        const statsDoc = await getDoc(statsRef);

        if (statsDoc.exists()) {
            await updateDoc(statsRef, {
                totalChats: increment(1),
                activeChats: increment(1),
                updatedAt: serverTimestamp(),
                lastChatTimestamp: serverTimestamp()
            });
        } else {
            await setDoc(statsRef, {
                totalChats: 1,
                activeChats: 1,
                completedChats: 0,
                totalMessages: 0,
                lastChatTimestamp: serverTimestamp(),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }
        return true;
    } catch (error) {
        console.error("Ошибка при обновлении счётчика чатов:", error);
        return false;
    }
};

/**
 * Обновление счётчика завершенных чатов
 * @param {string} userId - ID пользователя
 * @returns {Promise<boolean>} - Результат операции
 */
export const incrementCompletedChats = async (userId) => {
    try {
        if (!userId) return false;

        const statsRef = doc(db, "userStatistics", userId);
        await updateDoc(statsRef, {
            completedChats: increment(1),
            activeChats: increment(-1),
            updatedAt: serverTimestamp()
        });

        return true;
    } catch (error) {
        console.error("Ошибка при обновлении счётчика завершенных чатов:", error);
        return false;
    }
};

/**
 * Обновление счётчика сообщений
 * @param {string} userId - ID пользователя
 * @returns {Promise<boolean>} - Результат операции
 */
export const incrementMessagesCount = async (userId) => {
    try {
        if (!userId) return false;

        const statsRef = doc(db, "userStatistics", userId);
        await updateDoc(statsRef, {
            totalMessages: increment(1),
            updatedAt: serverTimestamp()
        });

        return true;
    } catch (error) {
        console.error("Ошибка при обновлении счётчика сообщений:", error);
        return false;
    }
};

/**
 * Получение общей статистики приложения
 * @returns {Promise<Object>} - Объект с общей статистикой
 */
export const getAppStatistics = async () => {
    try {
        const statsRef = doc(db, "appStatistics", "general");
        const statsDoc = await getDoc(statsRef);

        if (statsDoc.exists()) {
            return statsDoc.data();
        } else {
            // Если статистики нет, создаём начальную
            const initialStats = {
                totalUsers: 0,
                activeUsers: 0,
                totalChats: 0,
                activeChats: 0,
                totalMessages: 0,
                updatedAt: serverTimestamp()
            };

            await setDoc(statsRef, initialStats);
            return initialStats;
        }
    } catch (error) {
        console.error("Ошибка при получении общей статистики:", error);
        return {
            totalUsers: 0,
            activeUsers: 0,
            totalChats: 0,
            activeChats: 0,
            totalMessages: 0
        };
    }
};
