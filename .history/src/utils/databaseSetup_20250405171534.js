import { db } from '../firebase';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';

/**
 * Функция для проверки и принудительного создания необходимых коллекций
 */
export const ensureCollectionsExist = async () => {
    console.log("Проверка и создание необходимых коллекций...");

    const collectionNames = ['users', 'chats', 'searchQueue'];
    const results = {};

    try {
        for (const collName of collectionNames) {
            try {
                // Пытаемся создать служебный документ в каждой коллекции
                const docRef = doc(db, collName, '_system_init');

                // Проверяем, существует ли документ
                const docSnap = await getDoc(docRef);

                if (!docSnap.exists()) {
                    // Если документ не существует, создаем его
                    await setDoc(docRef, {
                        _created: new Date().toISOString(),
                        _description: `Системный документ для инициализации коллекции ${collName}`,
                        _systemDoc: true
                    });
                    console.log(`Коллекция "${collName}" создана успешно`);
                    results[collName] = 'created';
                } else {
                    console.log(`Коллекция "${collName}" уже существует`);
                    results[collName] = 'exists';
                }
            } catch (error) {
                console.error(`Ошибка при создании коллекции "${collName}":`, error);
                results[collName] = `error: ${error.message}`;
            }
        }

        return { success: true, results };
    } catch (error) {
        console.error("Критическая ошибка при создании коллекций:", error);
        return { success: false, error: error.message };
    }
};
