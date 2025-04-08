import { db, auth } from '../firebase';
import { collection, addDoc, getDocs, query, where, orderBy, limit, serverTimestamp, updateDoc, doc, getDoc } from 'firebase/firestore';
import WebApp from '@twa-dev/sdk';

/**
 * Создание запроса в службу поддержки
 * @param {string} message - Текст сообщения пользователя
 * @returns {Promise<object>} - Созданный запрос
 */
export const createSupportRequest = async (message) => {
    try {
        // Получаем данные пользователя из WebApp
        let userId = '';
        let username = '';
        let firstName = '';

        try {
            if (WebApp && WebApp.initDataUnsafe && WebApp.initDataUnsafe.user) {
                userId = WebApp.initDataUnsafe.user.id.toString();
                username = WebApp.initDataUnsafe.user.username || '';
                firstName = WebApp.initDataUnsafe.user.first_name || '';
            }
        } catch (error) {
            console.error('Ошибка при получении данных пользователя:', error);
        }

        // Если не удалось получить ID пользователя из WebApp, пробуем получить из sessionStorage/localStorage
        if (!userId) {
            try {
                const userDataStr = sessionStorage.getItem('userData');
                if (userDataStr) {
                    const userData = JSON.parse(userDataStr);
                    userId = userData.telegramId || userData.id;
                }

                if (!userId) {
                    userId = localStorage.getItem('current_user_id');
                }
            } catch (e) {
                console.error('Ошибка при получении ID из хранилища:', e);
            }
        }

        if (!userId) {
            throw new Error('Не удалось определить ID пользователя');
        }

        console.log('Отправка запроса в поддержку с ID пользователя:', userId);

        const requestData = {
            userId: userId,
            username: username,
            firstName: firstName,
            message: message,
            status: 'new', // 'new', 'processing', 'resolved', 'rejected'
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            assignedTo: null, // ID администратора, который взял запрос в работу
            response: null, // Ответ администратора
        };

        const docRef = await addDoc(collection(db, 'supportRequests'), requestData);

        console.log('Запрос создан успешно, ID:', docRef.id);

        // Также добавляем запрос как сообщение в чат пользователя с поддержкой
        const chatResult = await addSupportChat(userId, message);

        if (!chatResult) {
            console.warn('Не удалось добавить сообщение в чат поддержки, но запрос создан');
        }

        return {
            id: docRef.id,
            ...requestData
        };
    } catch (error) {
        console.error('Ошибка при создании запроса в поддержку:', error);
        throw error;
    }
};

/**
 * Получение запросов в поддержку с фильтрацией по статусу
 * @param {string} status - Статус запросов ('new', 'processing', 'resolved', 'rejected')
 * @param {number} maxResults - Максимальное количество результатов
 * @returns {Promise<Array>} - Массив запросов
 */
export const getSupportRequests = async (status = null, maxResults = 50) => {
    try {
        let q;

        if (status) {
            q = query(
                collection(db, 'supportRequests'),
                where('status', '==', status),
                orderBy('createdAt', 'desc'),
                limit(maxResults)
            );
        } else {
            q = query(
                collection(db, 'supportRequests'),
                orderBy('createdAt', 'desc'),
                limit(maxResults)
            );
        }

        const querySnapshot = await getDocs(q);
        const requests = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            requests.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : data.createdAt) : new Date(),
                updatedAt: data.updatedAt ? (typeof data.updatedAt.toDate === 'function' ? data.updatedAt.toDate() : data.updatedAt) : new Date()
            });
        });

        return requests;
    } catch (error) {
        console.error('Ошибка при получении запросов в поддержку:', error);
        return []; // Возвращаем пустой массив вместо ошибки
    }
};

/**
 * Обновление статуса запроса в поддержку
 * @param {string} requestId - ID запроса
 * @param {string} status - Новый статус ('new', 'processing', 'resolved', 'rejected')
 * @param {string} adminId - ID администратора
 * @param {string} response - Ответ администратора (опционально)
 * @returns {Promise<boolean>} - Успешность операции
 */
