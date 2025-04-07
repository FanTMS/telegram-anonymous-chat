import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Конфигурация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCNpBazUWauF99zxWKvAwIJ0mbTsf6il8g",
    authDomain: "oleop-19cc2.firebaseapp.com",
    projectId: "oleop-19cc2",
    storageBucket: "oleop-19cc2.firebasestorage.app",
    messagingSenderId: "452609655600",
    appId: "1:452609655600:web:95c47ff9b3ea191f6fbef5"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);

// Инициализация сервисов
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Включаем оффлайн-персистентность для лучшей работы
try {
    enableIndexedDbPersistence(db)
        .then(() => {
            console.log("Firebase: Персистентность включена");
        })
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn('Firebase: Персистентность не может быть включена - открыто несколько вкладок');
            } else if (err.code === 'unimplemented') {
                console.warn('Firebase: Браузер не поддерживает персистентность');
            }
        });
} catch (error) {
    console.error("Firebase: Ошибка при включении персистентности:", error);
}

export { db, auth, storage, app };
