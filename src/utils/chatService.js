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
    limit,
    limitToLast,
    increment
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { incrementCompletedChats, incrementMessagesCount, incrementChatStarted } from './statisticsService';
import { sanitizeData } from './firebaseUtils';
import { createRequiredIndexes, getIndexCreationInstructions } from './firebaseIndexCreator';
import { updateChatStartStatistics, updateMessageStatistics, updateChatEndStatistics } from './statisticsService';

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
 * Создание нового чата между двумя пользователями
 * @param {string} user1Id ID первого пользователя
 * @param {string} user2Id ID второго пользователя
 * @returns {Promise<string>} ID созданного чата
 */
export const createChat = async (user1Id, user2Id) => {
    try {
        // Проверка существования ID пользователей
        if (!user1Id || !user2Id) {
            throw new Error("ID одного или обоих пользователей не указаны");
        }

        // Проверяем существование пользователей в базе данных
        const user1Ref = doc(db, "users", user1Id);
        const user2Ref = doc(db, "users", user2Id);
        
        const [user1Doc, user2Doc] = await Promise.all([
            getDoc(user1Ref),
            getDoc(user2Ref)
        ]);
        
        // Получаем данные Telegram из sessionStorage
        let telegramData = null;
        try {
            const cachedTelegramUser = sessionStorage.getItem('telegramUser');
            if (cachedTelegramUser) {
                telegramData = JSON.parse(cachedTelegramUser);
            }
        } catch (err) {
            console.warn('Ошибка при получении данных Telegram из sessionStorage:', err);
        }
        
        // Определяем платформу пользователя
        let platform = 'web';
        if (telegramData) {
            platform = telegramData.is_mobile_telegram ? 'telegram_mobile' : 'telegram_web';
        } else if (/Mobi|Android/i.test(navigator.userAgent)) {
            platform = 'mobile_web';
        }
        
        // Если пользователей нет, создаем базовые документы для них
        const createUserPromises = [];
        
        if (!user1Doc.exists()) {
            console.log(`Пользователь ${user1Id} не существует, создаем базовый документ`);
            
            // Проверяем, соответствует ли текущий пользователь первому ID
            let userData = {
                id: user1Id,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                platform: platform,
                userColor: '#' + Math.floor(Math.random()*16777215).toString(16)
            };
            
            // Добавляем данные Telegram, если это текущий пользователь
            if (telegramData) {
                const currentUserId = localStorage.getItem('current_user_id');
                if (currentUserId === user1Id) {
                    userData.telegramData = {
                        telegramId: telegramData.id?.toString(),
                        username: telegramData.username || '',
                        firstName: telegramData.first_name || '',
                        lastName: telegramData.last_name || '',
                        languageCode: telegramData.language_code || 'ru'
                    };
                    userData.name = telegramData.first_name || "Пользователь";
                }
            }
            
            createUserPromises.push(
                setDoc(user1Ref, userData)
            );
        }
        
        if (!user2Doc.exists()) {
            console.log(`Пользователь ${user2Id} не существует, создаем базовый документ`);
            
            // Проверяем, соответствует ли текущий пользователь второму ID
            let userData = {
                id: user2Id,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                platform: platform,
                userColor: '#' + Math.floor(Math.random()*16777215).toString(16)
            };
            
            // Добавляем данные Telegram, если это текущий пользователь
            if (telegramData) {
                const currentUserId = localStorage.getItem('current_user_id');
                if (currentUserId === user2Id) {
                    userData.telegramData = {
                        telegramId: telegramData.id?.toString(),
                        username: telegramData.username || '',
                        firstName: telegramData.first_name || '',
                        lastName: telegramData.last_name || '',
                        languageCode: telegramData.language_code || 'ru'
                    };
                    userData.name = telegramData.first_name || "Пользователь";
                }
            }
            
            createUserPromises.push(
                setDoc(user2Ref, userData)
            );
        }
        
        if (createUserPromises.length > 0) {
            await Promise.all(createUserPromises);
        }

        // Получаем данные пользователей после создания (если были созданы)
        const [updatedUser1Doc, updatedUser2Doc] = await Promise.all([
            getDoc(user1Ref),
            getDoc(user2Ref)
        ]);
        
        const user1Data = updatedUser1Doc.data();
        const user2Data = updatedUser2Doc.data();
        
        // Создаем новый чат в коллекции chats
        const chatData = {
            participants: [user1Id, user2Id],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            isActive: true,
            lastMessage: null,
            messagesCount: 0,
            participantsNotified: {
                [user1Id]: true,
                [user2Id]: true
            },
            // Добавляем метаданные для участников
            participantsData: {
                [user1Id]: {
                    name: user1Data?.name || 'Пользователь 1',
                    platform: user1Data?.platform || platform,
                    userColor: user1Data?.userColor || '#' + Math.floor(Math.random()*16777215).toString(16)
                },
                [user2Id]: {
                    name: user2Data?.name || 'Пользователь 2',
                    platform: user2Data?.platform || 'unknown',
                    userColor: user2Data?.userColor || '#' + Math.floor(Math.random()*16777215).toString(16)
                }
            }
        };
        
        const chatRef = await addDoc(collection(db, "chats"), chatData);

        const chatId = chatRef.id;
        console.log(`Создан новый чат между пользователями ${user1Id} (${user1Data?.platform || platform}) и ${user2Id} (${user2Data?.platform || 'unknown'})`);

        // Обновляем статистику для обоих пользователей
        try {
            await updateChatStartStatistics(user1Id);
            await updateChatStartStatistics(user2Id);
        } catch (statsError) {
            console.error('Ошибка при обновлении статистики чата:', statsError);
            // Продолжаем работу даже при ошибке статистики
        }

        return chatId;
    } catch (error) {
        console.error("Ошибка при создании чата:", error);
        throw error;
    }
};

