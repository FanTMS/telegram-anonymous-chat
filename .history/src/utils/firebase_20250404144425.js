import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Конфигурация Firebase
// Обычно эти данные хранятся в .env файле для безопасности
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyA1234567890abcdefghijklmnopqrstuvwxyz",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "telegram-anonymous-chat.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "telegram-anonymous-chat",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "telegram-anonymous-chat.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:123456789012:web:abcdef1234567890",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-ABCDEFGHIJ"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);

// Экспорт экземпляров сервисов
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Функция проверки соединения с Firebase
export const checkFirebaseConnection = async () => {
  try {
    // Пытаемся получить timestamp с сервера Firebase
    const timestamp = await fetch(`https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel?database=projects/${firebaseConfig.projectId}/databases/(default)`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    return timestamp.ok;
  } catch (error) {
    console.error('Ошибка при проверке соединения с Firebase:', error);
    return false;
  }
};

export default app;
