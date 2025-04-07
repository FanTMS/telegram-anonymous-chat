import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './firebase-config';

// Инициализируем Firebase
const app = initializeApp(firebaseConfig);

// Инициализируем сервисы
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export { app }; // Добавляем экспорт app
