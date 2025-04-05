import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Проверяет соединение с Firebase перед поиском собеседника
 * @returns {Promise<boolean>} Результат проверки соединения
 */
export const checkFirebaseConnection = async () => {
    try {
        // Пробуем получить любой документ из Firebase, чтобы проверить соединение
        const testRef = doc(db, "system", "connection_test");
        await getDoc(testRef);
        return true;
    } catch (error) {
        console.error("Ошибка при проверке соединения с Firebase:", error);
        return false;
    }
};

/**
 * Усовершенствованная функция проверки состояния сети
 * @returns {Promise<boolean>} Состояние сети и доступности Firebase
 */
export const checkNetworkAndFirebase = async () => {
    // Сначала проверяем состояние сети пользователя
    if (!navigator.onLine) {
        return false;
    }
    
    // Затем проверяем соединение с Firebase
    return await checkFirebaseConnection();
};
