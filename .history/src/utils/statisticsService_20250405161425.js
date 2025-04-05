import { db } from '../firebase';
import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc, 
    increment, 
    serverTimestamp,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit
} from 'firebase/firestore';

// Получение статистики пользователя
export const getUserStatistics = async (userId) => {
    try {
        // Сначала проверяем, есть ли статистика у пользователя
        const userStatsRef = doc(db, 'statistics', userId);
        const userStatsDoc = await getDoc(userStatsRef);
        
        if (userStatsDoc.exists()) {
            return { id: userId, ...userStatsDoc.data() };
        } else {
            // Если статистики нет, создаем базовую статистику
            const initialStats = {
                messagesSent: 0,
                messagesReceived: 0,
                totalChats: 0,
                activeChats: 0,
                completedChats: 0,
                averageChatLength: 0,
                longestChatMessages: 0,
                totalOnlineTime: 0,
                lastUpdated: serverTimestamp()
            };
            
            await setDoc(userStatsRef, initialStats);
            return { id: userId, ...initialStats };
        }
    } catch (error) {
        console.error('Ошибка при получении статистики:', error);
        throw new Error('Не удалось загрузить статистику пользователя.');
    }
};

// Обновление счетчика отправленных сообщений
export const incrementMessagesSent = async (userId) => {
    try {
        const userStatsRef = doc(db, 'statistics', userId);
        await updateDoc(userStatsRef, {
            messagesSent: increment(1),
            lastUpdated: serverTimestamp()
        });
    } catch (error) {
        console.error('Ошибка при обновлении счетчика отправленных сообщений:', error);
    }
};

// Обновление счетчика полученных сообщений
export const incrementMessagesReceived = async (userId) => {
    try {
        const userStatsRef = doc(db, 'statistics', userId);
        await updateDoc(userStatsRef, {
            messagesReceived: increment(1),
            lastUpdated: serverTimestamp()
        });
    } catch (error) {
        console.error('Ошибка при обновлении счетчика полученных сообщений:', error);
    }
};

// Обновление статистики при начале нового чата
export const incrementChatStarted = async (userId) => {
    try {
        const userStatsRef = doc(db, 'statistics', userId);
        await updateDoc(userStatsRef, {
            totalChats: increment(1),
            activeChats: increment(1),
            lastUpdated: serverTimestamp()
        });
    } catch (error) {
        console.error('Ошибка при обновлении статистики начала чата:', error);
    }
};

// Обновление статистики при завершении чата
export const updateChatCompleted = async (userId, messageCount) => {
    try {
        const userStatsRef = doc(db, 'statistics', userId);
        const userStatsDoc = await getDoc(userStatsRef);
        
        if (userStatsDoc.exists()) {
            const currentStats = userStatsDoc.data();
            const currentTotal = currentStats.totalChats || 0;
            const currentCompleted = currentStats.completedChats || 0;
            const currentAvg = currentStats.averageChatLength || 0;
            const currentLongest = currentStats.longestChatMessages || 0;
            
            // Рассчитываем новое среднее количество сообщений
            const newAvg = (currentAvg * currentCompleted + messageCount) / (currentCompleted + 1);
            
            // Обновляем статистику
            await updateDoc(userStatsRef, {
                completedChats: increment(1),
                activeChats: increment(-1),
                averageChatLength: newAvg,
                longestChatMessages: messageCount > currentLongest ? messageCount : currentLongest,
                lastUpdated: serverTimestamp()
            });
        }
    } catch (error) {
        console.error('Ошибка при обновлении статистики завершения чата:', error);
    }
};

export default {
    getUserStatistics,
    incrementMessagesSent,
    incrementMessagesReceived,
    incrementChatStarted,
    updateChatCompleted
};
