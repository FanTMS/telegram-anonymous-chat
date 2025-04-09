import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

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
    try {
        db = initializeFirestore(app, {
            experimentalForceLongPolling: true,
            useFetchStreams: false,
            synchronizeTabs: true,
            // Используем только настройку localCache без cacheSizeBytes
            localCache: {
                lruGarbageCollection: true,
                tabSynchronization: true
            }
        });
        
        // Включаем оффлайн-персистентность
        try {
            enableIndexedDbPersistence(db)
                .then(() => console.log('Оффлайн-хранилище Firestore активировано'))
                .catch(error => {
                    console.warn('Ошибка активации оффлайн-хранилища:', error);
                });
        } catch (persistenceError) {
            console.warn('Ошибка при настройке оффлайн-режима:', persistenceError);
        }
    } catch (dbError) {
        console.error('Ошибка инициализации Firestore, используем резервный вариант:', dbError);
        // Используем обычный getFirestore как запасной вариант
        db = getFirestore(app);
    }

    // Инициализация остальных сервисов
    auth = getAuth(app);
    storage = getStorage(app);

    // Подключаем эмуляторы для локальной разработки
    if (process.env.NODE_ENV === 'development' && window.location.hostname === 'localhost') {
        try {
            // Раскомментируйте при необходимости локальных эмуляторов
            // connectAuthEmulator(auth, 'http://localhost:9099');
            // connectStorageEmulator(storage, 'localhost', 9199);
            console.log('Эмуляторы Firebase настроены для локальной разработки');
        } catch (emulatorError) {
            console.warn('Ошибка при подключении эмуляторов:', emulatorError);
        }
    }

} catch (error) {
    console.error('Ошибка при инициализации Firebase:', error);
    alert('Произошла ошибка при подключении к базе данных. Приложение может работать некорректно.');
}

export { app, db, auth, storage };
