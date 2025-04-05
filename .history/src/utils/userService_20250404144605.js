import { db } from '../firebase';
import { 
    doc, 
    getDoc, 
    updateDoc, 
    collection, 
    query, 
    where, 
    getDocs, 
    addDoc 
} from 'firebase/firestore';

/**
 * Сохраняет нового пользователя в базу данных
 * @param {Object} userData - Данные пользователя
 * @returns {Promise<Object>} - Созданный пользователь
 */
export const createUser = async (userData) => {
    try {
        const docRef = await addDoc(collection(db, "users"), userData);
        return { id: docRef.id, ...userData };
    } catch (error) {
        console.error("Ошибка при создании пользователя:", error);
        throw error;
    }
};

/**
 * Находит пользователя по Telegram ID
 * @param {number|string} telegramId - Telegram ID пользователя
 * @returns {Promise<Object|null>} - Данные пользователя или null
 */
export const findUserByTelegramId = async (telegramId) => {
    try {
        if (!telegramId) return null;

        const userQuery = query(collection(db, "users"), where("telegramId", "==", telegramId));
        const userSnapshot = await getDocs(userQuery);

        if (userSnapshot.empty) return null;

        const userData = userSnapshot.docs[0].data();
        return { id: userSnapshot.docs[0].id, ...userData };
    } catch (error) {
        console.error("Ошибка при поиске пользователя:", error);
        throw error;
    }
};

/**
 * Получение пользователя по его ID
 * @param {string} userId - ID пользователя
 * @returns {Promise<Object|null>} - Данные пользователя или null, если пользователь не найден
 */
export const getUserById = async (userId) => {
    try {
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            return { id: userDoc.id, ...userDoc.data() };
        } else {
            console.log(`Пользователь с ID ${userId} не найден`);
            return null;
        }
    } catch (error) {
        console.error("Ошибка при получении пользователя по ID:", error);
        throw error;
    }
};

/**
 * Обновление данных пользователя
 * @param {string} userId - ID пользователя
 * @param {Object} userData - Объект с обновляемыми данными пользователя
 * @returns {Promise<boolean>} - Результат операции (успех/неудача)
 */
export const updateUser = async (userId, userData) => {
    try {
        const userRef = doc(db, "users", userId);
        
        // Добавляем поле lastActive для отслеживания активности пользователя
        userData.lastActive = new Date();
        
        await updateDoc(userRef, userData);
        
        return true;
    } catch (error) {
        console.error("Ошибка при обновлении пользователя:", error);
        throw error;
    }
};

/**
 * Получение статистики пользователя
 * @param {string} userId - ID пользователя
 * @returns {Promise<Object>} - Статистика пользователя
 */
export const getUserStatistics = async (userId) => {
    try {
        // Получаем количество всех чатов пользователя
        const chatsRef = collection(db, "chats");
        const q1 = query(
            chatsRef, 
            where("participants", "array-contains", userId)
        );
        const chatSnapshot = await getDocs(q1);
        const totalChats = chatSnapshot.size;
        
        // Получаем количество завершенных чатов
        const q2 = query(
            chatsRef, 
            where("participants", "array-contains", userId),
            where("status", "==", "completed")
        );
        const completedSnapshot = await getDocs(q2);
        const completedChats = completedSnapshot.size;
        
        // Получаем количество активных чатов
        const q3 = query(
            chatsRef, 
            where("participants", "array-contains", userId),
            where("status", "==", "active")
        );
        const activeSnapshot = await getDocs(q3);
        const activeChats = activeSnapshot.size;
        
        // Получаем количество сообщений
        const messagesCollection = collection(db, "users", userId, "stats");
        const messagesDoc = doc(messagesCollection, "messages");
        const messagesSnapshot = await getDoc(messagesDoc);
        
        const totalMessages = messagesSnapshot.exists() 
            ? messagesSnapshot.data().total || 0 
            : 0;
        
        return {
            totalChats,
            completedChats,
            activeChats,
            totalMessages
        };
    } catch (error) {
        console.error("Ошибка при получении статистики пользователя:", error);
        return {
            totalChats: 0,
            completedChats: 0,
            activeChats: 0,
            totalMessages: 0
        };
    }
};
