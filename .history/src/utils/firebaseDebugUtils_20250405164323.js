import { db } from '../firebase';
import { setDoc, doc, collection, getDoc } from 'firebase/firestore';

/**
 * Функция для тестирования соединения с Firebase
 * @returns {Promise<boolean>} Результат проверки соединения
 */
export const testFirebaseConnection = async () => {
    try {
        console.log("Тестирование соединения с Firebase...");
        const testDoc = doc(collection(db, "_test_connection"));
        const timestamp = new Date().toISOString();
        
        // Пробуем записать данные
        await setDoc(testDoc, {
            timestamp,
            test: 'connection-test'
        });
        
        // Пробуем прочитать данные
        const docSnap = await getDoc(testDoc);
        return docSnap.exists();
    } catch (error) {
        console.error("Ошибка при тестировании соединения с Firebase:", error);
        // Отдельно анализируем различные типы ошибок Firebase
        if (error.code) {
            switch(error.code) {
                case 'permission-denied':
                    console.error("Отказано в доступе. Проверьте правила безопасности Firebase.");
                    break;
                case 'unavailable':
                    console.error("Firebase недоступен. Проверьте подключение к интернету.");
                    break;
                case 'failed-precondition':
                    console.error("Не выполнены предварительные условия. Возможно требуется создание индексов.");
                    break;
                default:
                    console.error(`Код ошибки Firebase: ${error.code}`);
            }
        }
        return false;
    }
};

/**
 * Функция для проведения диагностики Firebase
 * @param {Object} userData - Данные пользователя для регистрации
 * @returns {Promise<Object>} Результаты диагностики
 */
export const diagnoseFirebaseIssues = async (userData) => {
    const results = {
        connectionTest: false,
        writeTest: false,
        readTest: false,
        userDataValid: false,
        error: null
    };
    
    try {
        // Проверка соединения
        results.connectionTest = await testFirebaseConnection();
        
        if (!results.connectionTest) {
            throw new Error("Не удалось подключиться к Firebase");
        }
        
        // Проверка валидности данных пользователя
        results.userDataValid = !!userData && typeof userData === 'object' && 
                               (userData.name || userData.nickname) && 
                               !!userData.age;
        
        if (!results.userDataValid) {
            throw new Error("Неверные или неполные данные пользователя");
        }
        
        // Проверка записи в тестовую коллекцию
        const testUserId = `test_${Date.now()}`;
        const testUserDoc = doc(db, "test_users", testUserId);
        
        await setDoc(testUserDoc, {
            ...userData,
            createdAt: new Date(),
            isTest: true
        });
        results.writeTest = true;
        
        // Проверка чтения
        const readDoc = await getDoc(testUserDoc);
        results.readTest = readDoc.exists();
        
    } catch (error) {
        console.error("Диагностика Firebase выявила ошибку:", error);
        results.error = {
            message: error.message,
            code: error.code,
            stack: error.stack
        };
    }
    
    return results;
};
