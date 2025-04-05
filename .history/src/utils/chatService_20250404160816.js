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
    setDoc
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { getUserById } from './usersService';
import {
    incrementCompletedChats,
    incrementMessagesCount
} from './statisticsService';

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
 * Поиск случайного собеседника
 * @param {string} userId ID пользователя, ищущего собеседника
 * @returns {Promise<string|null>} ID созданного чата или null, если собеседник не найден
 */
export const findRandomChat = async (userId) => {
    try {
        if (!userId) {
            throw new Error("Не указан ID пользователя");
        }

        const userInQueueQuery = query(
            collection(db, "searchQueue"),
            where("userId", "==", userId)
        );

        const userInQueue = await getDocs(userInQueueQuery);

        if (!userInQueue.empty) {
            console.log("Пользователь уже находится в очереди поиска");
            return null;
        }

        try {
            const queueRef = collection(db, "searchQueue");
            const queueSnap = await getDocs(queueRef);

            if (!queueSnap.empty) {
                const queueUsers = queueSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                const otherUsers = queueUsers.filter(queueUser => queueUser.userId !== userId);

                if (otherUsers.length > 0) {
                    const randomIndex = Math.floor(Math.random() * otherUsers.length);
                    const partnerQueueDoc = otherUsers[randomIndex];

                    await deleteDoc(doc(db, "searchQueue", partnerQueueDoc.id));

                    const chatId = await createChat(userId, partnerQueueDoc.userId);

                    console.log(`Найден собеседник ${partnerQueueDoc.userId} для ${userId}, создан чат ${chatId}`);

                    return chatId;
                }
            }

            await addDoc(collection(db, "searchQueue"), {
                userId: userId,
                timestamp: serverTimestamp()
            });

            console.log(`Пользователь ${userId} добавлен в очередь поиска`);

            return null;
        } catch (firestoreError) {
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
 * Создание нового чата между двумя пользователями
 * @param {string} user1Id ID первого пользователя
 * @param {string} user2Id ID второго пользователя
 * @returns {Promise<string>} ID созданного чата
 */
export const createChat = async (user1Id, user2Id) => {
    try {
        if (!user1Id || !user2Id) {
            throw new Error("Необходимо указать ID обоих пользователей");
        }

        const [user1Doc, user2Doc] = await Promise.all([
            getUserById(user1Id),
            getUserById(user2Id)
        ]);

        const participantsInfo = {};

        if (user1Doc) {
            participantsInfo[user1Id] = {
                name: user1Doc.name || 'Анонимный пользователь',
                joined: new Date()
            };
        }

        if (user2Doc) {
            participantsInfo[user2Id] = {
                name: user2Doc.name || 'Анонимный пользователь',
                joined: new Date()
            };
        }

        const chatData = {
            participants: [user1Id, user2Id],
            participantsInfo: participantsInfo,
            messages: [],
            isActive: true,
            createdAt: serverTimestamp(),
            lastMessageAt: serverTimestamp()
        };

        const chatRef = await addDoc(collection(db, "chats"), chatData);
        return chatRef.id;
    } catch (error) {
        console.error("Ошибка при создании чата:", error);
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
                senderId: data.userId, // userId используется как senderId
                timestamp: data.timestamp ? data.timestamp.toDate().getTime() : Date.now(),
                isRead: data.isRead || false,
                isFromSupport: data.userId === 'support' // Добавляем флаг для сообщений от поддержки
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
 * Отправка сообщения в чат (обновленная версия существующего метода)
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

        const message = {
            senderId: userId,
            text: text,
            timestamp: serverTimestamp(),
            id: generateMessageId(),
            readBy: [userId]
        };

        await updateDoc(chatRef, {
            lastMessage: message,
            lastMessageTime: serverTimestamp()
        });

        await addDoc(collection(db, "messages"), {
            chatId: chatId,
            ...message
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
        throw error;
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

        // Добавляем сообщение в чат напрямую вместо использования sendChatMessage
        const messageData = {
            chatId: supportChatId,
            userId: userId, // ID отправителя
            text: message,
            timestamp: serverTimestamp(),
            isRead: false
        };

        await addDoc(collection(db, 'messages'), messageData);

        // Обновляем время последнего сообщения в чате
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
        // Формирование данных чата поддержки
        const chatData = {
            type: 'support',
            participants: [userId, 'support'], // Добавляем 'support' как участника для правильной работы запросов
            createdAt: serverTimestamp(),
            lastMessageTime: serverTimestamp(),
            isActive: true, // Важно, чтобы чат был активным
            lastMessage: 'Чат с технической поддержкой',
            name: 'Техническая поддержка',
            icon: '👨‍💻'
        };

        // Создаем документ чата
        const chatRef = await addDoc(collection(db, 'chats'), chatData);

        // Создаем связь с пользователем в подколлекции users/{userId}/chats
        await setDoc(doc(db, 'users', userId, 'chats', chatRef.id), {
            chatId: chatRef.id,
            unreadCount: 0,
            lastActivity: serverTimestamp()
        });

        // Отправляем приветственное сообщение от поддержки
        const welcomeMessageData = {
            chatId: chatRef.id,
            senderId: 'support', // ID отправителя - система поддержки
            text: 'Добро пожаловать в чат поддержки! Опишите вашу проблему или задайте вопрос, и мы ответим вам как можно скорее.',
            timestamp: serverTimestamp(),
            readBy: ['support'] // Отмечаем, что сообщение уже прочитано службой поддержки
        };

        // Добавляем сообщение в коллекцию messages
        await addDoc(collection(db, "messages"), welcomeMessageData);

        // Обновляем информацию о последнем сообщении в чате
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
    const diff = Math.floor((now - lastSeen) / 1000); // разница в секундах

    if (diff < 60) return "был(а) только что";
    if (diff < 3600) return `был(а) ${Math.floor(diff / 60)} мин. назад`;
    if (diff < 86400) return `был(а) ${Math.floor(diff / 3600)} ч. назад`;

    const options = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
    return `был(а) ${lastSeen.toLocaleDateString('ru-RU', options)}`;
};
