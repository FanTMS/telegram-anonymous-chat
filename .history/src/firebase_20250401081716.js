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

// Обновленная функция для анонимной аутентификации с обходом ошибок
const signInAnonymouslyIfNeeded = async () => {
    try {
        if (!auth.currentUser) {
            try {
                // Пробуем выполнить анонимную аутентификацию
                await signInAnonymously(auth);
                console.log("Анонимная аутентификация выполнена успешно");
                return true;
            } catch (error) {
                // Если не удалось, логируем ошибку, но не выбрасываем исключение
                console.warn("Не удалось выполнить анонимную аутентификацию:", error);
                
                // Специальная обработка ошибки, если анонимная аутентификация отключена
                if (error.code === 'auth/admin-restricted-operation') {
                    console.log("Анонимная аутентификация отключена в Firebase. Продолжаем без аутентификации.");
                }
                
                return false;
            }
        }
        return true;
    } catch (error) {
        console.error("Ошибка при проверке состояния аутентификации:", error);
        return false;
    }
};

// Пробуем выполнить аутентификацию, но не блокируем работу приложения при ошибке
signInAnonymouslyIfNeeded().then(success => {
    if (success) {
        console.log("Инициализация аутентификации Firebase завершена успешно");
    } else {
        console.log("Приложение продолжит работу без аутентификации Firebase");
    }
});

export { db, auth, signInAnonymouslyIfNeeded };
