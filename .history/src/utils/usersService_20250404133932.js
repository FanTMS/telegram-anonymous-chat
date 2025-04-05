import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';

/**
 * Получение пользователя по его ID
 * @param {string} userId ID пользователя
 * @returns {Promise<object|null>} Данные пользователя или null, если пользователь не найден
 */
export const getUserById = async (userId) => {
    try {
        if (!userId) return null;
        
        // Сначала пробуем найти пользователя по документу
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
            return {
                id: userDoc.id,
                ...userDoc.data()
            };
        }
        
        // Если не нашли, пробуем найти по telegramId
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("telegramId", "==", userId));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return {
                id: doc.id,
                ...doc.data()
            };
        }
        
        return null;
    } catch (error) {
        console.error("Ошибка при получении пользователя:", error);
        throw error;
    }
};

/**
 * Обновление данных пользователя
 * @param {string} userId ID пользователя
 * @param {object} userData Новые данные пользователя
 * @returns {Promise<void>}
 */
export const updateUser = async (userId, userData) => {
    try {
        // Добавляем поле lastActive 
        const updateData = {
            ...userData,
            lastActive: new Date()
        };
        
        await updateDoc(doc(db, "users", userId), updateData);
    } catch (error) {
        console.error("Ошибка при обновлении пользователя:", error);
        throw error;
    }
};
