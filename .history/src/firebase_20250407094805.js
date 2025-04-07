import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
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

export { db, auth, storage, app };
