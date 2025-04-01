import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Настройка Firebase (замените этими данными, которые получили из Firebase Console)
const firebaseConfig = {
  apiKey: "ваш-api-key",
  authDomain: "ваш-project-id.firebaseapp.com",
  projectId: "ваш-project-id",
  storageBucket: "ваш-project-id.appspot.com",
  messagingSenderId: "ваш-messaging-sender-id",
  appId: "ваш-app-id"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
