import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Обычно конфигурацию Firebase не включают в репозиторий,
// но убедитесь, что у вас настроена правильная конфигурация
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Инициализируем Firebase
const app = initializeApp(firebaseConfig);

// Экспортируем экземпляры сервисов
export const auth = getAuth(app);
export const db = getFirestore(app);

// Дополнительные индексы в Firestore:
//
// 1. Коллекция 'users':
//    - Составной индекс: searchingForChat, searchMode (для поиска собеседников)
//
// 2. Коллекция 'chats':
//    - Индекс по полю 'participants' (для поиска чатов пользователя)
