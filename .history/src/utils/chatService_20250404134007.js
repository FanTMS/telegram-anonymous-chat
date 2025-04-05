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
 * @param {string} userId ID пользователя, ищущего собеседника
 * @returns {Promise<string|null>} ID созданного чата или null, если собеседник не найден
 */
export const findRandomChat = async (userId) => {
    try {
        if (!userId) {
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
            // Получаем всех пользователей в очереди
            const queueRef = collection(db, "searchQueue");
            const queueSnap = await getDocs(queueRef);
            
            // Если очередь не пуста, выбираем случайного пользователя
            if (!queueSnap.empty) {
                // Конвертируем снапшот в массив
                const queueUsers = queueSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                // Фильтруем, чтобы не выбрать самого себя (на всякий случай)
                const otherUsers = queueUsers.filter(queueUser => queueUser.userId !== userId);
                
                if (otherUsers.length > 0) {
                    // Выбираем случайного пользователя из очереди
                    const randomIndex = Math.floor(Math.random() * otherUsers.length);
                    const partnerQueueDoc = otherUsers[randomIndex];
                    
                    // Удаляем выбранного пользователя из очереди
                    await deleteDoc(doc(db, "searchQueue", partnerQueueDoc.id));
                    
                    // Создаем новый чат между пользователями
                    const chatId = await createChat(userId, partnerQueueDoc.userId);
                    
                    console.log(`Найден собеседник ${partnerQueueDoc.userId} для ${userId}, создан чат ${chatId}`);
                    
                    return chatId;
                }
            }
            
            // Если не нашли собеседника, добавляем пользователя в очередь
            await addDoc(collection(db, "searchQueue"), {
                userId: userId,
                timestamp: serverTimestamp()
            });
            
            console.log(`Пользователь ${userId} добавлен в очередь поиска`);
            
            // Возвращаем null, т.к. чат не создан
            return null;
        } catch (firestoreError) {
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

        // Получаем информацию о пользователях для сохранения в чате
        const [user1Doc, user2Doc] = await Promise.all([
            getUserById(user1Id),
            getUserById(user2Id)
        ]);

        // Создаем объект с информацией о участниках
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
        
        // Изменяем проверку на активность чата - не блокируем отправку если чат не активен
        // Пользователи должны иметь возможность отправить прощальное сообщение
        
        const messageData = {
            ...message,
            id: generateMessageId(),
            status: 'sent'
        };

        // Обновляем документ чата, добавляя новое сообщение в массив сообщений
        await updateDoc(chatRef, {
            messages: arrayUnion(messageData),
            lastMessageAt: serverTimestamp(),
            lastMessagePreview: message.text.substring(0, 50) + (message.text.length > 50 ? '...' : '')
        });

        // Обновляем счетчик сообщений для отправителя
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
        const chatDoc = await getDoc(doc(db, "chats", chatId));
        if (!chatDoc.exists()) {
            return null;
        }
        
        return {
            id: chatDoc.id,
            ...chatDoc.data(),
            // Преобразуем timestamp в обычную дату, если он есть
            createdAt: chatDoc.data().createdAt ? chatDoc.data().createdAt.toDate() : null,
            lastMessageAt: chatDoc.data().lastMessageAt ? chatDoc.data().lastMessageAt.toDate() : null
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