/**
 * Поиск случайного собеседника
 * @param {string} userId ID пользователя
 * @returns {Promise<string|null>} ID созданного чата или null, если собеседник не найден
 */
export const findRandomChat = async (userId) => {
    try {
        if (!userId) {
            console.error("ID пользователя не указан");
            return null;
        }

        console.log(`Поиск собеседника для ${userId}`);

        // Проверяем, существует ли пользователь в Firebase
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);

        // Определяем платформу пользователя
        let platform = 'web';
        let telegramData = null;
        
        try {
            // Получаем данные Telegram из sessionStorage, если они там есть
            const cachedTelegramUser = sessionStorage.getItem('telegramUser');
            if (cachedTelegramUser) {
                telegramData = JSON.parse(cachedTelegramUser);
                platform = telegramData.is_mobile_telegram ? 'telegram_mobile' : 'telegram_web';
            } else if (/Mobi|Android/i.test(navigator.userAgent)) {
                platform = 'mobile_web';
            }
        } catch (err) {
            console.warn('Ошибка при получении данных Telegram из sessionStorage:', err);
        }

        // Создаем или обновляем пользователя с данными телеграм, если они доступны
        if (!userDoc.exists()) {
            await setDoc(userRef, {
                id: userId,
                createdAt: serverTimestamp(),
                lastActive: serverTimestamp(),
                platform,
                telegramData: telegramData ? {
                    telegramId: telegramData.id?.toString(),
                    username: telegramData.username || '',
                    firstName: telegramData.first_name || '',
                    lastName: telegramData.last_name || ''
                } : null
            });
        } else {
            // Обновляем последнюю активность и платформу
            await updateDoc(userRef, {
                lastActive: serverTimestamp(),
                platform
            });
            
            // Добавляем данные Telegram, если их еще нет
            if (telegramData && !userDoc.data().telegramData) {
                await updateDoc(userRef, {
                    telegramData: {
                        telegramId: telegramData.id?.toString(),
                        username: telegramData.username || '',
                        firstName: telegramData.first_name || '',
                        lastName: telegramData.last_name || ''
                    }
                });
            }
        }

        // Ищем пользователя, ожидающего в очереди подбора
        const searchQueueQuery = query(
            collection(db, "searchQueue"),
            where("userId", "!=", userId),
            where("status", "==", "waiting"),
            orderBy("userId"),
            orderBy("createdAt", "asc"),
            limit(1)
        );

        const queueSnapshot = await getDocs(searchQueueQuery);

        if (!queueSnapshot.empty) {
            // Нашли подходящего собеседника
            const queueDoc = queueSnapshot.docs[0];
            const queueData = queueDoc.data();
            
            console.log(`Найден собеседник: ${queueData.userId} (платформа: ${queueData.platform || 'unknown'})`);

            // Создаем чат с найденным собеседником
            const chatId = await createChat(userId, queueData.userId);

            // Удаляем запись из очереди поиска
            await deleteDoc(doc(db, "searchQueue", queueDoc.id));

            return chatId;
        } else {
            // Не нашли собеседника, добавляем пользователя в очередь поиска
            console.log(`Добавляем пользователя ${userId} (${platform}) в очередь поиска`);
            
            const searchQueueRef = collection(db, "searchQueue");
            await addDoc(searchQueueRef, {
                userId,
                platform, // Добавляем информацию о платформе
                status: "waiting",
                createdAt: serverTimestamp(),
                telegramData: telegramData ? {
                    telegramId: telegramData.id?.toString(),
                    username: telegramData.username || '',
                    firstName: telegramData.first_name || '',
                    lastName: telegramData.last_name || ''
                } : null
            });

            return null;
        }
    } catch (error) {
        console.error("Ошибка при поиске собеседника:", error);
        
        if (error.code === "resource-exhausted") {
            throw new Error("Превышены лимиты запросов. Пожалуйста, попробуйте позже.");
        } else if (error.code === "permission-denied") {
            throw new Error("Необходимо создать индекс для коллекции searchQueue. Обратитесь к администратору.");
        } else {
            throw error;
        }
    }
};

