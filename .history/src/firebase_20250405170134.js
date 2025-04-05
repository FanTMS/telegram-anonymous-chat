import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Конфигурация Firebase
const firebaseConfig = {
    // Используем переменные окружения для безопасности
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCNpBazUWauF99zxWKvAwIJ0mbTsf6il8g",
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "oleop-19cc2.firebaseapp.com",
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "https://oleop-19cc2-default-rtdb.firebaseio.com",
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "telegram-chat-demo-df154.appspot.com",
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "573298982385",
    appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:573298982385:web:3c2c87b4c928c39a4af5a9"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);

// Получение экземпляров сервисов
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
