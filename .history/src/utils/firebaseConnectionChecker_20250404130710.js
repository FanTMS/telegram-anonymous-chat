import { db } from '../firebase';
import { getDocs, query, collection, limit } from 'firebase/firestore';

/**
 * Расширенная проверка соединения с Firebase
 * @returns {Promise<{success: boolean, message: string}>} Результат проверки
 */
export const checkFirebaseConnection = async () => {
    try {
        console.log('Начало проверки соединения с Firebase...');

        // Пробуем выполнить простейший запрос к базе данных
        const testQuery = query(collection(db, 'users'), limit(1));
        const snapshot = await getDocs(testQuery);

        console.log(`Соединение с Firebase установлено. Получено ${snapshot.size} документов.`);

        return {
            success: true,
            message: "Соединение с Firebase успешно установлено"
        };
    } catch (error) {
        console.error('Ошибка проверки соединения с Firebase:', error.code, error.message);

        // Анализируем тип ошибки для более информативного сообщения
        let errorMessage = "Неизвестная ошибка при подключении к Firebase";

        if (error.code === 'permission-denied') {
            errorMessage = "Недостаточно прав для доступа к базе данных. Проверьте правила безопасности Firebase.";
        } else if (error.code === 'unavailable') {
            errorMessage = "Сервер Firebase недоступен. Проверьте подключение к интернету.";
        } else if (error.code === 'unauthenticated') {
            errorMessage = "Требуется аутентификация для доступа к базе данных.";
        }

        return {
            success: false,
            message: errorMessage,
            error
        };
    }
};

export default checkFirebaseConnection;
