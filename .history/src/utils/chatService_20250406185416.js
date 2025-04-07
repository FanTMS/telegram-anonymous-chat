import { db } from '../firebase';
import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    arrayUnion,
    serverTimestamp,
    where,
    query,
    onSnapshot,
    orderBy,
    setDoc,
    limit
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { incrementCompletedChats, incrementMessagesCount, incrementChatStarted } from './statisticsService';
import { sanitizeData } from './firebaseUtils';
import { createRequiredIndexes, getIndexCreationInstructions } from './firebaseIndexCreator';

/**
 * Map для отслеживания активных слушателей
 * @type {Map<string, function>}
 */

/**
 * Генерация уникального ID для сообщения
 * @returns {string} Уникальный ID
 */
const generateMessageId = () => {
    return uuidv4();
};

/**
 * Переименовываем функцию, чтобы соответствовать правилам линтинга
 * @param {string} userId ID пользователя
 * @returns {Promise<Object|null>} Данные пользователя или null, если пользователь не найден
 */
export const _getUserById = async (userId) => {
    try {
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
            return { id: userSnap.id, ...userSnap.data() };
        } else {
            console.error(`Пользователь с ID ${userId} не найден.`);
            return null;
        }
    } catch (error) {
        console.error("Ошибка при получении данных пользователя:", error);
        return null;
    }
};

/**
 * Создает новый чат между двумя пользователями
 * @param {string} userId1 ID первого пользователя
 * @param {string} userId2 ID второго пользователя
 * @returns {Promise<string>} ID созданного чата
 */
export const createChat = async (userId1, userId2) => {
    try {
        const chatData = {
            participants: [userId1, userId2],
            createdAt: serverTimestamp(),
            isActive: true,
            messages: [],
            lastMessage: null,
            reports: [],
            lastActivity: serverTimestamp(),
            participantsNotified: {
                [userId1]: false,
                [userId2]: false
            },
            participantsInfo: {}
        };

        const chatRef = await addDoc(collection(db, "chats"), sanitizeData(chatData));
        console.log(`Создан новый чат между пользователями ${userId1} и ${userId2}`);

        await Promise.all([
            incrementChatStarted(userId1),
            incrementChatStarted(userId2)
        ]);

        return chatRef.id;
    } catch (error) {
        console.error("Ошибка при создании чата:", error);
        throw error;
    }
};

/**
 * Поиск случайного собеседника
 * @param {string} userId ID пользователя
 * @returns {Promise<string|null>} ID созданного чата или null, если пользователь добавлен в очередь поиска
 */