export const updateSupportRequest = async (requestId, status, adminId, response = null) => {
    try {
        const requestRef = doc(db, 'supportRequests', requestId);
        const requestDoc = await getDoc(requestRef);

        if (!requestDoc.exists()) {
            throw new Error('Запрос не найден');
        }

        const requestData = requestDoc.data();
        const userId = requestData.userId;

        const updateData = {
            status: status,
            updatedAt: serverTimestamp()
        };

        if (status === 'processing') {
            updateData.assignedTo = adminId;
        }

        if (response) {
            updateData.response = response;

            // Добавляем ответ администратора в чат поддержки
            if (userId) {
                await addSupportChatResponse(userId, response, adminId);
            }
        }

        await updateDoc(requestRef, updateData);

        return true;
    } catch (error) {
        console.error('Ошибка при обновлении запроса в поддержку:', error);
        return false; // Возвращаем false вместо ошибки
    }
};

/**
 * Получение запросов в поддержку конкретного пользователя
 * @param {string} userId - ID пользователя
 * @returns {Promise<Array>} - Массив запросов
 */
export const getUserSupportRequests = async (userId) => {
    try {
        if (!userId) return [];

        const q = query(
            collection(db, 'supportRequests'),
            where('userId', '==', userId.toString()),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const requests = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            requests.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt ? (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : data.createdAt) : new Date(),
                updatedAt: data.updatedAt ? (typeof data.updatedAt.toDate === 'function' ? data.updatedAt.toDate() : data.updatedAt) : new Date()
            });
        });

        return requests;
    } catch (error) {
        console.error('Ошибка при получении запросов пользователя:', error);
        return []; // Возвращаем пустой массив вместо ошибки
    }
};

/**
 * Добавление сообщения в чат поддержки
 * @param {string} userId - ID пользователя
 * @param {string} message - Текст сообщения
 * @returns {Promise<boolean>} - Успешность операции
 */
export const addSupportChat = async (userId, message) => {
    try {
        console.log('Добавление сообщения в чат поддержки для пользователя:', userId);

        // Проверяем существование чата поддержки для пользователя
        let supportChatId = await getSupportChatId(userId);
        console.log('Найден существующий чат поддержки:', supportChatId);

        if (!supportChatId) {
            console.log('Создание нового чата поддержки...');
            supportChatId = await createSupportChat(userId);
            console.log('Создан новый чат поддержки:', supportChatId);
        }

        if (!supportChatId) {
            throw new Error('Не удалось создать чат с поддержкой');
        }

        // Получаем информацию о пользователе для отображения имени
        let senderName = "Пользователь";
        try {
            const userDoc = await getDoc(doc(db, "users", userId));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                if (userData.name) {
                    senderName = userData.name;
                } else if (userData.telegramData && userData.telegramData.firstName) {
                    senderName = userData.telegramData.firstName;
                }
            }
        } catch (userError) {
            console.warn('Не удалось получить данные пользователя:', userError);
        }

        // Добавляем сообщение в чат
        const messageData = {
            chatId: supportChatId,
            senderId: userId, // ID отправителя
            senderName: senderName, // Имя отправителя
            text: message,
            timestamp: serverTimestamp(),
            clientTimestamp: new Date(), // Время на клиенте
            read: false,
            type: 'text'
        };

        console.log('Добавление сообщения в коллекцию messages:', messageData);
        const msgRef = await addDoc(collection(db, 'messages'), messageData);
        console.log('Сообщение добавлено, ID:', msgRef.id);

        // Обновляем время последнего сообщения в чате
        console.log('Обновление информации о последнем сообщении в чате');
        await updateDoc(doc(db, 'chats', supportChatId), {
            lastMessageTime: serverTimestamp(),
            lastMessage: message,
            lastMessageSenderId: userId,
            unreadBySupport: true // Отмечаем, что есть непрочитанные сообщения для поддержки
        });

        return true;
    } catch (error) {
        console.error('Ошибка при добавлении сообщения в чат поддержки:', error);
        return false;
    }
};

/**
 * Добавление ответа администратора в чат с поддержкой
 * @param {string} userId - ID пользователя
 * @param {string} response - Текст ответа
 * @param {string} adminId - ID администратора
 * @returns {Promise<boolean>} - Успешность операции
 */
