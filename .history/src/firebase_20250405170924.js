import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Конфигурация Firebase
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyC0eBiNqbL4CLC9mfA_qBwpM5gePWHGN9c",
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "oleop-19cc2.firebaseapp.com",
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "oleop-19cc2",
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "oleop-19cc2.appspot.com",
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "452609655600",
    appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:452609655600:web:95c47ff9b3ea191f6fbef5"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);

// Получение экземпляров сервисов
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Включаем оффлайн-персистентность для лучшей работы
try {
    enableIndexedDbPersistence(db)
        .then(() => {
            console.log("Firestore персистентность включена");
        })
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn('Персистентность не может быть включена, т.к. открыто несколько вкладок');
            } else if (err.code === 'unimplemented') {
                console.warn('Текущий браузер не поддерживает все возможности, необходимые для персистентности');
            } else {
                console.error('Ошибка при включении персистентности:', err);
            }
        });
} catch (e) {
    console.warn('Ошибка при инициализации персистентности:', e);
}

console.log(`Firebase инициализирован с проектом: ${firebaseConfig.projectId}`);

export default app;
