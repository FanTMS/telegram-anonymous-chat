import { db } from '../firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

/**
 * Инициализирует необходимые коллекции в Firebase
 */
export const initializeFirebaseCollections = async () => {
  console.log('Инициализация коллекций Firebase...');
  
  try {
    // Проверка и создание коллекции users, если она не существует
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    if (usersSnapshot.empty) {
      // Если коллекция пуста, создаем служебный документ для инициализации
      await setDoc(doc(db, 'users', '_init'), {
        systemDoc: true,
        createdAt: new Date(),
        description: 'Инициализирующий документ для коллекции users'
      });
      console.log('Коллекция users была инициализирована');
    }
    
    // Проверка и создание коллекции searchQueue, если она не существует
    const searchQueueRef = collection(db, 'searchQueue');
    const searchQueueSnapshot = await getDocs(searchQueueRef);
    
    if (searchQueueSnapshot.empty) {
      await setDoc(doc(db, 'searchQueue', '_init'), {
        systemDoc: true,
        createdAt: new Date(),
        description: 'Инициализирующий документ для коллекции searchQueue'
      });
      console.log('Коллекция searchQueue была инициализирована');
    }
    
    // Проверка и создание коллекции chats, если она не существует
    const chatsRef = collection(db, 'chats');
    const chatsSnapshot = await getDocs(chatsRef);
    
    if (chatsSnapshot.empty) {
      await setDoc(doc(db, 'chats', '_init'), {
        systemDoc: true,
        createdAt: new Date(),
        description: 'Инициализирующий документ для коллекции chats'
      });
      console.log('Коллекция chats была инициализирована');
    }
    
    return true;
  } catch (error) {
    console.error('Ошибка при инициализации коллекций Firebase:', error);
    return false;
  }
};
