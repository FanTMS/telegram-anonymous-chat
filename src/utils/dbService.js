import axios from 'axios';

const DEBUG = true;
const BASE_URL = '/.netlify/functions/mongodb';
const FALLBACK_TO_LOCAL = true; // Включаем автоматический fallback на локальное хранилище
const FORCE_LOCAL_STORAGE = false; // Отключаем принудительное использование localStorage

// Функция для локальной записи данных
const saveToLocalStorage = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        if (DEBUG) console.log(`[LocalStorage] Сохранено: ${key}`);
        return true;
    } catch (error) {
        console.error('[LocalStorage] Ошибка сохранения:', error);
        return false;
    }
};

// Функция для локального чтения данных
const getFromLocalStorage = (key) => {
    try {
        const value = localStorage.getItem(key);
        if (DEBUG && value) console.log(`[LocalStorage] Получено: ${key}`);
        return value ? JSON.parse(value) : null;
    } catch (error) {
        console.error('[LocalStorage] Ошибка чтения:', error);
        return null;
    }
};

// Переменная для отслеживания статуса соединения
let isMongoDbAvailable = !FORCE_LOCAL_STORAGE; // Изначально считаем MongoDB доступной, если не форсируем localStorage
let lastMongoDbCheck = 0;
const CHECK_INTERVAL = 10000; // 10 секунд между проверками доступности MongoDB

