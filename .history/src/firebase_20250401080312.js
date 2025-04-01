import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Используем конфигурацию из переменных окружения или прямо из объекта
// для гибкости в разных окружениях
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCNpBazUWauF99zxWKvAwIJ0mbTsf6il8g",
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "oleop-19cc2.firebaseapp.com",
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "oleop-19cc2",
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "oleop-19cc2.firebasestorage.app",
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "452609655600",
    appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:452609655600:web:95c47ff9b3ea191f6fbef5"
};

console.log("Firebase initialized with project:", firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Анонимная аутентификация для предоставления прав доступа
const signInAnonymouslyIfNeeded = async () => {
    try {
        if (!auth.currentUser) {
            await signInAnonymously(auth);
            console.log("Анонимная аутентификация выполнена успешно");
        }
    } catch (error) {
        console.error("Ошибка при анонимной аутентификации:", error);
    }
};

// Выполняем анонимную аутентификацию сразу
signInAnonymouslyIfNeeded();

export { db, auth, signInAnonymouslyIfNeeded };
