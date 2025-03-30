import axios from 'axios';

/**
 * Тестирует подключение к MongoDB через Netlify функцию
 * @returns {Promise<boolean>} - Результат проверки
 */
export const testMongoDBConnection = async () => {
    try {
        console.log('Тестирование подключения к MongoDB...');

        // Отправляем тестовый запрос
        const testData = {
            _id: `test_${Date.now()}`,
            createdAt: new Date().toISOString(),
            value: 'Test connection'
        };

        // Попытка вставить тестовую запись
        console.log('Попытка вставить тестовую запись...');
        const insertResponse = await axios.post('/.netlify/functions/mongodb', {
            operation: 'insertOne',
            collection: 'connection_tests',
            document: testData
        });

        console.log('Ответ на запрос вставки:', insertResponse.data);

        if (!insertResponse.data.success) {
            throw new Error('Не удалось вставить тестовую запись');
        }

        // Попытка получить вставленную запись
        console.log('Попытка получить вставленную запись...');
        const getResponse = await axios.post('/.netlify/functions/mongodb', {
            operation: 'getOne',
            collection: 'connection_tests',
            filter: { _id: testData._id }
        });

        console.log('Ответ на запрос получения:', getResponse.data);

        // Удаление тестовой записи
        console.log('Попытка удалить тестовую запись...');
        const deleteResponse = await axios.post('/.netlify/functions/mongodb', {
            operation: 'deleteOne',
            collection: 'connection_tests',
            filter: { _id: testData._id }
        });

        console.log('Ответ на запрос удаления:', deleteResponse.data);

        // Проверка всего цикла операций
        const success =
            insertResponse.data.success &&
            getResponse.data.success &&
            deleteResponse.data.success;

        if (success) {
            console.log('✅ Тест MongoDB прошел успешно!');
        } else {
            console.error('❌ Тест MongoDB завершился с ошибками');
        }

        return success;
    } catch (error) {
        console.error('❌ Ошибка при тестировании MongoDB:', error);
        return false;
    }
};

// Запускаем тест при импорте этого модуля
if (import.meta.env.DEV) {
    console.log('Запуск автоматического тестирования MongoDB...');
    setTimeout(() => {
        testMongoDBConnection();
    }, 1000);
}
