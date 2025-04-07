import { collection, doc, setDoc, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { safeFirestoreQuery } from './firebaseUtils';

/**
 * Список необходимых коллекций для приложения
 */
export const requiredCollections = [
  'users',
  'chats',
  'messages',
  'interests',
  'searchQueue',
  'groups',
  'groupMessages'
];

/**
 * Инициализирует необходимые коллекции в Firestore
 * @returns {Promise<Object>} Результат инициализации
 */
export const initializeCollections = async () => {
  console.log('Инициализация коллекций Firestore...');
  const results = {};

  for (const collectionName of requiredCollections) {
    try {
      // Проверяем существование коллекции
      const collectionRef = collection(db, collectionName);
      const querySnapshot = await safeFirestoreQuery(() => 
        getDocs(query(collectionRef, limit(1)))
      );
      
      if (querySnapshot && querySnapshot.size > 0) {
        console.log(`Коллекция "${collectionName}" уже существует`);
        results[collectionName] = { exists: true, created: false };
        continue;
      }
      
      // Создаем начальный документ для инициализации коллекции
      const dummyDocRef = doc(collectionRef, '_init_doc');
      await safeFirestoreQuery(() => 
        setDoc(dummyDocRef, {
          _system: true,
          _initialized: new Date().toISOString(),
          _description: `Инициализация коллекции ${collectionName}`
        })
      );
      
      console.log(`Коллекция "${collectionName}" успешно создана`);
      results[collectionName] = { exists: true, created: true };
    } catch (error) {
      console.error(`Ошибка при инициализации коллекции "${collectionName}":`, error);
      
      // В режиме разработки не блокируем выполнение
      if (process.env.NODE_ENV === 'development') {
        results[collectionName] = { 
          exists: true, 
          created: false, 
          error: error.message,
          isDevelopmentFallback: true
        };
      } else {
        results[collectionName] = { exists: false, created: false, error: error.message };
      }
    }
  }

  console.log('Результат инициализации коллекций:', results);
  return results;
};

/**
 * Инициализирует приложение перед использованием
 * @returns {Promise<boolean>} Успешность инициализации
 */
export const initializeApp = async () => {
  try {
    // Инициализируем коллекции
    await initializeCollections();
    
    return true;
  } catch (error) {
    console.error('Ошибка при инициализации приложения:', error);
    
    // В режиме разработки продолжаем работу
    return process.env.NODE_ENV === 'development';
  }
};
