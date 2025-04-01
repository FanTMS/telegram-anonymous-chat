/**
 * Конфигурация Firebase
 * Получает данные конфигурации из переменных окружения
 */
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Конфигурация Firebase
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCNpBazUWauF99zxWKvAwIJ0mbTsf6il8g",
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "oleop-19cc2.firebaseapp.com",
    databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || "https://oleop-19cc2-default-rtdb.firebaseio.com",
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "oleop-19cc2",
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "oleop-19cc2.firebasestorage.app",
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "452609655600",
    appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:452609655600:web:95c47ff9b3ea191f6fbef5",
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-X4DP12TNSB"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);

// Инициализация сервисов Firebase
const auth = getAuth(app);
const firestore = getFirestore(app);
const database = getDatabase(app);
const storage = getStorage(app);

// Инициализация аналитики, если поддерживается
let analytics = null;
isSupported().then(supported => {
    if (supported) {
        analytics = getAnalytics(app);
    }
}).catch(error => {
    console.warn('Firebase Analytics не поддерживается:', error);
});

export {
    app,
    auth,
    firestore,
    database,
    storage,
    analytics,
    firebaseConfig
};
