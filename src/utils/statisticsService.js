import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, increment, serverTimestamp, collection, getDocs, query, where } from 'firebase/firestore';

/**
 * Убедиться, что документ статистики существует для пользователя
 * @param {string} userId - ID пользователя
 */
const ensureStatisticsDocumentExists = async (userId) => {
    try {
        if (!userId) return false;

        const statsRef = doc(db, "statistics", userId);
        const statsDoc = await getDoc(statsRef);

        if (!statsDoc.exists()) {
            // Создаем базовый документ статистики для пользователя
            await setDoc(statsRef, {
                userId,
                totalChats: 0,
                totalMessages: 0,
                activeChats: 0,
                lastActivity: serverTimestamp(),
                createdAt: serverTimestamp(),
                chatsStarted: 0,
                chatsCompleted: 0,
                averageMessagesPerChat: 0,
                averageChatDuration: 0
            });
            console.log(`Создан документ статистики для пользователя ${userId}`);
            return true;
        }

        return true;
    } catch (error) {
        console.error(`Ошибка при проверке/создании документа статистики:`, error);
        return false;
    }
};

/**
 * Обновить статистику при начале нового чата
 * @param {string} userId - ID пользователя
 */
export const updateChatStartStatistics = async (userId) => {
    try {
        if (!userId) return false;

        // Убедимся что документ статистики существует
        await ensureStatisticsDocumentExists(userId);

        const statsRef = doc(db, "statistics", userId);
        await updateDoc(statsRef, {
            totalChats: increment(1),
            activeChats: increment(1),
            chatsStarted: increment(1),
            lastActivity: serverTimestamp()
        });

        return true;
    } catch (error) {
        console.error("Ошибка при обновлении статистики начала чата:", error);
        return false;
    }
};

/**
 * Обновить статистику при отправке сообщения
 * @param {string} userId - ID пользователя
 * @param {string} chatId - ID чата
 */
export const updateMessageStatistics = async (userId, chatId) => {
    try {
        if (!userId) return false;

        // Убедимся что документ статистики существует
        await ensureStatisticsDocumentExists(userId);

        const statsRef = doc(db, "statistics", userId);
        await updateDoc(statsRef, {
            totalMessages: increment(1),
            lastActivity: serverTimestamp()
        });

        return true;
    } catch (error) {
        console.error("Ошибка при обновлении статистики сообщений:", error);
        return false;
    }
};

/**
 * Обновить статистику при завершении чата
 * @param {string} userId - ID пользователя
 * @param {string} chatId - ID чата
 * @param {number} messageCount - Количество сообщений в чате
 * @param {number} durationMinutes - Продолжительность чата в минутах
 */
export const updateChatEndStatistics = async (userId, chatId, messageCount = 0, durationMinutes = 0) => {
    try {
        if (!userId) return false;

        // Убедимся что документ статистики существует
        await ensureStatisticsDocumentExists(userId);

        const statsRef = doc(db, "statistics", userId);

        // Получаем текущие данные для расчета средних значений
        const statsDoc = await getDoc(statsRef);
        const statsData = statsDoc.exists() ? statsDoc.data() : {
            chatsCompleted: 0,
            averageMessagesPerChat: 0,
            averageChatDuration: 0
        };

        // Рассчитываем новые средние значения
        const totalCompletedChats = statsData.chatsCompleted + 1;
        const newAvgMessages = (statsData.averageMessagesPerChat * statsData.chatsCompleted + messageCount) / totalCompletedChats;
        const newAvgDuration = (statsData.averageChatDuration * statsData.chatsCompleted + durationMinutes) / totalCompletedChats;

        await updateDoc(statsRef, {
            activeChats: increment(-1),
            chatsCompleted: increment(1),
            averageMessagesPerChat: newAvgMessages,
            averageChatDuration: newAvgDuration,
            lastActivity: serverTimestamp()
        });

        return true;
    } catch (error) {
        console.error("Ошибка при обновлении статистики завершения чата:", error);
        return false;
    }
};

/**
 * Получить статистику пользователя
 * @param {string} userId - ID пользователя
 * @returns {Promise<object|null>} - Объект статистики или null при ошибке
 */
export const getUserStatistics = async (userId) => {
    try {
        if (!userId) return null;

        // Убедимся что документ статистики существует
        await ensureStatisticsDocumentExists(userId);

        const statsRef = doc(db, "statistics", userId);
        const statsDoc = await getDoc(statsRef);

        if (statsDoc.exists()) {
            return { id: statsDoc.id, ...statsDoc.data() };
        }

        return null;
    } catch (error) {
        console.error("Ошибка при получении статистики пользователя:", error);
        return null;
    }
};

/**
 * Получение общей статистики приложения
 * @returns {Promise<object>} - Объект с общей статистикой приложения
 */
export const getAppStatistics = async () => {
    try {
        // Получаем статистику пользователей
        const usersCollection = collection(db, "users");
        const usersQuery = await getDocs(usersCollection);
        const totalUsers = usersQuery.size;
        
        // Находим активных пользователей (пользователи, которые использовали приложение в течение последних 24 часов)
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        const activeUsersQuery = query(
            collection(db, "users"),
            where("lastSeen", ">=", oneDayAgo)
        );
        const activeUsersSnapshot = await getDocs(activeUsersQuery);
        const activeUsers = activeUsersSnapshot.size;
        
        // Получаем статистику чатов
        const chatsCollection = collection(db, "chats");
        const chatsQuery = await getDocs(chatsCollection);
        const totalChats = chatsQuery.size;
        
        // Находим активные чаты
        const activeChatsQuery = query(
            collection(db, "chats"),
            where("isActive", "==", true)
        );
        const activeChatsSnapshot = await getDocs(activeChatsQuery);
        const activeChats = activeChatsSnapshot.size;
        
        // Получаем общее количество сообщений
        // Так как сообщения могут храниться в отдельной коллекции, нам нужно их подсчитать
        const messagesCollection = collection(db, "messages");
        const messagesQuery = await getDocs(messagesCollection);
        const totalMessages = messagesQuery.size;
        
        // Получаем статистику запросов в техподдержку
        const supportChatsQuery = query(
            collection(db, "chats"),
            where("type", "==", "support")
        );
        const supportChatsSnapshot = await getDocs(supportChatsQuery);
        const supportChatsCount = supportChatsSnapshot.size;
        
        // Формируем объект статистики
        return {
            totalUsers,
            activeUsers,
            totalChats,
            activeChats,
            totalMessages,
            supportChatsCount,
            lastUpdated: new Date()
        };
    } catch (error) {
        console.error("Ошибка при получении общей статистики приложения:", error);
        throw error;
    }
};

export default {
    updateChatStartStatistics,
    updateMessageStatistics,
    updateChatEndStatistics,
    getUserStatistics,
    getAppStatistics
};
