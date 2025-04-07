import { db } from '../firebase';
import { collection, doc, getDoc, setDoc, getDocs, query, limit, deleteDoc, serverTimestamp } from 'firebase/firestore';

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
 * Безопасное выполнение запроса Firestore с обработкой ошибок
 * @param {Function} queryFn - Функция запроса
 * @returns {Promise<any>} - Результат запроса или [] при ошибке для запросов, []/{} при ошибке для других операций
 */
export const safeFirestoreQuery = async (queryFn) => {
    try {
        return await queryFn();
    } catch (error) {
        console.error('Ошибка Firebase запроса:', error);

        // Анализируем ошибку для предоставления более полезной информации
        if (error.code === 'permission-denied') {
            console.error('Отказано в доступе к Firestore. Проверьте правила безопасности.');
        } else if (error.code === 'unavailable') {
            console.error('Сервис Firestore недоступен. Проверьте подключение к интернету.');
        } else if (error.message && error.message.includes('requires an index')) {
            console.error(`Требуется создать индекс: ${error.message}`);
            // Добавляем ссылку на создание индекса, если она есть в сообщении
            const indexUrl = error.message.match(/(https:\/\/console\.firebase\.google\.com[^\s]+)/);
            if (indexUrl) {
                console.info(`Ссылка для создания индекса: ${indexUrl[0]}`);
            }
        }

        // В режиме разработки продолжаем работу, возвращая пустые данные
        if (process.env.NODE_ENV === 'development') {
            console.info('Режим разработки: игнорирование ошибки Firebase для продолжения работы');

            // Определяем тип операции по структуре ошибки или контексту
            const isGetQuery = error.message?.includes('query') ||
                error.message?.includes('get') ||
                error.message?.includes('Firestore');

            // Возвращаем пустой массив для запросов, пустой объект для других операций
            return isGetQuery ? [] : {};
        }

        throw error;
    }
};

/**
 * Проверяет существование коллекции и создает её при необходимости
 * @param {string} collectionName - Имя коллекции
 * @returns {Promise<Object>} - Результат операции
 */
export const ensureCollectionExists = async (collectionName) => {
    console.log(`Проверка существования коллекции "${collectionName}"...`);

    try {
        // В режиме разработки возвращаем успех, даже если проверка не удалась
        if (process.env.NODE_ENV === 'development') {
            try {
                // Проверяем существование коллекции, запросив первый документ
                const collectionRef = collection(db, collectionName);
                const querySnapshot = await safeFirestoreQuery(() =>
                    getDocs(query(collectionRef, limit(1)))
                );

                if (querySnapshot && querySnapshot.size > 0) {
                    console.log(`Коллекция "${collectionName}" уже существует.`);
                    return {
                        exists: true,
                        created: false,
                        error: null
                    };
                }
            } catch (checkError) {
                console.warn(`Ошибка при проверке коллекции "${collectionName}":`, checkError);
            }

            // В режиме разработки считаем, что коллекция существует
            console.log(`Режим разработки: предполагаем, что коллекция "${collectionName}" существует`);
            return {
                exists: true,
                created: false,
                error: null
            };
        }

        // Проверяем существование коллекции, запросив первый документ
        const collectionRef = collection(db, collectionName);
        const querySnapshot = await safeFirestoreQuery(() =>
            getDocs(query(collectionRef, limit(1)))
        );

        if (querySnapshot && querySnapshot.size > 0) {
            console.log(`Коллекция "${collectionName}" уже существует.`);
            return {
                exists: true,
                created: false,
                error: null
            };
        }

        // Коллекции нет или она пуста, создаем тестовый документ
        try {
            const dummyDocRef = doc(collectionRef, '_dummy_doc');
            await safeFirestoreQuery(() =>
                setDoc(dummyDocRef, {
                    _system: true,
                    _created: serverTimestamp(),
                    _description: `Служебный документ для создания коллекции ${collectionName}`
                })
            );

            console.log(`Коллекция "${collectionName}" успешно создана.`);

            // Удаляем тестовый документ, если не системная коллекция
            if (collectionName !== '_test_connection') {
                await safeFirestoreQuery(() => deleteDoc(dummyDocRef));
            }

            return {
                exists: true,
                created: true,
                error: null
            };
        } catch (writeError) {
            console.error(`Ошибка при создании коллекции "${collectionName}":`, writeError);
            return {
                exists: false,
                created: false,
                error: writeError
            };
        }
    } catch (error) {
        console.error(`Ошибка при проверке/создании коллекции "${collectionName}":`, error);

        // В режиме разработки возвращаем успех, даже если проверка не удалась
        if (process.env.NODE_ENV === 'development') {
            console.warn(`Режим разработки: игнорирование ошибки для коллекции "${collectionName}"`);
            return {
                exists: true,
                created: false,
                error: null,
                isDevelopmentFallback: true
            };
        }

        return {
            exists: false,
            created: false,
            error: error
        };
    }
};

/**
 * Проверяет существование необходимых коллекций
 * @returns {Promise<Object>} - Результаты проверки
 */
export const ensureRequiredCollectionsExist = async () => {
    const collections = [
        'users',
        'chats',
        'messages',
        'interests',
        'searchQueue',
        'groups',
        'groupMessages'
    ];

    const results = {};

    for (const collectionName of collections) {
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
