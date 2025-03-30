const { MongoClient } = require('mongodb');

// Для отладки
const DEBUG = true;

/**
 * Подключение к базе данных MongoDB
 */
let cachedDb = null;
let cachedClient = null;

// Хранилище для заглушки базы данных
let fakeDbStorage = {};

async function connectToDatabase() {
    if (cachedDb) {
        return cachedDb;
    }

    // Получаем строку подключения из переменных окружения
    const uri = process.env.MONGODB_URI || process.env.MONGODB_URL;

    if (!uri) {
        console.log('[MongoDB] Строка подключения к MongoDB не найдена, используем локальную заглушку');
        return createFakeMongoDb();
    }

    if (DEBUG) {
        console.log('[MongoDB] Connecting to MongoDB with URI:', uri.substring(0, 20) + '...');
    }

    try {
        // Проверяем URI на валидность
        if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
            console.error('[MongoDB] Некорректный URI для подключения:', uri.substring(0, 15) + '...');
            throw new Error('Invalid MongoDB URI');
        }

        // Создаем новое подключение
        console.log('[MongoDB] Attempting to connect to MongoDB...');
        const client = await MongoClient.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            connectTimeoutMS: 5000,
            socketTimeoutMS: 30000
        });

        cachedClient = client;
        const dbName = getDbNameFromUri(uri);
        const db = client.db(dbName);

        // Проверяем подключение, выполнив простой запрос
        await db.command({ ping: 1 });

        if (DEBUG) {
            console.log(`[MongoDB] Connected to database: ${dbName}`);
        }

        cachedDb = db;
        return db;
    } catch (error) {
        console.error('[MongoDB] Error connecting to MongoDB:', error);

        // Создаем заглушку базы данных для продолжения работы
        console.log('[MongoDB] Создаем заглушку базы данных для продолжения работы');
        return createFakeMongoDb();
    }
}

// Извлечение имени базы данных из URI
function getDbNameFromUri(uri) {
    try {
        // Попытка распарсить URI как URL
        if (uri.includes('@')) {
            // Формат: mongodb+srv://user:pass@cluster.example.com/mydb?params
            const parts = uri.split('@')[1].split('/');
            if (parts.length >= 2) {
                return parts[1].split('?')[0];
            }
        } else if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
            // Локальная база данных: mongodb://localhost:27017/mydb
            const parts = uri.split('/');
            return parts[parts.length - 1].split('?')[0];
        }
    } catch (e) {
        console.log('Error parsing DB name from URI', e);
    }

    // Возвращаем имя базы данных по умолчанию
    return 'telegram-anonymous-chat';
}

// Создание заглушки базы данных для локальной разработки
function createFakeMongoDb() {
    console.log('[MongoDB] Создание заглушки базы данных для локальной разработки');

    // Хранилище для эмуляции коллекций в серверной части
    // Используем глобальное хранилище вместо localStorage

    // Возвращаем объект с методами, эмулирующими MongoDB
    return {
        collection: (name) => ({
            find: (query = {}) => ({
                toArray: async () => {
                    // Возвращаем все элементы коллекции или пустой массив
                    return fakeDbStorage[name] || [];
                }
            }),
            findOne: async (query = {}) => {
                if (!fakeDbStorage[name]) return null;

                // Ищем элемент, соответствующий запросу
                return fakeDbStorage[name].find(item =>
                    Object.keys(query).every(key => {
                        if (key === '_id') {
                            return item._id === query._id;
                        }
                        return item[key] === query[key];
                    })
                ) || null;
            },
            insertOne: async (doc) => {
                if (!fakeDbStorage[name]) fakeDbStorage[name] = [];
                // Генерируем ID, если его нет
                if (!doc._id) doc._id = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                fakeDbStorage[name].push(doc);
                return { insertedId: doc._id, acknowledged: true };
            },
            updateOne: async (filter, update, options = {}) => {
                if (!fakeDbStorage[name]) fakeDbStorage[name] = [];

                // Находим индекс элемента для обновления
                const index = fakeDbStorage[name].findIndex(item =>
                    Object.keys(filter).every(key => {
                        if (key === '_id') {
                            return item._id === filter._id;
                        }
                        return item[key] === filter[key];
                    })
                );

                // Если найден, обновляем
                if (index !== -1) {
                    // Обрабатываем оператор $set
                    if (update.$set) {
                        fakeDbStorage[name][index] = { ...fakeDbStorage[name][index], ...update.$set };
                    }
                    return { modifiedCount: 1, acknowledged: true };
                }
                // Если не найден и указана опция upsert, создаем новый документ
                else if (options.upsert) {
                    const newDoc = { ...filter };
                    if (update.$set) Object.assign(newDoc, update.$set);
                    if (!newDoc._id) newDoc._id = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

                    fakeDbStorage[name].push(newDoc);
                    return { upsertedId: newDoc._id, acknowledged: true, modifiedCount: 0, upsertedCount: 1 };
                }

                return { modifiedCount: 0, acknowledged: true };
            },
            deleteOne: async (filter) => {
                if (!fakeDbStorage[name]) return { deletedCount: 0, acknowledged: true };

                // Сохраняем начальную длину для определения количества удаленных документов
                const initialLength = fakeDbStorage[name].length;

                // Фильтруем коллекцию, удаляя соответствующий документ
                fakeDbStorage[name] = fakeDbStorage[name].filter(item =>
                    !Object.keys(filter).every(key => {
                        if (key === '_id') {
                            return item._id === filter._id;
                        }
                        return item[key] === filter[key];
                    })
                );

                // Определяем количество удаленных документов
                const deletedCount = initialLength - fakeDbStorage[name].length;
                return { deletedCount, acknowledged: true };
            }
        })
    };
}

/**
 * Обработчик запросов
 */
exports.handler = async (event) => {
    try {
        // Проверяем метод запроса
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 405,
                body: JSON.stringify({ error: 'Method Not Allowed' })
            };
        }

        // Парсим тело запроса
        const payload = JSON.parse(event.body);
        const { operation, collection, filter, document, update, options } = payload;

        if (DEBUG) {
            console.log(`[MongoDB] Request: ${operation} on ${collection}`);
            console.log('[MongoDB] Payload:', JSON.stringify({
                filter,
                document: document ? '...' : undefined,
                update: update ? '...' : undefined,
                options
            }));
        }

        // Подключаемся к базе данных
        const db = await connectToDatabase();

        // Убедимся, что коллекция существует
        if (!db.collection) {
            throw new Error('Invalid database connection');
        }

        // Выполняем операцию в зависимости от параметра operation
        let result;
        switch (operation) {
            case 'getAll':
                result = await db.collection(collection).find(filter || {}).toArray();
                break;
            case 'getOne':
                result = await db.collection(collection).findOne(filter || {});
                break;
            case 'insertOne':
                result = await db.collection(collection).insertOne(document);
                break;
            case 'updateOne':
                result = await db.collection(collection).updateOne(
                    filter,
                    update,
                    options || {}
                );
                break;
            case 'deleteOne':
                result = await db.collection(collection).deleteOne(filter);
                break;
            default:
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Invalid operation' })
                };
        }

        if (DEBUG) {
            console.log(`[MongoDB] Operation ${operation} completed successfully`);
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, data: result })
        };
    } catch (error) {
        console.error('[MongoDB] Database error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message, stack: error.stack })
        };
    }
};