export const findRandomChat = async (userId) => {
    try {
        // Проверка подключения к Firebase
        try {
            const testRef = doc(db, "system", "connection_test");
            await getDoc(testRef);
        } catch (connectionError) {
            console.error("Ошибка подключения к Firebase:", connectionError);
            throw new Error("Нет соединения с базой данных. Пожалуйста, проверьте подключение к интернету.");
        }

        // Проверяем, есть ли уже пользователь в очереди поиска
        const userQueueQuery = query(
            collection(db, "searchQueue"),
            where("userId", "==", userId)
        );
        const userQueueSnapshot = await getDocs(userQueueQuery);

        // Если пользователь уже в очереди, удаляем его
        if (!userQueueSnapshot.empty) {
            await deleteDoc(doc(db, "searchQueue", userQueueSnapshot.docs[0].id));
            console.log(`Удален существующий запрос поиска для пользователя ${userId}`);
        }

        try {
            // Ищем других пользователей в очереди поиска (кроме текущего)
            const queueQuery = query(
                collection(db, "searchQueue"),
                orderBy("timestamp", "asc")
            );

            try {
                const queueSnapshot = await getDocs(queueQuery);
                const queueUsers = queueSnapshot.docs.map(doc => ({
                    id: doc.id,
                    userId: doc.data().userId,
                    timestamp: doc.data().timestamp
                }));

                const otherUsers = queueUsers.filter(queueUser => queueUser.userId !== userId);

                if (otherUsers.length > 0) {
                    // Выбираем случайного пользователя из очереди
                    const randomIndex = Math.floor(Math.random() * otherUsers.length);
                    const partnerQueueDoc = otherUsers[randomIndex];

                    // Удаляем выбранного пользователя из очереди
                    await deleteDoc(doc(db, "searchQueue", partnerQueueDoc.id));

                    // Создаем чат между текущим пользователем и выбранным партнером
                    const chatId = await createChat(userId, partnerQueueDoc.userId);
                    console.log(`Найден собеседник ${partnerQueueDoc.userId} для ${userId}, создан чат ${chatId}`);
                    return chatId;
                }
            } catch (indexError) {
                // Если возникла ошибка с индексами, пытаемся их создать
                if (indexError.code === 'failed-precondition' && indexError.message.includes('index')) {
                    console.error('Ошибка индекса:', indexError);

                    // Пытаемся автоматически создать индексы
                    const indexCreated = await createRequiredIndexes();

                    if (!indexCreated) {
                        // Если не удалось автоматически создать индекс, возвращаем ошибку с инструкциями
                        throw new Error("Требуется создание индекса в Firebase. Пожалуйста, следуйте инструкции по ссылке: " +
                            "https://console.firebase.google.com/project/_/firestore/indexes");
                    }

                    // Повторяем запрос после создания индекса
                    throw new Error("Индекс запрошен. Пожалуйста, подождите несколько секунд и повторите поиск.");
                } else {
                    throw indexError;
                }
            }

            // Если нет подходящих пользователей, добавляем текущего пользователя в очередь
            await addDoc(collection(db, "searchQueue"), {
                userId: userId,
                timestamp: serverTimestamp()
            });
            console.log(`Пользователь ${userId} добавлен в очередь поиска`);
            return null;
        } catch (firestoreError) {
            if (firestoreError.code === 'failed-precondition' && firestoreError.message.includes('index')) {
                // Пытаемся автоматически создать индексы
                await createRequiredIndexes();

                // Возвращаем более понятное сообщение об ошибке
                throw new Error("Индекс создается, пожалуйста подождите несколько секунд и повторите поиск.");
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
 * Проверка статуса поиска собеседника
 * @param {string} userId ID пользователя
 * @returns {Promise<Object|null>} Информация о найденном чате или null
 */
export const checkChatMatchStatus = async (userId) => {
    try {
        const chatsQuery = query(
            collection(db, "chats"),
            where("participants", "array-contains", userId),
            where("isActive", "==", true),
            orderBy("createdAt", "desc"),
            limit(1)
        );

        const chatSnapshot = await getDocs(chatsQuery);

        if (!chatSnapshot.empty) {
            const chatDoc = chatSnapshot.docs[0];
            const chatData = chatDoc.data();

            if (chatData.participantsNotified && chatData.participantsNotified[userId]) {
                return {
                    id: chatDoc.id,
                    ...chatData,
                    createdAt: chatData.createdAt ? chatData.createdAt.toDate() : new Date()
                };
            }
        }

        return null;
    } catch (error) {
        console.error("Ошибка при проверке статуса поиска:", error);
        return null;
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

        if (!chatDoc.exists()) {
            throw new Error("Чат не существует");
        }

        const messageData = {
            ...message,
            id: generateMessageId(),
            status: 'sent'
        };

        await updateDoc(chatRef, {
            messages: arrayUnion(messageData),
            lastMessageAt: serverTimestamp(),
            lastMessagePreview: message.text.substring(0, 50) + (message.text.length > 50 ? '...' : '')
        });

        await incrementMessagesCount(message.senderId);

        return messageData;
    } catch (error) {
        console.error("Ошибка при отправке сообщения:", error);
        throw error;
    }
};

/**
 * Получение данных чата по ID
 * @param {string} chatId ID чата
 * @returns {Promise<object|null>} Данные чата или null, если чат не найден
 */
export const getChatById = async (chatId) => {
    try {
        const chatDoc = await getDoc(doc(db, 'chats', chatId));

        if (!chatDoc.exists()) {
            throw new Error('Чат не найден');
        }

        return {
            id: chatDoc.id,
            ...chatDoc.data()
        };
    } catch (error) {
        console.error("Ошибка при получении чата:", error);
        throw error;
    }
};

/**
 * Получение всех активных чатов пользователя
 * @param {string} userId ID пользователя
 */
export const getUserChats = async (userId) => {
    try {
        const q = query(
            collection(db, "chats"),
            where("participants", "array-contains", userId),
            orderBy("lastMessageTime", "desc")
        );

        const querySnapshot = await getDocs(q);
        const chats = [];

        querySnapshot.forEach((doc) => {
            const chatData = doc.data();

            if (chatData.isActive || chatData.type === 'support') {
                chats.push({
                    id: doc.id,
                    ...chatData,
                    createdAt: chatData.createdAt ? chatData.createdAt.toDate() : new Date(),
                    lastMessageTime: chatData.lastMessageTime ? chatData.lastMessageTime.toDate() : new Date(),
                    isSupport: chatData.type === 'support'
                });
            }
        });

        return chats;
    } catch (error) {
        console.error("Ошибка при получении чатов пользователя:", error);
        return [];
    }
};

/**
 * Получение сообщений чата
 * @param {string} chatId - ID чата
 * @returns {Promise<Array>} - Массив сообщений
 */
export const getChatMessages = async (chatId) => {
    try {
        const q = query(
            collection(db, 'messages'),
            where('chatId', '==', chatId),
            orderBy('timestamp', 'asc')
        );

        const querySnapshot = await getDocs(q);
        const messages = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            messages.push({
                id: doc.id,
                text: data.text,
                senderId: data.userId,
                timestamp: data.timestamp ? data.timestamp.toDate().getTime() : Date.now(),
                isRead: data.isRead || false,
                isFromSupport: data.userId === 'support'
            });
        });

        return messages;
    } catch (error) {
        console.error("Ошибка при получении сообщений чата:", error);
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
 * Подписка на обновления чата
 * @param {string} chatId ID чата
 * @param {function} callback Функция обратного вызова, вызываемая при обновлении чата
 * @returns {function} Функция для отписки от обновлений
 */
export const subscribeToChatUpdates = (chatId, callback) => {
    try {
        const chatRef = doc(db, "chats", chatId);

        return onSnapshot(chatRef, (doc) => {
            if (doc.exists()) {
                const chatData = {
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : null,
                    lastMessageAt: doc.data().lastMessageAt ? doc.data().lastMessageAt.toDate() : null
                };
                callback(chatData);
            } else {
                callback(null);
            }
        });
    } catch (error) {
        console.error("Ошибка при подписке на обновления чата:", error);
        throw error;
    }
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

        await updateDoc(chatRef, {
            reports: arrayUnion(reportData)
        });

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

/**
 * Пометить сообщения чата как прочитанные для определенного пользователя
 * @param {string} chatId - ID чата
 * @param {string} userId - ID пользователя, который прочитал сообщения
 * @returns {Promise<boolean>} - Результат операции
 */
export const markMessagesAsRead = async (chatId, userId) => {
    try {
        const chatRef = doc(db, "chats", chatId);
        const chatDoc = await getDoc(chatRef);

        if (!chatDoc.exists()) {
            throw new Error("Чат не существует");
        }

        const chatData = chatDoc.data();
        let wasUpdated = false;

        if (chatData.messages && Array.isArray(chatData.messages)) {
            const updatedMessages = chatData.messages.map(msg => {
                if (msg.senderId !== userId && !msg.readBy?.includes(userId)) {
                    wasUpdated = true;
                    return {
                        ...msg,
                        readBy: [...(msg.readBy || []), userId]
                    };
                }
                return msg;
            });

            if (wasUpdated) {
                await updateDoc(chatRef, { messages: updatedMessages });

                const userChatRef = doc(db, "users", userId, "chats", chatId);
                await updateDoc(userChatRef, { unreadCount: 0 });
            }
        }

        return wasUpdated;
    } catch (error) {
        console.error("Ошибка при пометке сообщений как прочитанных:", error);
        return false;
    }
};

/**
 * Отправка сообщения в чат
 * @param {string} chatId - ID чата
 * @param {string} userId - ID отправителя
 * @param {string} text - Текст сообщения
 * @returns {Promise<object>} - Отправленное сообщение
 */
export const sendChatMessage = async (chatId, userId, text) => {
    try {
        const chatRef = doc(db, "chats", chatId);
        const chatDoc = await getDoc(chatRef);

        if (!chatDoc.exists()) {
            throw new Error("Чат не существует");
        }

        if (!navigator.onLine) {
            throw new Error("Отсутствует подключение к сети");
        }

        const message = {
            senderId: userId,
            text: text,
            timestamp: serverTimestamp(),
            id: generateMessageId(),
            status: 'sent'
        };

        await updateDoc(chatRef, {
            messages: arrayUnion(message),
            lastMessageAt: serverTimestamp(),
            lastMessagePreview: text.substring(0, 50) + (text.length > 50 ? '...' : '')
        });

        const chatData = chatDoc.data();
        if (chatData.participants) {
            for (const participantId of chatData.participants) {
                if (participantId !== userId) {
                    try {
                        const userChatRef = doc(db, "users", participantId, "chats", chatId);
                        const userChatDoc = await getDoc(userChatRef);

                        if (userChatDoc.exists()) {
                            const unreadCount = (userChatDoc.data().unreadCount || 0) + 1;
                            await updateDoc(userChatRef, { unreadCount });
                        }
                    } catch (e) {
                        console.warn(`Не удалось обновить счетчик сообщений для пользователя ${participantId}:`, e);
                    }
                }
            }
        }

        return message;
    } catch (error) {
        console.error("Ошибка при отправке сообщения:", error);

        let errorMessage = "Не удалось отправить сообщение. Пожалуйста, попробуйте еще раз.";

        if (!navigator.onLine) {
            errorMessage = "Нет подключения к интернету. Проверьте соединение и попробуйте еще раз.";
        } else if (error.code === 'permission-denied') {
            errorMessage = "У вас нет прав для отправки сообщений в этот чат.";
        } else if (error.message === "Чат не существует") {
            errorMessage = "Чат был удален или недоступен.";
        }

        const enhancedError = new Error(errorMessage);
        enhancedError.originalError = error;
        enhancedError.code = error.code;

        throw enhancedError;
    }
};

/**
 * Добавление сообщения в чат поддержки
 * @param {string} userId - ID пользователя
 * @param {string} message - Текст сообщения
 * @returns {Promise<boolean>} - Результат операции
 */
export const addSupportChat = async (userId, message) => {
    try {
        let supportChatId = await getSupportChatId(userId);

        if (!supportChatId) {
            supportChatId = await createSupportChat(userId);
        }

        if (!supportChatId) {
            throw new Error('Не удалось создать чат с поддержкой');
        }

        const messageData = {
            chatId: supportChatId,
            userId: userId,
            text: message,
            timestamp: serverTimestamp(),
            isRead: false
        };

        await addDoc(collection(db, 'messages'), messageData);

        await updateDoc(doc(db, 'chats', supportChatId), {
            lastMessageTime: serverTimestamp(),
            lastMessage: message.substring(0, 50) + (message.length > 50 ? '...' : '')
        });

        return true;
    } catch (error) {
        console.error('Ошибка при добавлении сообщения в чат поддержки:', error);
        return false;
    }
};

/**
 * Получение ID чата поддержки для пользователя
 * @param {string} userId - ID пользователя
 * @returns {Promise<string|null>} - ID чата или null, если чат не найден
 */
export const getSupportChatId = async (userId) => {
    try {
        const q = query(
            collection(db, 'chats'),
            where('type', '==', 'support'),
            where('participants', 'array-contains', userId)
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            return querySnapshot.docs[0].id;
        }

        return null;
    } catch (error) {
        console.error('Ошибка при получении ID чата поддержки:', error);
        return null;
    }
};

/**
 * Создание чата с поддержкой для пользователя
 * @param {string} userId - ID пользователя
 * @returns {Promise<string|null>} - ID созданного чата или null в случае ошибки
 */
export const createSupportChat = async (userId) => {
    try {
        const chatData = {
            type: 'support',
            participants: [userId, 'support'],
            createdAt: serverTimestamp(),
            lastMessageTime: serverTimestamp(),
            isActive: true,
            lastMessage: 'Чат с технической поддержкой',
            name: 'Техническая поддержка',
            icon: '👨‍💻'
        };

        const chatRef = await addDoc(collection(db, 'chats'), chatData);

        await setDoc(doc(db, 'users', userId, 'chats', chatRef.id), {
            chatId: chatRef.id,
            unreadCount: 0,
            lastActivity: serverTimestamp()
        });

        const welcomeMessageData = {
            chatId: chatRef.id,
            senderId: 'support',
            text: 'Добро пожаловать в чат поддержки! Опишите вашу проблему или задайте вопрос, и мы ответим вам как можно скорее.',
            timestamp: serverTimestamp(),
            readBy: ['support']
        };

        await addDoc(collection(db, "messages"), welcomeMessageData);

        await updateDoc(chatRef, {
            lastMessage: welcomeMessageData.text.substring(0, 50) + (welcomeMessageData.text.length > 50 ? '...' : ''),
            lastMessageTime: serverTimestamp()
        });

        return chatRef.id;
    } catch (error) {
        console.error('Ошибка при создании чата поддержки:', error);
        return null;
    }
};

/**
 * Обновляет статус пользователя (онлайн/оффлайн)
 * @param {string} userId - ID пользователя
 * @param {boolean} isOnline - Статус пользователя (true - онлайн, false - оффлайн)
 * @returns {Promise<void>}
 */
export const updateUserOnlineStatus = async (userId, isOnline) => {
    try {
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            console.warn("Пользователь не найден при обновлении статуса онлайн");
            return;
        }

        const updateData = {
            isOnline: isOnline,
            lastSeen: serverTimestamp()
        };

        await updateDoc(userRef, updateData);
    } catch (error) {
        console.error("Ошибка при обновлении статуса пользователя:", error);
    }
};

/**
 * Получает статус пользователя
 * @param {string} userId - ID пользователя
 * @returns {Promise<Object>} Объект со статусом пользователя
 */
export const getUserStatus = async (userId) => {
    try {
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            return { isOnline: false, lastSeen: null };
        }

        const userData = userDoc.data();
        return {
            isOnline: userData.isOnline || false,
            lastSeen: userData.lastSeen ? userData.lastSeen.toDate() : null
        };
    } catch (error) {
        console.error("Ошибка при получении статуса пользователя:", error);
        return { isOnline: false, lastSeen: null };
    }
};

/**
 * Форматирует время последнего пребывания пользователя
 * @param {Date} lastSeen - Дата последнего пребывания
 * @returns {string} Форматированная строка
 */
export const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return "не в сети";

    const now = new Date();
    const diff = Math.floor((now - lastSeen) / 1000);

    if (diff < 60) return "был(а) только что";
    if (diff < 3600) return `был(а) ${Math.floor(diff / 60)} мин. назад`;
    if (diff < 86400) return `был(а) ${Math.floor(diff / 3600)} ч. назад`;

    const options = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
    return `был(а) ${lastSeen.toLocaleDateString('ru-RU', options)}`;
};
