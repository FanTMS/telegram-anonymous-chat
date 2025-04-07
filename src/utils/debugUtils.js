import { db } from '../firebase';
// Комментируем неиспользуемые импорты
// import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';

/**
 * Проверка соединения с Firestore
 * @returns {Promise<boolean>} - Результат проверки
 */
export const checkFirestoreConnection = async () => {
    try {
        // Пытаемся прочитать любую коллекцию, ограничивая результат одним документом
        const testQuery = query(collection(db, 'users'), limit(1));
        const snapshot = await getDocs(testQuery);

        // Успешно выполнен запрос к Firestore
        console.log('Соединение с Firestore установлено успешно');
        console.log('Получено документов:', snapshot.size);

        return true;
    } catch (error) {
        console.error('Ошибка при проверке соединения с Firestore:', error);
        return false;
    }
};

/**
 * Проверка существования чата поддержки для пользователя
 * @param {string} userId - ID пользователя
 * @returns {Promise<object>} - Результат проверки с информацией о чате
 */
export const debugSupportChat = async (userId) => {
    try {
        console.log('Проверка чата поддержки для пользователя:', userId);

        const q = query(
            collection(db, 'chats'),
            where('type', '==', 'support'),
            where('participants', 'array-contains', userId)
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const chatData = querySnapshot.docs[0].data();
            const chatId = querySnapshot.docs[0].id;

            console.log('Найден чат поддержки:', chatId);
            console.log('Данные чата:', chatData);

            // Проверяем сообщения в чате
            const messagesQuery = query(
                collection(db, 'messages'),
                where('chatId', '==', chatId),
                limit(10)
            );

            const messagesSnapshot = await getDocs(messagesQuery);
            const messages = [];

            messagesSnapshot.forEach(doc => {
                messages.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            console.log('Сообщения в чате:', messages);

            return {
                exists: true,
                chatId,
                chatData,
                messages,
                messagesCount: messagesSnapshot.size
            };
        } else {
            console.log('Чат поддержки не найден для пользователя:', userId);
            return { exists: false };
        }
    } catch (error) {
        console.error('Ошибка при проверке чата поддержки:', error);
        return {
            exists: false,
            error: error.message
        };
    }
};

/**
 * Проверка запросов в службу поддержки для пользователя
 * @param {string} userId - ID пользователя
 * @returns {Promise<array>} - Список запросов пользователя
 */
export const debugSupportRequests = async (userId) => {
    try {
        console.log('Проверка запросов в поддержку для пользователя:', userId);

        const q = query(
            collection(db, 'supportRequests'),
            where('userId', '==', userId.toString())
        );

        const querySnapshot = await getDocs(q);
        const requests = [];

        querySnapshot.forEach(doc => {
            requests.push({
                id: doc.id,
                ...doc.data()
            });
        });

        console.log('Найдено запросов:', requests.length);
        console.log('Запросы:', requests);

        return requests;
    } catch (error) {
        console.error('Ошибка при проверке запросов в поддержку:', error);
        return [];
    }
};

/**
 * Запуск полной диагностики системы поддержки
 * @param {string} userId - ID пользователя (опционально)
 * @returns {Promise<object>} - Результаты диагностики
 */
export const runSupportSystemDiagnostics = async (userId = null) => {
    const results = {
        firestoreConnection: false,
        supportChat: null,
        supportRequests: null,
        timestamp: new Date().toISOString()
    };

    // Проверка соединения с Firestore
    results.firestoreConnection = await checkFirestoreConnection();

    // Если передан ID пользователя, проверяем его чат и запросы
    if (userId) {
        results.supportChat = await debugSupportChat(userId);
        results.supportRequests = await debugSupportRequests(userId);
    }

    console.log('Результаты диагностики:', results);
    return results;
};
