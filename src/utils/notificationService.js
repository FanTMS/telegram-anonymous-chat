import { db } from '../firebase';
import {
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    setDoc,
    updateDoc,
    doc,
    serverTimestamp,
    getDoc
} from 'firebase/firestore';

/**
 * Получение количества непрочитанных уведомлений пользователя
 * @param {string} userId ID пользователя
 * @returns {Promise<number>} Количество непрочитанных уведомлений
 */
export const getUnreadNotificationsCount = async (userId) => {
    try {
        if (!userId) {
            console.warn('getUnreadNotificationsCount: ID пользователя не указан');
            return 0;
        }
        
        // Проверяем наличие документа с настройками уведомлений пользователя
        const userNotificationsRef = doc(db, "userNotifications", userId);
        const userNotificationsDoc = await getDoc(userNotificationsRef);
        
        // Если документа нет, создаем его
        if (!userNotificationsDoc.exists()) {
            await setDoc(userNotificationsRef, {
                userId,
                lastRead: serverTimestamp(),
                unreadCount: 0,
                updatedAt: serverTimestamp()
            });
            return 0;
        }
        
        // Если документ есть, берем количество непрочитанных уведомлений из него
        const userData = userNotificationsDoc.data();
        return userData.unreadCount || 0;
    } catch (error) {
        console.error('Ошибка при получении количества непрочитанных уведомлений:', error);
        return 0;
    }
};

/**
 * Получение последних уведомлений пользователя
 * @param {string} userId ID пользователя
 * @param {number} limitCount Максимальное количество уведомлений
 * @returns {Promise<Array>} Массив уведомлений
 */
export const getUserNotifications = async (userId, limitCount = 10) => {
    try {
        if (!userId) {
            console.warn('getUserNotifications: ID пользователя не указан');
            return [];
        }
        
        // Получаем все уведомления пользователя, отсортированные по дате
        const notificationsQuery = query(
            collection(db, "notifications"),
            where("userId", "==", userId),
            orderBy("createdAt", "desc"),
            limit(limitCount)
        );
        
        const notificationsSnapshot = await getDocs(notificationsQuery);
        
        if (notificationsSnapshot.empty) {
            return [];
        }
        
        const notifications = notificationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : new Date()
        }));
        
        return notifications;
    } catch (error) {
        console.error('Ошибка при получении уведомлений пользователя:', error);
        return [];
    }
};

/**
 * Пометить все уведомления пользователя как прочитанные
 * @param {string} userId ID пользователя
 * @returns {Promise<boolean>} Результат операции
 */
export const markAllNotificationsAsRead = async (userId) => {
    try {
        if (!userId) {
            console.warn('markAllNotificationsAsRead: ID пользователя не указан');
            return false;
        }
        
        // Обновляем документ с настройками уведомлений пользователя
        const userNotificationsRef = doc(db, "userNotifications", userId);
        
        await updateDoc(userNotificationsRef, {
            lastRead: serverTimestamp(),
            unreadCount: 0,
            updatedAt: serverTimestamp()
        });
        
        return true;
    } catch (error) {
        console.error('Ошибка при пометке уведомлений как прочитанных:', error);
        return false;
    }
}; 