/**
 * Проверка статуса поиска собеседника
 * @param {string} userId ID пользователя
 * @returns {Promise<Object|null>} Информация о найденном чате или null
 */
export const checkChatMatchStatus = async (userId) => {
    try {
        // Проверка корректного ID пользователя
        if (!userId) {
            console.error("ID пользователя не определен при проверке статуса чата");
            return null;
        }

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
            
            // Определяем платформу пользователя
            let platform = 'web';
            let telegramData = null;
            try {
                const cachedTelegramUser = sessionStorage.getItem('telegramUser');
                if (cachedTelegramUser) {
                    telegramData = JSON.parse(cachedTelegramUser);
                    platform = telegramData.is_mobile_telegram ? 'telegram_mobile' : 'telegram_web';
                } else if (/Mobi|Android/i.test(navigator.userAgent)) {
                    platform = 'mobile_web';
                }
            } catch (err) {
                console.warn('Ошибка при определении платформы:', err);
            }

            // Проверяем для отладки
            console.log(`Проверка чата ${chatDoc.id} для пользователя ${userId} (${platform})`);
            
            // Обновляем платформу пользователя в метаданных чата, если необходимо
            if (chatData.participantsData && chatData.participantsData[userId]) {
                if (chatData.participantsData[userId].platform !== platform) {
                    console.log(`Обновляем платформу пользователя ${userId} с ${chatData.participantsData[userId].platform} на ${platform}`);
                    try {
                        await updateDoc(doc(db, "chats", chatDoc.id), {
                            [`participantsData.${userId}.platform`]: platform,
                            updatedAt: serverTimestamp()
                        });
                    } catch (updateErr) {
                        console.warn('Ошибка при обновлении платформы пользователя:', updateErr);
                    }
                }
            }

            // Проверяем уведомления для пользователя
            if (!chatData.participantsNotified || chatData.participantsNotified[userId]) {
                // Готовим данные для ответа
                const result = {
                    id: chatDoc.id,
                    ...chatData,
                    createdAt: chatData.createdAt ? chatData.createdAt.toDate() : new Date(),
                    currentPlatform: platform
                };
                
                // Находим информацию о собеседнике
                if (chatData.participants && chatData.participants.length > 1) {
                    const partnerId = chatData.participants.find(id => id !== userId);
                    if (partnerId) {
                        result.partner = {
                            id: partnerId,
                            ...((chatData.participantsData && chatData.participantsData[partnerId]) || {})
                        };
                        
                        // Пытаемся получить дополнительную информацию о партнере
                        try {
                            const partnerDoc = await getDoc(doc(db, "users", partnerId));
                            if (partnerDoc.exists()) {
                                const partnerData = partnerDoc.data();
                                result.partner = {
                                    ...result.partner,
                                    name: partnerData.name || result.partner.name || 'Собеседник',
                                    telegramData: partnerData.telegramData,
                                    platform: partnerData.platform || result.partner.platform || 'unknown'
                                };
                            }
                        } catch (err) {
                            console.warn(`Ошибка при получении данных партнера ${partnerId}:`, err);
                        }
                    }
                }
                
                return result;
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
 * @param {string} senderId ID отправителя
 * @param {string} text Текст сообщения
 * @returns {Promise<string>} ID созданного сообщения
 */
export const sendChatMessage = async (chatId, senderId, text) => {
    try {
        // Проверка валидности параметров
        if (!chatId || !senderId || !text.trim()) {
            throw new Error("Недостаточно данных для отправки сообщения");
        }

        // Получаем информацию о пользователе
        const userDoc = await getDoc(doc(db, "users", senderId));
        const userData = userDoc.exists() ? userDoc.data() : { name: "Неизвестный пользователь" };

        // Получаем данные Telegram из пользователя или из sessionStorage
        let telegramData = null;
        if (userData.telegramData) {
            telegramData = userData.telegramData;
        } else {
            try {
                const cachedTelegramUser = sessionStorage.getItem('telegramUser');
                if (cachedTelegramUser) {
                    telegramData = JSON.parse(cachedTelegramUser);
                    
                    // Обновляем документ пользователя с данными Telegram, если они не сохранены
                    if (userDoc.exists()) {
                        await updateDoc(doc(db, "users", senderId), {
                            telegramData: {
                                telegramId: telegramData.id?.toString(),
                                username: telegramData.username || '',
                                firstName: telegramData.first_name || '',
                                lastName: telegramData.last_name || '',
                                languageCode: telegramData.language_code || 'ru'
                            },
                            updatedAt: serverTimestamp()
                        });
                    }
                }
            } catch (err) {
                console.warn('Ошибка при получении данных Telegram из sessionStorage:', err);
            }
        }

        // Текущее время для использования в нескольких местах
        const currentTime = new Date();

        // Создаем новое сообщение
        const messageData = {
            chatId,
            senderId,
            senderName: userData.name || (telegramData?.firstName || "Неизвестный пользователь"),
            text,
            timestamp: serverTimestamp(), // Серверное время
            clientTimestamp: currentTime, // Время клиента
            read: false,
            type: 'text'
        };
        
        // Добавляем данные Telegram, если они доступны
        if (telegramData) {
            messageData.telegramData = {
                telegramId: telegramData.id?.toString() || telegramData.telegramId,
                username: telegramData.username || '',
                firstName: telegramData.firstName || telegramData.first_name || '',
                lastName: telegramData.lastName || telegramData.last_name || ''
            };
        }

        // Добавляем сообщение в коллекцию
        const messageRef = await addDoc(collection(db, "messages"), messageData);
        const messageId = messageRef.id;

        // Обновляем информацию о последнем сообщении в чате
        // Важно: не используем serverTimestamp() внутри arrayUnion()
        const lastMessageData = {
            text,
            senderId,
            senderName: userData.name || (telegramData?.firstName || "Неизвестный пользователь"),
            timestamp: currentTime // Используем время клиента вместо serverTimestamp()
        };
        
        // Добавляем данные Telegram в последнее сообщение, если они доступны
        if (telegramData) {
            lastMessageData.telegramData = {
                telegramId: telegramData.id?.toString() || telegramData.telegramId,
                username: telegramData.username || '',
                firstName: telegramData.firstName || telegramData.first_name || '',
                lastName: telegramData.lastName || telegramData.last_name || ''
            };
        }
        
        await updateDoc(doc(db, "chats", chatId), {
            lastMessage: lastMessageData,
            updatedAt: serverTimestamp(),
            messagesCount: increment(1),
            // Если нужно обновить массив с сообщениями, используем clientTimestamp вместо serverTimestamp()
            recentMessages: arrayUnion({
                id: messageId,
                text: text.substring(0, 50) + (text.length > 50 ? "..." : ""),
                senderId,
                senderName: userData.name || (telegramData?.firstName || "Неизвестный пользователь"),
                timestamp: currentTime.toISOString() // Преобразуем Date в строку ISO
            })
        });

        // Обновляем статистику отправителя
        try {
            await updateMessageStatistics(senderId, chatId);
        } catch (statsError) {
            console.warn('Ошибка при обновлении статистики сообщений:', statsError);
            // Продолжаем работу даже при ошибке статистики
        }

        return messageId;
    } catch (error) {
        console.error("Ошибка при отправке сообщения:", error);
        throw new Error("Не удалось отправить сообщение. Пожалуйста, попробуйте еще раз.");
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
 * @param {string} chatId ID чата
 * @param {number} limit Максимальное количество сообщений
 * @returns {Promise<Array>} Массив сообщений
 */
export const getChatMessages = async (chatId, limit = 100) => {
    try {
        // Проверяем наличие chatId
        if (!chatId) {
            throw new Error("ID чата не указан");
        }

        try {
            // Создаем запрос к сообщениям этого чата, сортируя по времени
            const messagesQuery = query(
                collection(db, "messages"),
                where("chatId", "==", chatId),
                orderBy("timestamp", "asc"),
                limitToLast(limit)
            );

            const messagesSnapshot = await getDocs(messagesQuery);
            return messagesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate?.() || null
            }));
        } catch (indexError) {
            // Проверяем, связана ли ошибка с отсутствием индекса
            if (indexError.message.includes('index') ||
                indexError.code === 'failed-precondition') {
                console.warn('Ошибка индекса при получении сообщений:', indexError);

                // Пытаемся создать индекс автоматически
                await createRequiredIndexes();

                // Если индекс не создан, пробуем использовать запрос без сортировки
                const fallbackQuery = query(
                    collection(db, "messages"),
                    where("chatId", "==", chatId)
                );

                const fallbackSnapshot = await getDocs(fallbackQuery);
                const messages = fallbackSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    timestamp: doc.data().timestamp?.toDate?.() || null
                }));

                // Сортируем на клиенте
                return messages.sort((a, b) => {
                    const timeA = a.timestamp ? a.timestamp.getTime() : 0;
                    const timeB = b.timestamp ? b.timestamp.getTime() : 0;
                    return timeA - timeB;
                });
            } else {
                throw indexError;
            }
        }
    } catch (error) {
        console.error("Ошибка при получении сообщений чата:", error);
        throw error;
    }
};

/**
 * Завершение чата
 * @param {string} chatId ID чата
 * @param {Object} options Дополнительные параметры
 * @returns {Promise<boolean>} Результат операции
 */
export const endChat = async (chatId, options = {}) => {
    try {
        if (!chatId) {
            throw new Error("ID чата не указан");
        }

        // Получаем данные чата
        const chatRef = doc(db, "chats", chatId);
        const chatSnap = await getDoc(chatRef);

        if (!chatSnap.exists()) {
            throw new Error(`Чат с ID ${chatId} не найден`);
        }

        const chatData = chatSnap.data();
        const { participants = [], messagesCount = 0, createdAt } = chatData;

        // Вычисляем продолжительность чата в минутах
        const startTime = createdAt?.toDate?.() || new Date();
        const endTime = new Date();
        const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));

        // Обновляем статус чата
        await updateDoc(chatRef, {
            isActive: false,
            endedAt: serverTimestamp(),
            duration: durationMinutes
        });

        // Обновляем статистику для всех участников
        for (const userId of participants) {
            try {
                await updateChatEndStatistics(userId, chatId, messagesCount, durationMinutes);
            } catch (statsError) {
                console.warn(`Ошибка при обновлении статистики для пользователя ${userId}:`, statsError);
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
