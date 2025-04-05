import { db } from './firebase';
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
            console.warn('Не удалось получить данные пользователя из WebApp:', error);
        }

        // Если не смогли получить ID пользователя из WebApp, используем sessionStorage
        if (!userId) {
            try {
                const userDataStr = sessionStorage.getItem('userData');
                if (userDataStr) {
                    const userData = JSON.parse(userDataStr);
                    userId = userData.telegramId.toString();
                    firstName = userData.name || '';
                }
            } catch (error) {
                console.warn('Не удалось получить данные пользователя из sessionStorage:', error);
            }
        }

        if (!userId) {
            throw new Error('Не удалось определить ID пользователя');
        }

        // Создаем запрос в коллекции supportRequests
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
                createdAt: data.createdAt ? data.createdAt.toDate() : null,
                updatedAt: data.updatedAt ? data.updatedAt.toDate() : null
            });
        });

        return requests;
    } catch (error) {
        console.error('Ошибка при получении запросов в поддержку:', error);
        throw error;
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

        const updateData = {
            status: status,
            updatedAt: serverTimestamp()
        };

        if (status === 'processing') {
            updateData.assignedTo = adminId;
        }

        if (response) {
            updateData.response = response;
        }

        await updateDoc(requestRef, updateData);

        return true;
    } catch (error) {
        console.error('Ошибка при обновлении запроса в поддержку:', error);
        throw error;
    }
};

/**
 * Получение запросов в поддержку конкретного пользователя
 * @param {string} userId - ID пользователя
 * @returns {Promise<Array>} - Массив запросов
 */
export const getUserSupportRequests = async (userId) => {
    try {
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
                createdAt: data.createdAt ? data.createdAt.toDate() : null,
                updatedAt: data.updatedAt ? data.updatedAt.toDate() : null
            });
        });

        return requests;
    } catch (error) {
        console.error('Ошибка при получении запросов пользователя:', error);
        throw error;
    }
};
