import { db } from '../firebase';
import { collection, doc, getDoc, setDoc, getDocs, query, limit } from 'firebase/firestore';

/**
 * Проверка соединения с Firebase и наличия необходимых прав доступа
 */
export const checkFirebaseConnection = async () => {
    try {
        // Создаем тестовый документ в коллекции test_users
        const testDocRef = doc(db, 'test_users', 'connection_test');
        await setDoc(testDocRef, { timestamp: new Date().toISOString() });

        // Попробуем прочитать документ, чтобы убедиться, что соединение работает
        const testDocSnap = await getDoc(testDocRef);

        return {
            connected: true,
            readSuccess: testDocSnap.exists(),
            writeSuccess: true,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Ошибка при проверке соединения с Firebase:', error);
        return {
            connected: false,
            readSuccess: false,
            writeSuccess: false,
            error: error.message,
            errorCode: error.code,
            timestamp: new Date().toISOString()
        };
    }
};

/**
 * Очистка данных от undefined и null значений перед сохранением в Firestore
 * @param {object} data - Объект с данными для сохранения
 * @returns {object} Очищенный объект без undefined и null значений
 */
export const sanitizeData = (data) => {
    if (!data || typeof data !== 'object') {
        return data;
    }

    const sanitized = {};

    for (const key in data) {
        // Проверяем, что свойство существует и не равно undefined или null
        if (Object.prototype.hasOwnProperty.call(data, key) && data[key] !== undefined && data[key] !== null) {
            // Если значение является объектом, рекурсивно очищаем его
            if (typeof data[key] === 'object' && data[key] !== null && !(data[key] instanceof Date)) {
                sanitized[key] = sanitizeData(data[key]);
            } else {
                sanitized[key] = data[key];
            }
        }
    }

    return sanitized;
};

/**
 * Проверяет наличие изменений в объекте по сравнению с предыдущими данными
 * @param {object} newData - Новые данные
 * @param {object} oldData - Старые данные
 * @returns {boolean} true, если данные изменились
 */
export const hasChanges = (newData, oldData) => {
    if (!newData || !oldData) return true;

    const newKeys = Object.keys(newData);
    const oldKeys = Object.keys(oldData);

    if (newKeys.length !== oldKeys.length) return true;

    for (const key of newKeys) {
        if (newData[key] !== oldData[key]) return true;
    }

    return false;
};

/**
 * Диагностика и обход распространенных проблем с Firebase
 * @param {string} collectionName - Имя коллекции, с которой возникли проблемы
 */
export const troubleshootCollection = async (collectionName) => {
    try {
        console.log(`Диагностика коллекции "${collectionName}"...`);

        // 1. Проверяем, существует ли коллекция
        const colRef = collection(db, collectionName);
        const querySnapshot = await getDocs(query(colRef, limit(1)));
        const exists = !querySnapshot.empty;

        if (exists) {
            console.log(`Коллекция "${collectionName}" существует и доступна`);
            return { exists: true, readable: true };
        }

        // 2. Пробуем создать тестовый документ для инициализации коллекции
        console.log(`Коллекция "${collectionName}" не существует, пробуем создать...`);
        const initDocRef = doc(db, collectionName, '_init_check');
        await setDoc(initDocRef, {
            created: new Date().toISOString(),
            system: true,
            purpose: 'collection initialization'
        });

        // 3. Проверяем, что документ создан
        const checkDocSnap = await getDoc(initDocRef);

        return {
            exists: true,
            readable: checkDocSnap.exists(),
            created: true
        };
    } catch (error) {
        console.error(`Ошибка при диагностике коллекции "${collectionName}":`, error);
        return {
            exists: false,
            error: error.message,
            errorCode: error.code
        };
    }
};
