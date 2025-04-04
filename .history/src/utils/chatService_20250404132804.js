import { db } from '../firebase';
import {
    collection, addDoc, doc, updateDoc, getDoc, getDocs,
    query, where, arrayUnion, serverTimestamp,
    orderBy, limit, onSnapshot, deleteDoc
} from 'firebase/firestore';
import { 
    incrementTotalChats, incrementCompletedChats, 
    incrementMessagesCount 
} from './statisticsService';

// Структура для хранения активных слушателей обновлений чата
const activeListeners = new Map();

/**
 * Поиск случайного собеседника
 * @param {string} userId ID текущего пользователя
 * @returns {Promise<string|null>} ID чата или null, если собеседник не найден
 */
export const findRandomChat = async (userId) => {
    try {
        // Проверяем, что userId не пустой
        if (!userId) {
            console.error("userId is undefined or null");
            throw new Error("Не указан ID пользователя");
        }

        // 1. Проверяем, не находится ли пользователь уже в очереди
        const userInQueueQuery = query(
            collection(db, "searchQueue"),
            where("userId", "==", userId)
        );

        const userInQueue = await getDocs(userInQueueQuery);

        if (!userInQueue.empty) {
            // Если пользователь уже в очереди - выходим
            console.log("Пользователь уже находится в очереди поиска");
            return null;
        }

        // 2. Ищем случайного собеседника из очереди
        try {
            const queueQuery = query(
                collection(db, "searchQueue"),
                where("userId", "!=", userId),
                orderBy("userId"), // Добавляем orderBy для использования с неравенством
                orderBy("timestamp"), // Сначала обрабатываем тех, кто дольше в очереди
                limit(1) // Берем первого в очереди
            );

            const queueSnapshot = await getDocs(queueQuery);

            // 3A. Если есть собеседник в очереди
            if (!queueSnapshot.empty) {
                const partnerData = queueSnapshot.docs[0].data();
                const partnerId = partnerData.userId;
                const queueDocId = queueSnapshot.docs[0].id;

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

                // Обновляем статистику обоих пользователей
                await incrementTotalChats(userId);
                await incrementTotalChats(partnerId);

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
        } catch (firestoreError) {
            console.error("Ошибка Firestore при поиске собеседника:", firestoreError);

            // Обработка ошибки отсутствия индекса
            if (firestoreError.code === 'failed-precondition' && firestoreError.message.includes('index')) {
                throw new Error("Требуется создание индекса в Firebase. Пожалуйста, следуйте инструкции по ссылке: " +
                    "https://console.firebase.google.com/project/_/firestore/indexes");
            }
            else if (firestoreError.code === 'permission-denied') {
                throw new Error("Нет прав доступа к базе данных. Проверьте правила безопасности Firestore.");
            }
            throw firestoreError;
        }
    } catch (error) {
        console.error("Ошибка при поиске собеседника:", error);
        throw error;
    }
};

/**
 * Отмена поиска собеседника
 * @param {string} userId ID пользователя
 */
export const cancelSearch = async (userId) => {
    try {
        const queueQuery = query(
            collection(db, "searchQueue"),
            where("userId", "==", userId)
        );

        const queueSnapshot = await getDocs(queueQuery);

        if (!queueSnapshot.empty) {
            const queueDocId = queueSnapshot.docs[0].id;
            await deleteDoc(doc(db, "searchQueue", queueDocId));
            console.log("Поиск отменен, пользователь удален из очереди");
        }
    } catch (error) {
        console.error("Ошибка при отмене поиска:", error);
        throw error;
    }
};

/**
 * Отправка сообщения в чат
 * @param {string} chatId ID чата
 * @param {object} message Объект сообщения
 */
export const sendMessage = async (chatId, message) => {
    try {
        const chatRef = doc(db, "chats", chatId);
        const chatDoc = await getDoc(chatRef);

        if (!chatDoc.exists() || !chatDoc.data().isActive) {
            throw new Error("Чат не существует или был завершен");
        }

        const messageData = {
            ...message,
            timestamp: serverTimestamp()
        };

        // Обновляем документ чата - добавляем сообщение в массив и обновляем lastMessage
        await updateDoc(chatRef, {
            messages: arrayUnion(messageData),
            lastMessage: messageData
        });

        // Обновляем статистику пользователя
        await incrementMessagesCount(message.senderId);

        return true;
    } catch (error) {
        console.error("Ошибка при отправке сообщения:", error);
        throw error;
    }
};

/**
 * Получение данных чата по ID
 * @param {string} chatId ID чата
 */
export const getChatById = async (chatId) => {
    try {
        const chatRef = doc(db, "chats", chatId);
        const chatDoc = await getDoc(chatRef);

        if (!chatDoc.exists()) {
            return null;
        }

        return {
            id: chatDoc.id,
            ...chatDoc.data()
        };
    } catch (error) {
        console.error("Ошибка при получении данных чата:", error);
        throw error;
    }
};

/**
 * Получение всех активных чатов пользователя
 * @param {string} userId ID пользователя
 */
export const getUserChats = async (userId) => {
    try {
        const chatsQuery = query(
            collection(db, "chats"),
            where("participants", "array-contains", userId),
            where("isActive", "==", true)
        );

        const chatsSnapshot = await getDocs(chatsQuery);
        const chats = [];

        chatsSnapshot.forEach((chatDoc) => {
            const chatData = chatDoc.data();

            // Находим ID собеседника
            const partnerId = chatData.participants.find(id => id !== userId);

            chats.push({
                id: chatDoc.id,
                partnerId,
                lastMessage: chatData.lastMessage,
                unreadCount: 0, // Будем использовать отдельную логику для подсчета непрочитанных
                ...chatData
            });
        });

        return chats;
    } catch (error) {
        console.error("Ошибка при получении списка чатов:", error);
        throw error;
    }
};

/**
 * Завершение чата
 * @param {string} chatId ID чата
 */
export const endChat = async (chatId) => {
    try {
        const chatRef = doc(db, "chats", chatId);
        const chatDoc = await getDoc(chatRef);

        if (!chatDoc.exists()) {
            throw new Error("Чат не найден");
        }

        const chatData = chatDoc.data();

        await updateDoc(chatRef, {
            isActive: false,
            endedAt: serverTimestamp()
        });

        // Обновляем статистику участников
        if (chatData.participants && chatData.participants.length > 0) {
            for (const participantId of chatData.participants) {
                await incrementCompletedChats(participantId);
            }
        }

        return true;
    } catch (error) {
        console.error("Ошибка при завершении чата:", error);
        throw error;
    }
};

/**
 * Подписка на обновления чата в реальном времени
 * @param {string} chatId ID чата
 * @param {function} callback Функция обратного вызова
 */
export const subscribeToChatUpdates = (chatId, callback) => {
    // Если уже есть активный слушатель для данного чата - отписываемся
    if (activeListeners.has(chatId)) {
        activeListeners.get(chatId)();
    }

    const chatRef = doc(db, "chats", chatId);

    const unsubscribe = onSnapshot(chatRef, (doc) => {
        if (doc.exists()) {
            const chatData = {
                id: doc.id,
                ...doc.data()
            };
            callback(chatData);
        } else {
            callback(null);
        }
    }, (error) => {
        console.error("Ошибка при подписке на обновления чата:", error);
    });

    // Сохраняем функцию отписки
    activeListeners.set(chatId, unsubscribe);

    return unsubscribe;
};

/**
 * Отчет о нарушении в чате
 * @param {string} chatId ID чата
 * @param {string} reporterId ID пользователя, создавшего отчет
 * @param {string} reason Причина жалобы
 */
export const reportChat = async (chatId, reporterId, reason) => {
    try {
        const chatRef = doc(db, "chats", chatId);
        const chatDoc = await getDoc(chatRef);

        if (!chatDoc.exists()) {
            throw new Error("Чат не существует");
        }

        const reportData = {
            reporterId,
            reason,
            timestamp: serverTimestamp()
        };

        // Добавляем отчет в массив отчетов
        await updateDoc(chatRef, {
            reports: arrayUnion(reportData)
        });

        // Добавляем отчет в отдельную коллекцию для модераторов
        await addDoc(collection(db, "reports"), {
            chatId,
            ...reportData
        });

        return true;
    } catch (error) {
        console.error("Ошибка при создании отчета:", error);
        throw error;
    }
};

/**
 * Проверка статуса поиска
 * @param {string} userId ID пользователя
 * @returns {Promise<boolean>} true, если пользователь в очереди поиска
 */
export const checkSearchStatus = async (userId) => {
    try {
        const queueQuery = query(
            collection(db, "searchQueue"),
            where("userId", "==", userId)
        );

        const queueSnapshot = await getDocs(queueQuery);

        return !queueSnapshot.empty;
    } catch (error) {
        console.error("Ошибка при проверке статуса поиска:", error);
        throw error;
    }
};
