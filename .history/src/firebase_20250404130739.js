import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Используем конфигурацию из переменных окружения или прямо из объекта
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

// Улучшенная функция для анонимной аутентификации с обходом ошибок и журналированием
const signInAnonymouslyIfNeeded = async () => {
    try {
        if (!auth.currentUser) {
            console.log("Попытка анонимной аутентификации...");
            try {
                // Пробуем выполнить анонимную аутентификацию
                const userCredential = await signInAnonymously(auth);
                console.log("Анонимная аутентификация выполнена успешно. UID:", userCredential.user.uid);
                return true;
            } catch (error) {
                // Если не удалось, логируем ошибку, но не выбрасываем исключение
                console.error("Ошибка при анонимной аутентификации:", error.code, error.message);
                console.log("Продолжаем работу без аутентификации");
                return false;
            }
        } else {
            console.log("Пользователь уже аутентифицирован:", auth.currentUser.uid);
            return true;
        }
    } catch (error) {
        console.error("Непредвиденная ошибка в signInAnonymouslyIfNeeded:", error);
        return false;
    }
};

// Тестируем соединение с Firebase при инициализации
(async function testConnection() {
    try {
        const authResult = await signInAnonymouslyIfNeeded();
        console.log("Статус аутентификации:", authResult ? "успешно" : "не удалось");
        console.log("Инициализация Firebase завершена успешно");
    } catch (error) {
        console.log("Приложение продолжит работу без аутентификации Firebase");
    }
})();

export { db, auth, signInAnonymouslyIfNeeded };
