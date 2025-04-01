import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

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
 * Обновляет данные пользователя
 * @param {string} userId - ID документа пользователя
 * @param {Object} userData - Новые данные пользователя
 * @returns {Promise<void>}
 */
export const updateUser = async (userId, userData) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, userData);
  } catch (error) {
    console.error("Ошибка при обновлении пользователя:", error);
    throw error;
  }
};
