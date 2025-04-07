import { db } from '../firebase';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';

/**
 * Проверяет и создаёт необходимые индексы для поиска собеседника
 * @returns {Promise<boolean>} - Успешность операции
 */
export const createRequiredIndexes = async () => {
    try {
        console.log('Проверка и создание необходимых индексов...');
        
        // Проверяем наличие метадокумента с информацией о созданных индексах
        const indexesInfoRef = doc(db, 'system', 'indexes_info');
        const indexesInfoSnap = await getDoc(indexesInfoRef);
        
        if (indexesInfoSnap.exists() && indexesInfoSnap.data().searchQueueIndexCreated) {
            console.log('Индексы уже созданы и активны');
            return true;
        }
        
        // Создаем тестовые записи для активации индексов
        await createTestDocumentsForIndexes();
        
        // Обновляем метадокумент с информацией об индексах
        await setDoc(indexesInfoRef, {
            searchQueueIndexCreated: true,
            updatedAt: new Date().toISOString(),
            info: `Для поиска собеседника требуется индекс для коллекции "searchQueue", 
                   упорядоченной по полю "timestamp" по возрастанию. 
                   Если возникнет ошибка "requires an index", следуйте инструкциям Firebase.`
        }, { merge: true });
        
        console.log('Запрос на создание индексов отправлен. Firebase автоматически создаст необходимые индексы при первом запросе.');
        return true;
    } catch (error) {
        console.error('Ошибка при создании индексов:', error);
        return false;
    }
};

/**
 * Создаёт тестовые документы для активации индексов
 * @returns {Promise<void>}
 */
const createTestDocumentsForIndexes = async () => {
    try {
        // Создаем временную коллекцию для активации индексов
        const searchQueueRef = collection(db, 'searchQueue');
        
        // Создаем пару тестовых документов с полем timestamp
        await setDoc(doc(db, 'searchQueue', 'test_index_doc_1'), {
            userId: 'test_user_1',
            timestamp: new Date(Date.now() - 1000) // 1 секунду назад
        });
        
        await setDoc(doc(db, 'searchQueue', 'test_index_doc_2'), {
            userId: 'test_user_2',
            timestamp: new Date() // текущее время
        });
        
        console.log('Тестовые документы для индексов созданы');
    } catch (error) {
        console.error('Ошибка при создании тестовых документов для индексов:', error);
        throw error;
    }
};

/**
 * Генерирует инструкции для создания индексов в Firebase
 * @returns {string} - HTML строка с инструкциями
 */
export const getIndexCreationInstructions = () => {
    const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID || 'oleop-19cc2';
    
    return `
<div style="padding: 16px; background-color: #f8f9fa; border-radius: 8px; margin: 16px 0;">
    <h3 style="margin-top: 0;">Инструкция по созданию индексов в Firebase</h3>
    <ol>
        <li>Перейдите в <a href="https://console.firebase.google.com/project/${projectId}/firestore/indexes" target="_blank" rel="noopener noreferrer">Firebase Console</a></li>
        <li>Выберите вкладку "Индексы"</li>
        <li>Нажмите "Создать индекс"</li>
        <li>В поле "Коллекция" выберите или введите "searchQueue"</li>
        <li>Добавьте поле "timestamp" с порядком сортировки "По возрастанию"</li>
        <li>Нажмите "Создать"</li>
    </ol>
    <p>После создания индекса может потребоваться некоторое время для его активации (обычно от нескольких секунд до минуты).</p>
</div>
    `;
};
