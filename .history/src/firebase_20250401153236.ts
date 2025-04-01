import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Замените эту конфигурацию на вашу собственную из Firebase Console
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
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
