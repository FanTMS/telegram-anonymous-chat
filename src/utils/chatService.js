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
    increment,
    runTransaction
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
 * @param {string} userId ID пользователя, который ищет собеседника
 * @returns {Promise<Object|null>} Информация о найденном чате или null
 */
export const findRandomChat = async (userId) => {
    try {
        // Проверяем, что пользователь существует в базе
        const userDoc = await getDoc(doc(db, "users", userId));
        if (!userDoc.exists()) {
            console.error(`Пользователь с ID ${userId} не найден в базе данных`);
            return null;
        }

        // Обновляем lastActive и платформу пользователя
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
            
            await updateDoc(doc(db, "users", userId), {
                lastActive: serverTimestamp(),
                platform: platform
            });
        } catch (err) {
            console.warn('Ошибка при обновлении статуса пользователя:', err);
        }

        // Ищем пользователя, который уже ждет в очереди поиска
        const searchQueueQuery = query(
            collection(db, "searchQueue"),
            where("status", "==", "waiting"),
            where("userId", "!=", userId),
            orderBy("userId"),
            orderBy("createdAt"),
            limit(10)
        );

        const queueSnapshot = await getDocs(searchQueueQuery);
        
        // Если нашли ожидающих пользователей
        if (!queueSnapshot.empty) {
            console.log(`Найдено ${queueSnapshot.size} ожидающих пользователей`);
            
            // Проходим по найденным пользователям и выбираем первого, с которым можно создать чат
            for (const queueDoc of queueSnapshot.docs) {
                const queueData = queueDoc.data();
                const potentialPartnerId = queueData.userId;
                
                // Получаем данные потенциального партнера
                try {
                    // Проверяем, существует ли пользователь и активен ли он
                    const partnerDoc = await getDoc(doc(db, "users", potentialPartnerId));
                    if (!partnerDoc.exists()) {
                        console.log(`Потенциальный партнер ${potentialPartnerId} не найден, пропускаем`);
                        // Удаляем его из очереди, так как он не существует
                        await deleteDoc(doc(db, "searchQueue", queueDoc.id));
                        continue;
                    }
                    
                    const partnerData = partnerDoc.data();
                    // Если последняя активность пользователя была более 5 минут назад, пропускаем его
                    if (partnerData.lastActive) {
                        const lastActiveTime = partnerData.lastActive.toDate();
                        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
                        if (lastActiveTime < fiveMinutesAgo) {
                            console.log(`Партнер ${potentialPartnerId} неактивен более 5 минут, пропускаем`);
                            // Удаляем его из очереди поиска
                            await deleteDoc(doc(db, "searchQueue", queueDoc.id));
                            continue;
                        }
                    }
                    
                    // Проверяем, нет ли уже активного чата между этими пользователями
                    const existingChatQuery = query(
                        collection(db, "chats"),
                        where("participants", "array-contains", userId),
                        where("isActive", "==", true)
                    );
                    
                    const chatSnapshot = await getDocs(existingChatQuery);
                    let chatExists = false;
                    
                    for (const chatDoc of chatSnapshot.docs) {
                        const chatData = chatDoc.data();
                        if (chatData.participants.includes(potentialPartnerId)) {
                            console.log(`Уже существует активный чат между ${userId} и ${potentialPartnerId}`);
                            chatExists = true;
                            break;
                        }
                    }
                    
                    if (chatExists) continue;
                    
                    // Создаем чат с этим пользователем
                    console.log(`Создаем чат между ${userId} и ${potentialPartnerId}`);
                    
                    // Создаем объект с данными участников
                    const participantsData = {};
                    
                    // Данные текущего пользователя
                    const userData = userDoc.data();
                    participantsData[userId] = {
                        name: userData.name || 'Пользователь',
                        platform: platform,
                        unreadCount: 0
                    };
                    
                    // Данные партнера
                    const partnerPlatform = partnerData.platform || 'web';
                    participantsData[potentialPartnerId] = {
                        name: partnerData.name || 'Собеседник',
                        platform: partnerPlatform,
                        unreadCount: 0
                    };
                    
                    // Создаем чат в Firestore
                    const chatRef = await addDoc(collection(db, "chats"), {
                        participants: [userId, potentialPartnerId],
                        participantsData: participantsData,
                        type: "random", // Указываем тип чата - случайный
                        isActive: true,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp(),
                        lastMessage: {
                            text: "Чат создан",
                            timestamp: serverTimestamp()
                        },
                        messages: []
                    });
                    
                    // Удаляем пользователя из очереди поиска
                    await deleteDoc(doc(db, "searchQueue", queueDoc.id));
                    
                    // Возвращаем информацию о созданном чате
                    return {
                        id: chatRef.id,
                        partner: {
                            id: potentialPartnerId,
                            name: partnerData.name || 'Собеседник',
                            platform: partnerPlatform
                        },
                        currentPlatform: platform
                    };
                } catch (err) {
                    console.error(`Ошибка при обработке потенциального партнера ${potentialPartnerId}:`, err);
                    continue;
                }
            }
        }
        
        // Если не нашли подходящего собеседника, добавляем пользователя в очередь поиска
        console.log(`Не найдено подходящих собеседников для ${userId}, добавляем в очередь поиска`);
        
        // Сначала проверяем, нет ли уже пользователя в очереди
        const userQueueQuery = query(
            collection(db, "searchQueue"),
            where("userId", "==", userId)
        );
        
        const userQueueSnapshot = await getDocs(userQueueQuery);
        
        // Если пользователь уже в очереди, просто обновляем его статус
        if (!userQueueSnapshot.empty) {
            const queueDoc = userQueueSnapshot.docs[0];
            await updateDoc(doc(db, "searchQueue", queueDoc.id), {
                status: "waiting",
                updatedAt: serverTimestamp()
            });
            console.log(`Пользователь ${userId} уже в очереди, статус обновлен`);
        } else {
            // Добавляем пользователя в очередь поиска
            await addDoc(collection(db, "searchQueue"), {
                userId: userId,
                status: "waiting",
                platform: platform,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            console.log(`Пользователь ${userId} добавлен в очередь поиска`);
        }
        
        return null;
    } catch (error) {
        console.error("Ошибка при поиске случайного собеседника:", error);
        return null;
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
            
            // Пытаемся получить ID из localStorage или sessionStorage
            const savedUserId = localStorage.getItem('current_user_id') || sessionStorage.getItem('current_user_id');
            if (savedUserId) {
                console.log("Получен ID пользователя из хранилища:", savedUserId);
                userId = savedUserId;
            } else {
                // Пытаемся получить из Telegram данных
                try {
                    const telegramData = sessionStorage.getItem('telegramUser');
                    if (telegramData) {
                        const parsedData = JSON.parse(telegramData);
                        if (parsedData && parsedData.id) {
                            userId = `tg_${parsedData.id}`;
                            console.log("Получен ID пользователя из данных Telegram:", userId);
                        }
                    }
                } catch (e) {
                    console.warn("Ошибка при получении ID из данных Telegram:", e);
                }
                
                if (!userId) {
                    return null;
                }
            }
        }

        // Ищем только активные обычные чаты (не чаты поддержки)
        const chatsQuery = query(
            collection(db, "chats"),
            where("participants", "array-contains", userId),
            where("isActive", "==", true),
            where("type", "!=", "support"), // Исключаем чаты поддержки
            orderBy("type"), // Необходимо для использования неравенства в where
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
            console.log(`Проверка чата ${chatDoc.id} для пользователя ${userId} (${platform}). Тип чата: ${chatData.type || 'обычный'}`);
            
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
 * Регистрация функции очистки при закрытии страницы
 * @param {string} userId ID пользователя
 */
export const registerSearchCleanup = (userId) => {
    if (!userId) return;
    
    // Сохраняем ID пользователя для использования в событии beforeunload
    sessionStorage.setItem('current_search_user', userId);
    
    // Убедимся, что функция будет добавлена только один раз
    if (!window.__searchCleanupRegistered) {
        window.addEventListener('beforeunload', async () => {
            try {
                const currentSearchUser = sessionStorage.getItem('current_search_user');
                if (currentSearchUser) {
                    // Используем синхронный запрос для гарантированного выполнения
                    const xhr = new XMLHttpRequest();
                    xhr.open('POST', '/api/cancel-search', false); // Синхронный запрос
                    xhr.setRequestHeader('Content-Type', 'application/json');
                    xhr.send(JSON.stringify({ userId: currentSearchUser }));
                    
                    // В случае отсутствия API используем также и обычный метод
                    cancelSearch(currentSearchUser).catch(console.error);
                }
            } catch (error) {
                console.error('Ошибка при очистке поиска:', error);
            }
        });
        
        window.__searchCleanupRegistered = true;
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
        console.log(`Отправка сообщения в чат ${chatId} от пользователя ${senderId}`);
        
        // Проверка валидности параметров
        if (!chatId || !senderId) {
            throw new Error("Недостаточно данных для отправки сообщения");
        }
        
        // Проверка и форматирование текста сообщения
        let messageText = text;
        
        // Если текст это объект (для системных сообщений), извлекаем данные
        if (typeof text === 'object' && text !== null) {
            messageText = text.text || '';
            // Используем переданные данные для системного сообщения
            if (text.type === 'system') {
                const systemMessageData = {
                    chatId,
                    type: 'system',
                    text: messageText,
                    timestamp: serverTimestamp(),
                    clientTimestamp: new Date(),
                    read: true
                };
                
                const messageRef = await addDoc(collection(db, "messages"), systemMessageData);
                return messageRef.id;
            }
        } else if (!text || typeof text !== 'string' || !text.trim()) {
            throw new Error("Текст сообщения не может быть пустым");
        }

        // Получаем информацию о чате для определения его типа (обычный чат или поддержка)
        const chatDoc = await getDoc(doc(db, "chats", chatId));
        if (!chatDoc.exists()) {
            throw new Error("Чат не существует");
        }
        
        const chatData = chatDoc.data();
        
        // Проверяем статус чата - если завершен, не отправляем сообщение
        if (chatData.status === 'ended' || chatData.status === 'resolved' || chatData.isActive === false) {
            throw new Error("Нельзя отправлять сообщения в завершенный чат");
        }
        
        const isSupportChat = chatData.type === 'support';
        
        console.log(`Тип чата: ${isSupportChat ? 'поддержка' : 'обычный'}`);

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
                            telegramId: telegramData.id?.toString(),
                            telegramUsername: telegramData.username || '',
                            telegramFirstName: telegramData.first_name || '',
                            telegramLastName: telegramData.last_name || '',
                            telegramLanguageCode: telegramData.language_code || 'ru',
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
            senderName: userData.name || (telegramData?.firstName || telegramData?.first_name || "Неизвестный пользователь"),
            text,
            timestamp: serverTimestamp(), // Серверное время
            clientTimestamp: currentTime, // Время клиента
            read: false,
            type: 'text'
        };
        
        // Сохраняем только нужные поля из Telegram данных как обычные поля сообщения
        if (telegramData) {
            messageData.telegramId = telegramData.id?.toString() || telegramData.telegramId;
            messageData.telegramUsername = telegramData.username || '';
            messageData.telegramFirstName = telegramData.firstName || telegramData.first_name || '';
            messageData.telegramLastName = telegramData.lastName || telegramData.last_name || '';
            // Не добавляем поле telegramData, чтобы избежать ошибки React #31
        }

        // Добавляем сообщение в коллекцию
        const messageRef = await addDoc(collection(db, "messages"), messageData);
        const messageId = messageRef.id;
        console.log(`Сообщение добавлено с ID: ${messageId}`);

        // Обновляем информацию о последнем сообщении в чате
        // Важно: не используем serverTimestamp() внутри arrayUnion()
        const lastMessageData = {
            text,
            senderId,
            senderName: userData.name || (telegramData?.firstName || telegramData?.first_name || "Неизвестный пользователь"),
            timestamp: currentTime // Используем время клиента вместо serverTimestamp()
        };
        
        // Сохраняем только нужные поля из Telegram данных как обычные поля
        if (telegramData) {
            lastMessageData.telegramId = telegramData.id?.toString() || telegramData.telegramId;
            lastMessageData.telegramUsername = telegramData.username || '';
            lastMessageData.telegramFirstName = telegramData.firstName || telegramData.first_name || '';
            lastMessageData.telegramLastName = telegramData.lastName || telegramData.last_name || '';
            // Не добавляем поле telegramData, чтобы избежать ошибки React #31
        }
        
        // Обновляем данные чата в зависимости от его типа
        const updateData = {
            lastMessage: text.substring(0, 100), // Сокращаем длинные сообщения
            lastMessageTime: serverTimestamp(),
            lastMessageSenderId: senderId,
            updatedAt: serverTimestamp(),
            messagesCount: increment(1)
        };
        
        // Для чата поддержки добавляем флаг непрочитанных сообщений
        if (isSupportChat) {
            // Определяем, нужно ли устанавливать флаг непрочитанных сообщений
            if (senderId !== 'support') {
                updateData.unreadBySupport = true;
            } else {
                updateData.unreadByUser = true;
            }
        }
        
        await updateDoc(doc(db, "chats", chatId), updateData);
        console.log(`Данные чата обновлены с последним сообщением`);

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
        console.log('Получение чатов пользователя:', userId);
        
        if (!userId) {
            console.error('ID пользователя не передан в getUserChats');
            return [];
        }
        
        // Создаем запрос для получения всех чатов пользователя
        const q = query(
            collection(db, "chats"),
            where("participants", "array-contains", userId)
        );

        const querySnapshot = await getDocs(q);
        const chats = [];
        
        console.log(`Найдено ${querySnapshot.size} чатов для пользователя ${userId}`);

        // Преобразуем данные чатов
        querySnapshot.forEach((doc) => {
            const chatData = doc.data();
            
            // Включаем активные чаты и чаты поддержки (даже если они не активны)
            if (chatData.isActive || chatData.type === 'support') {
                const chatId = doc.id;
                
                // Получаем информацию о собеседнике для обычных чатов
                let partnerInfo = null;
                if (chatData.participants && chatData.participants.length > 0 && chatData.type !== 'support') {
                    // Находим ID собеседника
                    const partnerId = chatData.participants.find(id => id !== userId && id !== 'support');
                    
                    // Если есть информация о собеседнике в данных чата
                    if (partnerId && chatData.participantsData && chatData.participantsData[partnerId]) {
                        partnerInfo = chatData.participantsData[partnerId];
                    }
                }
                
                // Формируем объект чата с необходимыми данными
                const chat = {
                    id: chatId,
                    ...chatData,
                    createdAt: chatData.createdAt ? chatData.createdAt.toDate() : new Date(),
                    lastActivity: chatData.lastMessageTime ? chatData.lastMessageTime.toDate() : 
                                (chatData.updatedAt ? chatData.updatedAt.toDate() : new Date()),
                    lastMessageTime: chatData.lastMessageTime ? chatData.lastMessageTime.toDate() : new Date(),
                    isSupportChat: chatData.type === 'support',
                    name: chatData.type === 'support' ? 'Техническая поддержка' : 
                         (partnerInfo ? partnerInfo.name : 'Собеседник'),
                    partnerInfo
                };
                
                // Если это чат поддержки, отмечаем его специальным флагом
                if (chatData.type === 'support') {
                    chat.isSupportChat = true;
                    chat.pinned = true;
                }
                
                chats.push(chat);
            }
        });
        
        // Сортируем чаты: закрепленные сверху, затем по времени последнего сообщения
        chats.sort((a, b) => {
            // Если один чат закреплен, а другой нет
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            
            // Если оба закреплены или оба не закреплены, сортируем по времени последнего сообщения
            const timeA = a.lastMessageTime ? a.lastMessageTime.getTime() : 0;
            const timeB = b.lastMessageTime ? b.lastMessageTime.getTime() : 0;
            
            return timeB - timeA; // В порядке убывания (новые сверху)
        });
        
        console.log(`Возвращаем ${chats.length} чатов (после фильтрации)`);
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
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(limit));
        
        const querySnapshot = await getDocs(q);
        const messages = [];
        
        querySnapshot.forEach((doc) => {
            messages.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return messages;
    } catch (error) {
        console.error('Ошибка при получении сообщений чата:', error);
        throw error;
    }
};

/**
 * Завершение чата
 * @param {string} chatId ID чата
 * @param {string} userId ID пользователя, который завершает чат (опционально)
 * @returns {Promise<boolean>} true, если чат успешно завершен
 */
export const endChat = async (chatId, userId) => {
    try {
        if (!chatId) {
            console.error("Ошибка: ID чата не указан");
            throw new Error("ID чата не указан");
        }

        // Получаем данные чата
        const chatRef = doc(db, "chats", chatId);
        
        // Транзакция для безопасного обновления статуса чата
        return await runTransaction(db, async (transaction) => {
            const chatSnap = await transaction.get(chatRef);

            if (!chatSnap.exists()) {
                console.error(`Ошибка: Чат с ID ${chatId} не найден`);
                throw new Error(`Чат с ID ${chatId} не найден`);
            }

            const chatData = chatSnap.data();
            
            // Проверяем, не завершен ли уже чат
            if (chatData.status === 'ended' || chatData.status === 'resolved' || chatData.isActive === false) {
                console.warn("Чат уже завершен");
                return true; // Возвращаем true, так как это не ошибка с точки зрения пользователя
            }
            
            const { participants = [], messagesCount = 0, createdAt } = chatData;

            // Проверяем, является ли пользователь участником чата (если указан userId)
            if (userId && !participants.includes(userId)) {
                console.error('Ошибка: Пользователь не является участником чата', {userId, participants});
                throw new Error('Вы не являетесь участником этого чата');
            }

            // Вычисляем продолжительность чата в минутах
            const startTime = createdAt?.toDate?.() || new Date();
            const endTime = new Date();
            const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));

            // Обновляем статус чата в транзакции
            transaction.update(chatRef, {
                isActive: false,
                status: 'ended',
                endedAt: serverTimestamp(),
                duration: durationMinutes,
                ...(userId ? { endedBy: userId } : {})
            });
            
            return true;
        });
        
        // УДАЛЯЕМ ПРИ ИСПРАВЛЕНИИ: Системное сообщение о завершении теперь добавляется в компоненте Chat.js напрямую
        
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
 * @returns {Promise<string|null>} - ID чата поддержки или null, если чат не найден
 */
export const getSupportChatId = async (userId) => {
    try {
        if (!userId) {
            console.error('getSupportChatId: ID пользователя не передан');
            return null;
        }
        
        const q = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', userId),
            where('type', '==', 'support')
        );

        const querySnapshot = await getDocs(q);
        console.log(`Найдено ${querySnapshot.size} чатов поддержки для пользователя ${userId}`);

        if (querySnapshot.empty) {
            return null;
        }

        // Если найдено несколько чатов поддержки, возвращаем самый последний по дате обновления
        if (querySnapshot.size > 1) {
            console.warn(`Обнаружено несколько (${querySnapshot.size}) чатов поддержки для пользователя ${userId}. Возвращаем самый актуальный.`);
            
            let latestChat = null;
            let latestTime = new Date(0);
            
            querySnapshot.forEach(doc => {
                const chatData = doc.data();
                const chatTime = chatData.lastMessageTime?.toDate() || 
                                chatData.updatedAt?.toDate() || 
                                chatData.createdAt?.toDate() || 
                                new Date(0);
                
                if (chatTime > latestTime) {
                    latestTime = chatTime;
                    latestChat = doc.id;
                }
            });
            
            return latestChat;
        }

        // Если найден только один чат поддержки, возвращаем его ID
        return querySnapshot.docs[0].id;
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
        // Проверяем, что ID пользователя существует
        if (!userId) {
            console.error('createSupportChat: ID пользователя не передан');
            return null;
        }
        
        console.log('Создание чата поддержки для пользователя:', userId);
        
        // Проверяем, возможно чат уже существует - используем прямой запрос вместо getSupportChatId
        // чтобы избежать возможной рекурсии и иметь больше контроля над процессом
        const existingChatsQuery = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', userId),
            where('type', '==', 'support')
        );
        
        const existingChatsSnapshot = await getDocs(existingChatsQuery);
        
        if (!existingChatsSnapshot.empty) {
            console.log(`Найдено ${existingChatsSnapshot.size} существующих чатов поддержки`);
            
            // Если найдено несколько чатов, вернем самый последний
            if (existingChatsSnapshot.size > 1) {
                let latestChat = null;
                let latestTime = new Date(0);
                
                existingChatsSnapshot.forEach(doc => {
                    const chatData = doc.data();
                    const chatTime = chatData.lastMessageTime?.toDate() || 
                                     chatData.updatedAt?.toDate() || 
                                     chatData.createdAt?.toDate() || 
                                     new Date(0);
                    
                    if (chatTime > latestTime) {
                        latestTime = chatTime;
                        latestChat = doc.id;
                    }
                });
                
                console.log('Возвращаем самый актуальный чат поддержки:', latestChat);
                return latestChat;
            }
            
            // Если найден только один чат, вернем его
            const existingChatId = existingChatsSnapshot.docs[0].id;
            console.log('Найден существующий чат поддержки:', existingChatId);
            return existingChatId;
        }

        // Получаем данные пользователя для более персонализированного приветствия
        let userName = "пользователь";
        let userData = null;
        try {
            const userRef = doc(db, "users", userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                userData = userSnap.data();
                if (userData.name) {
                    userName = userData.name;
                } else if (userData.telegramData && userData.telegramData.firstName) {
                    userName = userData.telegramData.firstName;
                }
            } else {
                // Пытаемся получить данные из localStorage
                const cachedUser = localStorage.getItem('current_user');
                if (cachedUser) {
                    try {
                        const parsedUser = JSON.parse(cachedUser);
                        if (parsedUser.name) {
                            userName = parsedUser.name;
                        } else if (parsedUser.telegramData && parsedUser.telegramData.firstName) {
                            userName = parsedUser.telegramData.firstName;
                        }
                    } catch (e) {
                        console.warn('Ошибка при парсинге данных пользователя из localStorage:', e);
                    }
                }
            }
        } catch (error) {
            console.warn("Не удалось получить имя пользователя:", error);
        }

        // Текущее время для упорядочивания чатов
        const currentTime = new Date();

        // Создаем данные чата
        const chatData = {
            type: 'support',
            participants: [userId, 'support'],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastMessageTime: serverTimestamp(),
            isActive: true,
            lastMessage: 'Добро пожаловать в чат технической поддержки',
            name: 'Техническая поддержка',
            icon: '👨‍💻',
            pinned: true,
            unreadBySupport: true,
            unreadByUser: false,
            unreadCount: 0,
            isSupportChat: true  // Явно отмечаем, что это чат поддержки
        };

        console.log('Создание чата с данными:', chatData);
        
        // Создаем документ чата
        const chatRef = await addDoc(collection(db, 'chats'), chatData);
        const chatId = chatRef.id;
        console.log('Чат поддержки создан с ID:', chatId);

        // Создаем приветственное сообщение
        const welcomeMessageData = {
            chatId: chatId,
            senderId: 'support',
            senderName: 'Техническая поддержка',
            text: `Здравствуйте, ${userName}!\n\nДобро пожаловать в чат технической поддержки. Здесь вы можете задать любые вопросы о работе приложения, сообщить о проблемах или внести предложения по улучшению сервиса.\n\nМы постараемся ответить вам как можно скорее.`,
            timestamp: serverTimestamp(),
            readBy: ['support'],
            isAdminMessage: true
        };

        console.log('Создание приветственного сообщения');
        await addDoc(collection(db, "messages"), welcomeMessageData);

        // Обновляем данные последнего сообщения в чате
        await updateDoc(chatRef, {
            lastMessage: "Здравствуйте! Добро пожаловать в чат поддержки.",
            lastMessageTime: serverTimestamp(),
            lastMessageSenderId: 'support'
        });

        // Обновляем счетчик чатов поддержки
        try {
            const statsRef = doc(db, "statistics", "app");
            await updateDoc(statsRef, {
                supportChatsCount: increment(1)
            });
        } catch (error) {
            console.warn("Не удалось обновить статистику чатов поддержки:", error);
        }

        return chatId;
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

/**
 * Получение количества непрочитанных чатов пользователя
 * @param {string} userId - ID пользователя
 * @returns {Promise<number>} - Количество непрочитанных чатов
 */
export const getUnreadChatsCount = async (userId) => {
    try {
        if (!userId) {
            console.warn('getUnreadChatsCount: ID пользователя не указан');
            return 0;
        }
        
        // Получаем все чаты пользователя
        const chatsQuery = query(
            collection(db, "chats"),
            where("participants", "array-contains", userId),
            where("isActive", "==", true)
        );
        
        const chatsSnapshot = await getDocs(chatsQuery);
        
        if (chatsSnapshot.empty) {
            return 0;
        }
        
        // Подсчитываем количество непрочитанных чатов
        let unreadCount = 0;
        
        chatsSnapshot.forEach(doc => {
            const chatData = doc.data();
            
            // Чат считается непрочитанным, если:
            // 1. Последнее сообщение не от текущего пользователя
            // 2. Есть поле unreadBy, содержащее ID текущего пользователя
            if (
                (chatData.lastMessageSenderId && chatData.lastMessageSenderId !== userId) ||
                (chatData.unreadBy && chatData.unreadBy.includes(userId)) ||
                (chatData.type === 'support' && chatData.unreadByUser === true)
            ) {
                unreadCount++;
            }
        });
        
        return unreadCount;
    } catch (error) {
        console.error('Ошибка при получении количества непрочитанных чатов:', error);
        return 0;
    }
};

/**
 * Обновляет статус чата
 * @param {string} chatId - ID чата
 * @param {string} status - Новый статус чата
 * @returns {Promise<boolean>} - Результат операции
 */
export const updateChatStatus = async (chatId, status) => {
    try {
        const chatRef = doc(db, 'chats', chatId);
        await updateDoc(chatRef, {
            status: status,
            isActive: status !== 'ended',
            updatedAt: serverTimestamp()
        });
        
        return true;
    } catch (error) {
        console.error('Ошибка при обновлении статуса чата:', error);
        throw error;
    }
};
