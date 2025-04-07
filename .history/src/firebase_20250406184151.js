import { initializeApp } from 'firebase/app';
import {
    getFirestore,
    initializeFirestore,
    enableIndexedDbPersistence,
    CACHE_SIZE_UNLIMITED,
    connectFirestoreEmulator
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Конфигурация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyC0eBiNqbL4CLC9mfA_qBwpM5gePWHGN9c",
    authDomain: "oleop-19cc2.firebaseapp.com",
    projectId: "oleop-19cc2",
    storageBucket: "oleop-19cc2.appspot.com",
    messagingSenderId: "452609655600",
    appId: "1:452609655600:web:95c47ff9b3ea191f6fbef5"
};

// Проверка проблем с конфигурацией
const validateConfig = (config) => {
    const missingFields = [];
    for (const [key, value] of Object.entries(config)) {
        if (!value || value === "undefined") {
            missingFields.push(key);
        }
    }

    if (missingFields.length > 0) {
        console.error(`ОШИБКА КОНФИГУРАЦИИ FIREBASE: Отсутствуют обязательные поля: ${missingFields.join(', ')}`);
        return false;
    }
    return true;
};

// Валидируем конфигурацию перед использованием
const isValidConfig = validateConfig(firebaseConfig);
if (!isValidConfig) {
    console.error("Невозможно инициализировать Firebase из-за проблем с конфигурацией");
}

// Инициализация Firebase
console.log("Инициализация Firebase с проектом:", firebaseConfig.projectId);
const app = initializeApp(firebaseConfig);

// Инициализация Firestore с оптимизированными настройками
const db = initializeFirestore(app, {
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    ignoreUndefinedProperties: true
});

const auth = getAuth(app);
const storage = getStorage(app);

// Проверка соединения с Firestore
const checkFirestoreConnection = async () => {
    try {
        const timestamp = Date.now();
        console.log(`[${timestamp}] Проверка соединения с Firestore...`);
        // Пробуем получить небольшой документ, чтобы проверить соединение
        const testCollection = 'system';
        const testDoc = 'connection_test';

        await db.collection(testCollection).doc(testDoc).set({
            lastCheck: timestamp,
            status: 'online'
        });

        console.log(`[${timestamp}] Соединение с Firestore установлено успешно!`);
        return true;
    } catch (error) {
        console.error("Ошибка при проверке соединения с Firestore:", error);
        return false;
    }
};

// Инициализация локальной персистентности для оффлайн-режима
try {
    enableIndexedDbPersistence(db)
        .then(() => {
            console.log("✅ Firestore персистентность включена");
        })
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn('⚠️ Персистентность не может быть включена (несколько вкладок)');
            } else if (err.code === 'unimplemented') {
                console.warn('⚠️ Браузер не поддерживает персистентность');
            } else {
                console.error("❌ Ошибка включения персистентности:", err);
            }
        });
} catch (e) {
    console.error("❌ Ошибка при настройке Firestore:", e);
}

// Проверка, если мы в режиме разработки, то подключаемся к эмулятору
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_FIREBASE_EMULATOR === 'true') {
    try {
        const host = process.env.REACT_APP_FIREBASE_EMULATOR_HOST || 'localhost';
        const port = process.env.REACT_APP_FIREBASE_EMULATOR_PORT || 8080;
        console.log(`🔧 Подключение к эмулятору Firestore: ${host}:${port}`);
        connectFirestoreEmulator(db, host, port);
    } catch (e) {
        console.error("❌ Ошибка подключения к эмулятору:", e);
    }
}

export { app, db, auth, storage, checkFirestoreConnection };