export const addSupportChatResponse = async (userId, response, adminId) => {
    try {
        // Получаем ID чата поддержки
        const supportChatId = await getSupportChatId(userId);

        if (!supportChatId) {
            throw new Error('Чат с поддержкой не найден');
        }

        // Добавляем сообщение от администратора
        const messageData = {
            chatId: supportChatId,
            userId: 'support', // Отмечаем, что это сообщение от поддержки
            adminId: adminId, // ID администратора для отслеживания
            text: response,
            timestamp: serverTimestamp(),
            isRead: false
        };

        await addDoc(collection(db, 'messages'), messageData);

        // Обновляем время последнего сообщения в чате
        await updateDoc(doc(db, 'chats', supportChatId), {
            lastMessageTime: serverTimestamp(),
            lastMessage: response.substring(0, 50) + (response.length > 50 ? '...' : '')
        });

        return true;
    } catch (error) {
        console.error('Ошибка при добавлении ответа в чат поддержки:', error);
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
            type: 'support', // Тип чата - поддержка
            participants: [userId], // Участники чата - только пользователь
            createdAt: serverTimestamp(),
            lastMessageTime: serverTimestamp(),
            lastMessage: 'Чат с технической поддержкой',
            isActive: true,
            name: 'Техническая поддержка',
            icon: '👨‍💻' // Иконка для чата поддержки
        };

        const chatRef = await addDoc(collection(db, 'chats'), chatData);

        // Создаем первое приветственное сообщение от службы поддержки
        const welcomeMessage = {
            chatId: chatRef.id,
            userId: 'support', // Отмечаем, что это сообщение от поддержки
            text: 'Добро пожаловать в чат с технической поддержкой! Опишите вашу проблему или задайте вопрос, и мы ответим вам как можно скорее.',
            timestamp: serverTimestamp(),
            isRead: false
        };

        await addDoc(collection(db, 'messages'), welcomeMessage);

        return chatRef.id;
    } catch (error) {
        console.error('Ошибка при создании чата поддержки:', error);
        return null;
    }
};

// Создание нового обращения в поддержку
export const createSupportTicket = async (userId, initialMessage) => {
    try {
        // Проверяем, нет ли уже активного обращения
        const activeTicketQuery = query(
            collection(db, 'chats'),
            where('userId', '==', userId),
            where('type', '==', 'support'),
            where('status', '==', 'active')
        );

        const activeTickets = await getDocs(activeTicketQuery);
        if (!activeTickets.empty) {
            // Возвращаем ID существующего активного обращения
            return activeTickets.docs[0].id;
        }

        // Создаем новое обращение
        const chatRef = await addDoc(collection(db, 'chats'), {
            type: 'support',
            userId,
            status: 'active',
            createdAt: serverTimestamp(),
            lastMessage: initialMessage,
            lastMessageAt: serverTimestamp(),
            unreadBySupport: true,
            unreadByUser: false
        });

        // Добавляем первое сообщение
        await addDoc(collection(db, 'chats', chatRef.id, 'messages'), {
            text: initialMessage,
            senderId: userId,
            createdAt: serverTimestamp(),
            type: 'user'
        });

        return chatRef.id;
    } catch (error) {
        console.error('Error creating support ticket:', error);
        throw error;
    }
};

// Завершение обращения в поддержку
export const resolveSupportTicket = async (chatId, adminId) => {
    try {
        const chatRef = doc(db, 'chats', chatId);
        await updateDoc(chatRef, {
            status: 'resolved',
            resolvedAt: serverTimestamp(),
            resolvedBy: adminId
        });

        // Добавляем системное сообщение
        await addDoc(collection(db, 'chats', chatId, 'messages'), {
            type: 'system',
            text: 'Обращение закрыто специалистом поддержки',
            createdAt: serverTimestamp()
        });

        return true;
    } catch (error) {
        console.error('Error resolving support ticket:', error);
        throw error;
    }
};

// Получение истории обращений пользователя
export const getUserSupportHistory = async (userId) => {
    try {
        const historyQuery = query(
            collection(db, 'chats'),
            where('userId', '==', userId),
            where('type', '==', 'support'),
            orderBy('createdAt', 'desc'),
            limit(10)
        );

        const history = await getDocs(historyQuery);
        return history.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting support history:', error);
        throw error;
    }
};

// Получение активных обращений для админов
export const getActiveSupportTickets = async () => {
    try {
        const activeTicketsQuery = query(
            collection(db, 'chats'),
            where('type', '==', 'support'),
            where('status', '==', 'active'),
            orderBy('createdAt', 'desc')
        );

        const tickets = await getDocs(activeTicketsQuery);
        return tickets.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting active tickets:', error);
        throw error;
    }
};
