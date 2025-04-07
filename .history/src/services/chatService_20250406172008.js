import { db } from '../firebase';
import { doc, collection, setDoc, deleteDoc } from 'firebase/firestore';
import { safeFirestoreQuery } from '../utils/firebaseUtils';

/**
 * Добавляет пользователя в очередь поиска
 * @param {string} userId - ID пользователя
 * @param {Object} userPreferences - Предпочтения пользователя для поиска
 * @returns {Promise<string>} - ID записи в очереди поиска
 */
export const addUserToSearchQueue = async (userId, userPreferences = {}) => {
  try {
    // Валидация входных данных
    if (!userId) {
      throw new Error('ID пользователя обязателен для добавления в очередь поиска');
    }

    // Создаем запись для очереди поиска
    const searchEntry = {
      userId,
      preferences: userPreferences,
      timestamp: new Date().toISOString(),
      status: 'searching'
    };

    // Используем безопасный запрос с обработкой ошибок BloomFilter
    const searchRef = await safeFirestoreQuery(async () => {
      const docRef = doc(collection(db, "searchQueue"));
      await setDoc(docRef, searchEntry);
      return docRef;
    });

    console.log(`Пользователь ${userId} добавлен в очередь поиска`);
    
    return searchRef.id;
  } catch (error) {
    console.error("Ошибка при добавлении пользователя в очередь поиска:", error);
    throw error;
  }
};

/**
 * Удаляет пользователя из очереди поиска
 * @param {string} searchId - ID записи в очереди поиска
 * @returns {Promise<boolean>} - true если успешно
 */
export const removeUserFromSearchQueue = async (searchId) => {
  try {
    if (!searchId) {
      console.warn("ID поиска не предоставлен для удаления из очереди");
      return false;
    }

    // Используем безопасный запрос с обработкой ошибок BloomFilter
    await safeFirestoreQuery(async () => {
      const searchRef = doc(db, "searchQueue", searchId);
      await deleteDoc(searchRef);
    });

    console.log("Поиск отменен, пользователь удален из очереди");
    return true;
  } catch (error) {
    console.error("Ошибка при удалении пользователя из очереди поиска:", error);
    return false;
  }
};