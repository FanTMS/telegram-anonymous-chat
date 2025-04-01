import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

/**
 * Тестирует подключение к Firebase, создавая тестовую запись
 * @returns {Promise<boolean>} Результат теста
 */
export const testFirebaseConnection = async () => {
    try {
        // Создаем тестовую запись
        const testData = {
            test: true,
            timestamp: new Date(),
            message: "Test connection"
        };
        
        const docRef = await addDoc(collection(db, "test_connection"), testData);
        console.log("Test document written with ID:", docRef.id);
        
        return true;
    } catch (error) {
        console.error("Error testing Firebase connection:", error);
        return false;
    }
};

/**
 * Проверяет сохранение и чтение Telegram ID в Firebase
 * @param {string|number} telegramId Идентификатор Telegram
 * @returns {Promise<boolean>} Результат теста
 */
export const testTelegramIdStorage = async (telegramId) => {
    if (!telegramId) {
        console.error("No Telegram ID provided for test");
        return false;
    }
    
    try {
        // Создаем тестовую запись с Telegram ID
        const testData = {
            telegramId,
            timestamp: new Date(),
            test: true
        };
        
        // Добавляем запись
        await addDoc(collection(db, "test_telegram_ids"), testData);
        
        // Проверяем, что можем получить запись по Telegram ID
        const q = query(
            collection(db, "test_telegram_ids"), 
            where("telegramId", "==", telegramId)
        );
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            console.error("Failed to retrieve test record by Telegram ID");
            return false;
        }
        
        console.log("Successfully tested Telegram ID storage and retrieval");
        return true;
    } catch (error) {
        console.error("Error testing Telegram ID storage:", error);
        return false;
    }
};
