import { db } from './firebase';
import {
    doc,
    getDoc,
    updateDoc,
    setDoc,
    increment
} from 'firebase/firestore';

/**
 * Получение статистики пользователя
 * @param {string} userId - ID пользователя
 * @returns {Promise<Object>} - Объект со статистикой
 */
export const getUserStatistics = async (userId) => {
    try {
        // Получаем документ со статистикой пользователя
        const statsRef = doc(db, "userStats", userId);
        const statsDoc = await getDoc(statsRef);

        if (statsDoc.exists()) {
            return statsDoc.data();
        } else {
            // Если статистики нет, возвращаем пустую статистику
            return {
                totalChats: 0,
                completedChats: 0,
                activeChats: 0,
                totalMessages: 0
            };
        }
    } catch (error) {
        console.error("Ошибка при получении статистики пользователя:", error);
        // Возвращаем пустую статистику в случае ошибки
        return {
            totalChats: 0,
            completedChats: 0,
            activeChats: 0,
            totalMessages: 0
        };
    }
};

/**
 * Инкремент счетчика сообщений пользователя
 * @param {string} userId - ID пользователя
 * @returns {Promise<boolean>} - Результат операции
 */
export const incrementMessagesCount = async (userId) => {
    try {
        const statsRef = doc(db, "userStats", userId);

        // Проверяем, существует ли документ
        const statsDoc = await getDoc(statsRef);

        if (statsDoc.exists()) {
            // Увеличиваем счетчик сообщений
            await updateDoc(statsRef, {
                totalMessages: increment(1),
                lastUpdated: new Date()
            });
        } else {
            // Создаем документ статистики, если его нет
            await setDoc(statsRef, {
                totalChats: 0,
                completedChats: 0,
                activeChats: 0,
                totalMessages: 1,
                lastUpdated: new Date()
            });
        }

        return true;
    } catch (error) {
        console.error("Ошибка при обновлении счетчика сообщений:", error);
        return false;
    }
};

/**
 * Обновление статистики по чатам
 * @param {string} userId - ID пользователя
 * @param {string} action - Действие (created, completed)
 * @returns {Promise<boolean>} - Результат операции
 */
export const updateChatStatistics = async (userId, action) => {
    try {
        const statsRef = doc(db, "userStats", userId);

        // Проверяем, существует ли документ
        const statsDoc = await getDoc(statsRef);

        if (statsDoc.exists()) {
            // Определяем, какие поля обновлять в зависимости от действия
            const updates = { lastUpdated: new Date() };

            if (action === 'created') {
                updates.totalChats = increment(1);
                updates.activeChats = increment(1);
            } else if (action === 'completed') {
                updates.completedChats = increment(1);
                updates.activeChats = increment(-1);
            }

            await updateDoc(statsRef, updates);
        } else {
            // Создаем документ статистики, если его нет
            const newStats = {
                totalChats: action === 'created' ? 1 : 0,
                completedChats: action === 'completed' ? 1 : 0,
                activeChats: action === 'created' ? 1 : 0,
                totalMessages: 0,
                lastUpdated: new Date()
            };

            await setDoc(statsRef, newStats);
        }

        return true;
    } catch (error) {
        console.error("Ошибка при обновлении статистики чатов:", error);
        return false;
    }
};

/**
 * Инкремент счетчика завершенных чатов пользователя
 * @param {string} userId - ID пользователя
 * @returns {Promise<boolean>} - Результат операции
 */
export const incrementCompletedChats = async (userId) => {
    try {
        const statsRef = doc(db, "userStats", userId);

        // Проверяем, существует ли документ
        const statsDoc = await getDoc(statsRef);

        if (statsDoc.exists()) {
            // Увеличиваем счетчик завершенных чатов и уменьшаем счетчик активных
            await updateDoc(statsRef, {
                completedChats: increment(1),
                activeChats: increment(-1),
                lastUpdated: new Date()
            });
        } else {
            // Создаем документ статистики, если его нет
            await setDoc(statsRef, {
                totalChats: 1,
                completedChats: 1,
                activeChats: 0,
                totalMessages: 0,
                lastUpdated: new Date()
            });
        }

        return true;
    } catch (error) {
        console.error("Ошибка при обновлении счетчика завершенных чатов:", error);
        return false;
    }
};

/**
 * Получение общей статистики приложения
 * @returns {Promise<Object>} - Объект с общей статистикой
 */
export const getAppStatistics = async () => {
    try {
        const appStatsRef = doc(db, "statistics", "general");
        const appStatsDoc = await getDoc(appStatsRef);

        if (appStatsDoc.exists()) {
            return appStatsDoc.data();
        } else {
            return {
                totalUsers: 0,
                totalChats: 0,
                totalMessages: 0,
                activeUsers: 0,
                lastUpdated: new Date()
            };
        }
    } catch (error) {
        console.error("Ошибка при получении общей статистики:", error);
        return {
            totalUsers: 0,
            totalChats: 0,
            totalMessages: 0,
            activeUsers: 0,
            lastUpdated: new Date()
        };
    }
};
