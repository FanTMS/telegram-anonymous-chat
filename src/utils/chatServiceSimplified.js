import { db } from '../firebase';
import {
    collection, addDoc, doc, updateDoc, getDoc, getDocs,
    query, where, arrayUnion, serverTimestamp,
    orderBy, limit, onSnapshot, deleteDoc
} from 'firebase/firestore';

/**
 * Альтернативная реализация поиска собеседника без использования сложных запросов
 * Может быть использована временно, пока не создан составной индекс
 * @param {string} userId ID текущего пользователя
 * @returns {Promise<string|null>} ID чата или null, если собеседник не найден
 */
export const findRandomChatSimple = async (userId) => {
    try {
        if (!userId) {
            console.error("userId is undefined or null");
            throw new Error("Не указан ID пользователя");
        }

        // 1. Проверка, не находится ли пользователь уже в очереди
        const userInQueueQuery = query(
            collection(db, "searchQueue"),
            where("userId", "==", userId)
        );

        const userInQueue = await getDocs(userInQueueQuery);
        if (!userInQueue.empty) {
            console.log("Пользователь уже находится в очереди поиска");
            return null;
        }

        // 2. Получить всех пользователей из очереди (без сложной фильтрации)
        const allUsersQuery = query(collection(db, "searchQueue"));
        const queueSnapshot = await getDocs(allUsersQuery);

        // Находим подходящего партнера (не самого пользователя)
        let partnerData = null;
        let queueDocId = null;

        queueSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.userId !== userId && !partnerData) {
                partnerData = data;
                queueDocId = doc.id;
            }
        });

        // 3A. Если есть собеседник в очереди
        if (partnerData) {
            const partnerId = partnerData.userId;

            // Создаем новый чат
            const chatData = {
                participants: [userId, partnerId],
                createdAt: serverTimestamp(),
                isActive: true,
                messages: [],
                lastMessage: null,
                reports: []
            };

            const chatRef = await addDoc(collection(db, "chats"), chatData);
            console.log("Создан новый чат с ID:", chatRef.id);

            // Удаляем партнера из очереди
            await deleteDoc(doc(db, "searchQueue", queueDocId));

            return chatRef.id;
        }
        // 3B. Если нет собеседника - добавляем пользователя в очередь
        else {
            const queueData = {
                userId: userId,
                timestamp: serverTimestamp()
            };

            await addDoc(collection(db, "searchQueue"), queueData);
            console.log("Пользователь добавлен в очередь поиска");

            return null; // Пока нет собеседника
        }
    } catch (error) {
        console.error("Ошибка при поиске собеседника:", error);
        throw error;
    }
};
