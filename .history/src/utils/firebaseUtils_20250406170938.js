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
 * Проверяет существование коллекции в Firestore и создает ее при необходимости
 * @param {string} collectionName - Имя коллекции для проверки/создания
 * @returns {Promise<Object>} - Статус операции
 */
export const ensureCollectionExists = async (collectionName) => {
    try {
        console.log(`Проверка существования коллекции "${collectionName}"...`);
        
        // Попытка получить коллекцию
        const q = query(collection(db, collectionName), limit(1));
        const querySnapshot = await getDocs(q);
        
        // Если коллекция существует
        if (!querySnapshot.empty) {
            console.log(`Коллекция "${collectionName}" уже существует.`);
            return { 
                exists: true, 
                isNew: false,
                message: `Коллекция "${collectionName}" существует` 
            };
        }
        
        // Если коллекция не существует, создаем ее путем добавления документа-заглушки
        console.log(`Коллекция "${collectionName}" не найдена, создаем...`);
        
        const placeholderDoc = doc(collection(db, collectionName), "_collection_info");
        await setDoc(placeholderDoc, {
            created: new Date().toISOString(),
            description: `Коллекция ${collectionName} для приложения анонимного чата`,
            isPlaceholder: true
        });
        
        console.log(`Коллекция "${collectionName}" успешно создана`);
        return { 
            exists: true, 
            isNew: true, 
            message: `Коллекция "${collectionName}" успешно создана` 
        };
        
    } catch (error) {
        console.error(`Ошибка при проверке/создании коллекции "${collectionName}":`, error);
        return { 
            exists: false, 
            isNew: false, 
            error: error.message, 
            message: `Ошибка при создании коллекции "${collectionName}": ${error.message}` 
        };
    }
};

/**
 * Проверяет и создает все необходимые коллекции для приложения
 * @returns {Promise<Object>} - Результаты создания коллекций
 */
export const ensureRequiredCollectionsExist = async () => {
    const requiredCollections = ['users', 'chats', 'messages', 'interests'];
    const results = {};
    
    for (const collectionName of requiredCollections) {
        results[collectionName] = await ensureCollectionExists(collectionName);
    }
    
    return results;
};

/**
 * Диагностирует состояние коллекции
 * @param {string} collectionName - Имя коллекции для диагностики
 * @returns {Promise<Object>} - Информация о коллекции
 */
export const troubleshootCollection = async (collectionName) => {
    try {
        const q = query(collection(db, collectionName), limit(10));
        const querySnapshot = await getDocs(q);
        
        return {
            exists: true,
            documentCount: querySnapshot.size,
            isEmpty: querySnapshot.empty,
            sampleDocuments: querySnapshot.empty ? [] : 
                querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    data: Object.keys(doc.data())
                }))
        };
    } catch (error) {
        console.error(`Ошибка при диагностике коллекции "${collectionName}":`, error);
        return {
            exists: false,
            error: error.message
        };
    }
};

/**
 * Проверяет соединение с Firebase
 * @returns {Promise<boolean>} - true если соединение работает
 */
export const testFirebaseConnection = async () => {
    try {
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Timeout")), 10000)
        );
        
        const testQuery = query(collection(db, "users"), limit(1));
        const connectionPromise = getDocs(testQuery)
            .then(() => true)
            .catch(err => {
                console.error("Ошибка соединения с Firebase:", err);
                return false;
            });
        
        return await Promise.race([connectionPromise, timeoutPromise]);
    } catch (error) {
        console.error("Ошибка при проверке соединения:", error);
        return false;
    }
};
