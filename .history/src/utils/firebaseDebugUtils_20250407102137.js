import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

/**
 * Функция для тестирования соединения с Firebase
 * @returns {Promise<boolean>} Результат проверки соединения
 */
export const testFirebaseConnection = async () => {
    try {
        console.log('Проверка подключения к Firebase...');
        const testRef = doc(db, '_test_', 'connectivity');
        const timestamp = new Date().toISOString();
        
        // Пробуем записать
        await setDoc(testRef, { timestamp, status: 'online' }, { merge: true });
        console.log('Тестовая запись создана');
        
        // Пробуем прочитать
        const docSnap = await getDoc(testRef);
        
        if (docSnap.exists()) {
            console.log('Firebase: Соединение работает', docSnap.data());
            return true;
        } else {
            console.error('Firebase: Документ не найден после записи');
            return false;
        }
    } catch (error) {
        console.error('Firebase: Ошибка соединения:', error);
        if (error.code) {
            console.error('Код ошибки:', error.code);
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
