import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence, initializeFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Конфигурация Firebase с проверкой переменных окружения
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCNpBazUWauF99zxWKvAwIJ0mbTsf6il8g",
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "oleop-19cc2.firebaseapp.com",
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "oleop-19cc2",
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "oleop-19cc2.firebasestorage.app",
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "452609655600",
    appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:452609655600:web:95c47ff9b3ea191f6fbef5"
};

// Проверка обязательных полей конфигурации
const validateConfig = () => {
    const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

    if (missingFields.length > 0) {
        console.error('Отсутствуют обязательные поля конфигурации Firebase:', missingFields);
        return false;
    }
    return true;
};

let app;
let db;
let auth;
let storage;

try {
    if (!validateConfig()) {
        throw new Error('Неверная конфигурация Firebase');
    }

    // Инициализация Firebase
    app = initializeApp(firebaseConfig);
    console.log('Firebase успешно инициализирован');

    // Инициализация Firestore с оптимизированными настройками
    db = initializeFirestore(app, {
        cacheSizeBytes: CACHE_SIZE_UNLIMITED,
        experimentalForceLongPolling: true,
        useFetchStreams: false
    });

    // Включаем оффлайн-персистентность
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('Firebase: Персистентность не может быть включена - открыто несколько вкладок');
        } else if (err.code === 'unimplemented') {
            console.warn('Firebase: Браузер не поддерживает персистентность');
        }
    });

    // Инициализация остальных сервисов
    auth = getAuth(app);
    storage = getStorage(app);

} catch (error) {
    console.error('Ошибка при инициализации Firebase:', error);
    throw error;
}

export { app, db, auth, storage };
