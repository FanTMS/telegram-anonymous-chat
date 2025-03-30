/**
 * Сервис для работы с MongoDB через Netlify Functions
 * Заменяет LocalStorage
 */

const API_URL = '/.netlify/functions/mongodb';

/**
 * Выполняет запрос к MongoDB
 * @param {string} operation - операция (get, getAll, set, delete)
 * @param {string} collection - коллекция
 * @param {object} payload - данные для сохранения
 * @param {object} query - запрос для поиска
 * @returns {Promise<any>} - результат операции
 */
const dbRequest = async (operation, collection, payload = null, query = null) => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                operation,
                collection,
                payload,
                query,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('DB operation failed:', error);
        // В случае ошибки сети, временно используем localStorage как fallback
        if (operation === 'get') {
            const data = localStorage.getItem(collection);
            return data ? JSON.parse(data) : null;
        }
        throw error;
    }
};

/**
 * Получить данные из MongoDB
 * @param {string} key - ключ (коллекция.документИд)
 * @returns {Promise<any>} - данные
 */
export const getItem = async (key) => {
    const [collection, id] = key.split('.');
    let query = {};

    if (id) {
        query = { _id: id };
    }

    const result = await dbRequest('get', collection, null, query);
    return result;
};

/**
 * Получить все данные из коллекции
 * @param {string} collection - название коллекции
 * @param {object} query - запрос для фильтрации
 * @returns {Promise<Array>} - массив документов
 */
export const getAllItems = async (collection, query = {}) => {
    const result = await dbRequest('getAll', collection, null, query);
    return result;
};

/**
 * Сохранить данные в MongoDB
 * @param {string} key - ключ (коллекция.документИд)
 * @param {any} value - данные для сохранения
 * @returns {Promise<void>}
 */
export const setItem = async (key, value) => {
    const [collection, id] = key.split('.');
    let payload = value;

    if (id && typeof value === 'object') {
        payload = { ...value, _id: id };
    } else if (id) {
        payload = { _id: id, value };
    }

    await dbRequest('set', collection, payload);
};

/**
 * Удалить данные из MongoDB
 * @param {string} key - ключ (коллекция.документИд)
 * @returns {Promise<void>}
 */
export const removeItem = async (key) => {
    const [collection, id] = key.split('.');
    await dbRequest('delete', collection, null, { _id: id });
};
