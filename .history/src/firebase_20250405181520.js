import { initializeApp } from 'firebase/app';
import { 
  initializeFirestore, 
  enableIndexedDbPersistence, 
  CACHE_SIZE_UNLIMITED, 
  _connectFirestoreEmulator as connectFirestoreEmulator 
} from 'firebase/firestore';
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
    console.error("Проблемы с конфигурацией Firebase могут привести к ошибкам доступа к базе данных");
}

console.log("Firebase инициализируется с проектом:", firebaseConfig.projectId);

// Инициализация Firebase
const app = initializeApp(firebaseConfig);

// Получение экземпляров сервисов
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Проверка, находимся ли мы в режиме разработки
const isDevelopmentMode = process.env.NODE_ENV === 'development';
if (isDevelopmentMode) {
    console.log("Приложение работает в режиме разработки");

    // Подключаем эмулятор Firestore в режиме разработки если нужно
    // Раскомментируйте этот код, если хотите использовать эмулятор
    /*
    try {
        connectFirestoreEmulator(db, 'localhost', 8080);
        console.log("Подключен эмулятор Firestore на localhost:8080");
    } catch (emulatorError) {
        console.error("Не удалось подключиться к эмулятору Firestore:", emulatorError);
    }
    */
}

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

export default app;