// Функция для проверки доступности MongoDB
export const checkMongoDbConnection = async () => {
    // Если принудительно используем localStorage, то всегда возвращаем false
    if (FORCE_LOCAL_STORAGE) {
        return false;
    }

    // Проверяем не чаще чем раз в CHECK_INTERVAL
    const now = Date.now();
    if (now - lastMongoDbCheck < CHECK_INTERVAL && lastMongoDbCheck !== 0) {
        return isMongoDbAvailable;
    }

    lastMongoDbCheck = now;

    try {
        console.log('[dbService] Проверка соединения с MongoDB...');
        const response = await axios.post(BASE_URL, {
            operation: 'getOne',
            collection: 'system',
            filter: { _id: 'health_check' }
        }, {
            timeout: 5000,
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

        // Проверяем структуру ответа
        if (response.data && response.data.success !== undefined) {
            isMongoDbAvailable = true;
            if (DEBUG) console.log('[MongoDB] Соединение доступно');
            return true;
        } else {
            isMongoDbAvailable = false;
            console.warn('[MongoDB] Некорректный ответ от сервера');
            return false;
        }
    } catch (error) {
        isMongoDbAvailable = false;
        console.warn('[MongoDB] Соединение недоступно:', error.message);
        return false;
    }
};

// Инициализируем проверку соединения сразу при загрузке модуля
checkMongoDbConnection();

// Функция для отправки запросов к MongoDB через Netlify функцию
const sendDbRequest = async (operation, collection, options = {}) => {
    try {
        // Если MongoDB недоступна и включен fallback, сразу используем локальное хранилище
        if (!isMongoDbAvailable && FALLBACK_TO_LOCAL) {
            throw new Error('MongoDB недоступна, использую локальное хранилище');
        }

        if (DEBUG) {
            console.log(`[MongoDB] Запрос: ${operation}, коллекция: ${collection}`);
        }

        // Добавляем таймаут и параметры для повторных попыток
        const requestConfig = {
            timeout: 10000, // 10 секунд таймаут
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        const response = await axios.post(BASE_URL, {
            operation,
            collection,
            ...options
        }, requestConfig);

        if (response.data && response.data.success) {
            // При успешном запросе также сохраняем данные локально для устойчивости
            if (operation === 'getAll') {
                saveToLocalStorage(`${collection}_all`, response.data.data);
            } else if (operation === 'getOne' && options.filter && options.filter._id) {
                saveToLocalStorage(`${collection}_${options.filter._id}`, response.data.data);
            }

            return response.data.data;
        } else if (response.status === 200 && !response.data.success) {
            console.error(`[MongoDB] Сервер вернул ошибку: ${response.data.error || 'Неизвестная ошибка'}`);
            throw new Error(response.data.error || 'Ошибка при выполнении операции с базой данных');
        }

        throw new Error(response.data?.error || 'Ошибка при выполнении операции с базой данных');
    } catch (error) {
        console.error(`[MongoDB] Ошибка (${operation}/${collection}):`, error.message || error);

        // Проверяем доступность MongoDB асинхронно для следующего запроса
        checkMongoDbConnection().catch(() => { });

        // В случае ошибки используем локальное хранилище как запасной вариант
        if (operation === 'getAll') {
            return getFromLocalStorage(`${collection}_all`) || [];
        } else if (operation === 'getOne') {
            const key = `${collection}_${options.filter?._id || 'single'}`;
            return getFromLocalStorage(key) || null;
        } else if (operation === 'updateOne' && options.filter && options.filter._id) {
            // Для updateOne пытаемся обновить локальное хранилище
            const key = `${collection}_${options.filter._id}`;
            const existingData = getFromLocalStorage(key) || {};
            const updatedData = { ...existingData, ...options.update.$set };
            saveToLocalStorage(key, updatedData);
            return { acknowledged: true, modifiedCount: 1 };
        } else if (operation === 'insertOne' && options.document) {
            // Для insertOne сохраняем документ локально
            const id = options.document._id || `local_${Date.now()}`;
            const key = `${collection}_${id}`;
            saveToLocalStorage(key, options.document);
            return { acknowledged: true, insertedId: id };
        } else if (operation === 'deleteOne' && options.filter && options.filter._id) {
            // Для deleteOne удаляем документ из локального хранилища
            const key = `${collection}_${options.filter._id}`;
            localStorage.removeItem(key);
            return { acknowledged: true, deletedCount: 1 };
        }

        return null;
    }
};

// Экспортируемые функции для работы с данными
export const setItem = async (key, value) => {
    try {
        // Проверяем доступность MongoDB первым делом
        await checkMongoDbConnection();

        // Сначала сохраняем в локальное хранилище (для устойчивости)
        saveToLocalStorage(key, value);

        // Если используем только localStorage, то просто возвращаем результат
        if (FORCE_LOCAL_STORAGE) {
            return true;
        }

        // Разбиваем ключ на коллекцию и ID
        const [collection, id] = key.includes('.') ? key.split('.') : [key, null];

        try {
            if (id) {
                // Если указан ID, обновляем или создаем документ
                return await sendDbRequest('updateOne', collection, {
                    filter: { _id: id },
                    update: { $set: value },
                    options: { upsert: true }
                });
            } else {
                // Иначе просто сохраняем как отдельный документ
                return await sendDbRequest('insertOne', collection, {
                    document: { _id: key, value }
                });
            }
        } catch (error) {
            // Если MongoDB не доступна, возвращаем положительный результат, т.к. в LocalStorage уже сохранили
            return true;
        }
    } catch (error) {
        console.error(`Ошибка при сохранении данных (${key}):`, error);
        return saveToLocalStorage(key, value); // Возвращаем результат локального сохранения
    }
};

export const getItem = async (key) => {
    try {
        // Сначала пробуем получить из локального хранилища для моментального отклика
        const localValue = getFromLocalStorage(key);

        // Если принудительно используем localStorage или MongoDB недоступна, используем локальные данные
        if (FORCE_LOCAL_STORAGE) {
            return localValue;
        }

        // Разбиваем ключ на коллекцию и ID
        const [collection, id] = key.includes('.') ? key.split('.') : [key, null];

        // Пытаемся получить из MongoDB
        try {
            let result;
            if (id) {
                result = await sendDbRequest('getOne', collection, {
                    filter: { _id: id }
                });
            } else {
                result = await sendDbRequest('getOne', collection, {
                    filter: { _id: key }
                });
            }

            // Если из MongoDB пришел null, но есть данные в localStorage, используем их
            if (result === null && localValue !== null) {
                return localValue;
            }

            // Также обновляем локальное хранилище
            if (result !== null) {
                saveToLocalStorage(key, result);
            }

            return result;
        } catch (error) {
            // При ошибке используем локальное хранилище
            return localValue;
        }
    } catch (error) {
        console.error(`Ошибка при получении данных (${key}):`, error);
        return null;
    }
};

export const removeItem = async (key) => {
    try {
        // Сначала удаляем из локального хранилища
        localStorage.removeItem(key);

        // Если используем только localStorage, то возвращаем успех
        if (FORCE_LOCAL_STORAGE) {
            return true;
        }

        // Разбиваем ключ на коллекцию и ID
        const [collection, id] = key.includes('.') ? key.split('.') : [key, null];

        try {
            if (id) {
                // Если указан ID, удаляем документ
                await sendDbRequest('deleteOne', collection, {
                    filter: { _id: id }
                });
            } else {
                // Если ID не указан, удаляем по ключу
                await sendDbRequest('deleteOne', collection, {
                    filter: { _id: key }
                });
            }

            return true;
        } catch (error) {
            // Если MongoDB не доступна, возвращаем успех, т.к. из LocalStorage уже удалили
            return true;
        }
    } catch (error) {
        console.error(`Ошибка при удалении данных (${key}):`, error);
        return false; // В случае критической ошибки возвращаем false
    }
};

export const getAllItems = async (collection, query = {}) => {
    try {
        // Если принудительно используем localStorage, берем данные только оттуда
        if (FORCE_LOCAL_STORAGE) {
            return getFromLocalStorage(`${collection}_all`) || [];
        }

        // Пытаемся получить из MongoDB
        try {
            const result = await sendDbRequest('getAll', collection, {
                filter: query
            });

            // Обновляем локальный кеш
            saveToLocalStorage(`${collection}_all`, result);

            return result;
        } catch (error) {
            // При ошибке используем локальное хранилище
            return getFromLocalStorage(`${collection}_all`) || [];
        }
    } catch (error) {
        console.error(`Ошибка при получении всех данных из коллекции ${collection}:`, error);
        return [];
    }
};

// Вспомогательная функция для генерации уникального ID
export const generateId = (prefix = 'id') => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};
