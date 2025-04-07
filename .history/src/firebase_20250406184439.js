import { initializeApp, getApps, getApp } from 'firebase/app';
import {
    getFirestore,
    initializeFirestore,
    enableIndexedDbPersistence,
    CACHE_SIZE_UNLIMITED,
    connectFirestoreEmulator
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { firebaseConfig, validateFirebaseConfig } from './firebase-config';

// Проверка конфигурации перед инициализацией
if (!validateFirebaseConfig(firebaseConfig)) {
    console.error("Невозможно инициализировать Firebase из-за неверной конфигурации!");
}

// Инициализируем Firebase только если еще нет активного экземпляра
let app;
try {
    if (getApps().length === 0) {
        console.log("Инициализация Firebase с проектом:", firebaseConfig.projectId);
        app = initializeApp(firebaseConfig);
    } else {
        console.log("Используем существующий экземпляр Firebase");
        app = getApp();
    }
} catch (error) {
    console.error("Ошибка при инициализации Firebase:", error);
}

// Инициализация Firestore с оптимизированными настройками
const db = initializeFirestore(app, {
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    ignoreUndefinedProperties: true
});

// Инициализация других сервисов
const auth = getAuth(app);
const storage = getStorage(app);

// Включаем оффлайн-персистентность для Firestore
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
        const port = parseInt(process.env.REACT_APP_FIREBASE_EMULATOR_PORT || '8080', 10);
        console.log(`🔧 Подключение к эмулятору Firestore: ${host}:${port}`);
        connectFirestoreEmulator(db, host, port);
    } catch (e) {
        console.error("❌ Ошибка подключения к эмулятору:", e);
    }
}

export { app, db, auth, storage };
