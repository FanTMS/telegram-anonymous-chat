import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Конфигурация Firebase
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyA1xG-rXDSJwrwNDVj5rDDeCBRQQWs95dE",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "anonymous-telegram-chat-app.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "anonymous-telegram-chat-app",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "anonymous-telegram-chat-app.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:123456789012:web:abc123def456ghi789jkl"
};

// Инициализация Firebase
const app = initializeApp(firebaseConfig);

// Инициализация сервисов
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
