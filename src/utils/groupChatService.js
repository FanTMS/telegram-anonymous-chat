import { db } from './firebase'; // Импорт Firebase
import { doc, getDoc, updateDoc, addDoc, setDoc, collection, serverTimestamp, increment, arrayUnion } from 'firebase/firestore';
import { updateMessageStatistics } from './statisticsService'; // Импорт функции обновления статистики

/**
 * Отправка сообщения в групповой чат
 * @param {string} groupId ID группы
 * @param {string} senderId ID отправителя
 * @param {string} text Текст сообщения
 * @returns {Promise<string>} ID созданного сообщения
 */
export const sendGroupMessage = async (groupId, senderId, text) => {
    try {
        // Проверка валидности параметров
        if (!groupId || !senderId || !text.trim()) {
            throw new Error("Недостаточно данных для отправки сообщения");
        }

        // Получаем информацию о пользователе
        const userDoc = await getDoc(doc(db, "users", senderId));
        const userData = userDoc.exists() ? userDoc.data() : { name: "Неизвестный пользователь" };

        // Текущее время клиента для использования в нескольких местах
        const currentTime = new Date();

        // Создаем новое сообщение
        const messageData = {
            groupId,
            senderId,
            senderName: userData.name || "Неизвестный пользователь",
            text,
            timestamp: serverTimestamp(), // Серверное время
            clientTimestamp: currentTime, // Время клиента
            type: 'text'
        };

        // Добавляем сообщение в коллекцию
        const messageRef = await addDoc(collection(db, "groupMessages"), messageData);
        const messageId = messageRef.id;

        // Обновляем информацию о последнем сообщении в группе
        await updateDoc(doc(db, "groups", groupId), {
            lastMessage: {
                text,
                senderId,
                senderName: userData.name || "Неизвестный пользователь",
                timestamp: currentTime.toISOString() // Используем ISO строку вместо serverTimestamp()
            },
            updatedAt: serverTimestamp(),
            messagesCount: increment(1),
            // При использовании arrayUnion не используем serverTimestamp()
            recentMessages: arrayUnion({
                id: messageId,
                text: text.substring(0, 50) + (text.length > 50 ? "..." : ""),
                senderId,
                senderName: userData.name || "Неизвестный пользователь",
                timestamp: currentTime.toISOString() // Используем ISO строку вместо serverTimestamp()
            })
        });

        // Обновляем статистику группы и пользователя
        try {
            // Обновление статистики группы
            const statsRef = doc(db, "groupStats", groupId);
            const statsDoc = await getDoc(statsRef);

            if (statsDoc.exists()) {
                await updateDoc(statsRef, {
                    totalMessages: increment(1),
                    lastActivity: serverTimestamp(),
                    activeUsers: arrayUnion(senderId)
                });
            } else {
                await setDoc(statsRef, {
                    groupId,
                    totalMessages: 1,
                    lastActivity: serverTimestamp(),
                    activeUsers: [senderId],
                    createdAt: serverTimestamp()
                });
            }

            // Обновление статистики пользователя
            await updateMessageStatistics(senderId, groupId);
        } catch (statsError) {
            console.warn('Ошибка при обновлении статистики группового сообщения:', statsError);
            // Продолжаем работу даже при ошибке статистики
        }

        return messageId;
    } catch (error) {
        console.error("Ошибка при отправке сообщения в группу:", error);
        throw new Error("Не удалось отправить сообщение в группу. Пожалуйста, попробуйте еще раз.");
    }
};