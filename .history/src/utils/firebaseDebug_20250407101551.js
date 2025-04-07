import { db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const testFirebaseConnection = async () => {
    try {
        const testRef = doc(db, '_test_', 'connectivity');
        const timestamp = new Date().toISOString();
        
        // Пробуем записать
        await setDoc(testRef, { timestamp }, { merge: true });
        
        // Пробуем прочитать
        const docSnap = await getDoc(testRef);
        
        if (docSnap.exists()) {
            console.log('Firebase: Соединение работает', docSnap.data());
            return true;
        } else {
            console.error('Firebase: Документ не найден после записи');
            return false;
        }
    } catch (error) {
        console.error('Firebase: Ошибка соединения:', error);
        return false;
    }
};
