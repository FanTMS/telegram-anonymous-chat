import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Используем переменные окружения для безопасностиые получили из Firebase Console)
const firebaseConfig = {
    apiKey: "AIzaSyCNpBazUWauF99zxWKvAwIJ0mbTsf6il8g",
    authDomain: "oleop-19cc2.firebaseapp.com",
    databaseURL: "https://oleop-19cc2-default-rtdb.firebaseio.com",
    projectId: "oleop-19cc2",
    storageBucket: "oleop-19cc2.firebasestorage.app",
    messagingSenderId: "452609655600",
    appId: "1:452609655600:web:95c47ff9b3ea191f6fbef5",
    measurementId: "G-X4DP12TNSB"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
