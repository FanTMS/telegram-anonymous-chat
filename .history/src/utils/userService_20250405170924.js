import { db } from '../firebase';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    limit,
    serverTimestamp,
    arrayUnion
} from 'firebase/firestore';

// Создание или обновление пользователя
export const createOrUpdateUser = async (userId, userData) => {
    try {
        // Проверяем наличие коллекции users
        try {
            const usersCollectionRef = collection(db, 'users');
            await getDocs(query(usersCollectionRef, limit(1)));
        } catch (collectionError) {
            console.error('Ошибка доступа к коллекции users:', collectionError);
            // Создаем документ для инициализации коллекции
            await setDoc(doc(db, 'users', '_init'), {
                systemDoc: true,
                createdAt: new Date()
            });
            console.log('Коллекция users была инициализирована');
        }

        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            // Обновляем существующего пользователя
            await updateDoc(userRef, {
                ...userData,
                lastSeen: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return { id: userId, ...userDoc.data(), ...userData };
        } else {
            // Создаем нового пользователя
            await setDoc(userRef, {
                ...userData,
                createdAt: serverTimestamp(),
                lastSeen: serverTimestamp(),
                updatedAt: serverTimestamp(),
                chatCount: 0,
                messageCount: 0,
                status: 'active'
            });
            return { id: userId, ...userData };
        }
    } catch (error) {
        console.error('Ошибка при создании/обновлении пользователя:', error);
        throw new Error(`Не удалось сохранить данные пользователя: ${error.message}`);
    }
};

// Получение пользователя по ID
export const getUserById = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            return { id: userId, ...userDoc.data() };
        }
        return null;
    } catch (error) {
        console.error('Ошибка при получении пользователя:', error);
        throw new Error('Не удалось получить данные пользователя.');
    }
};

// Обновление данных пользователя
export const updateUser = async (userId, userData) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            ...userData,
            updatedAt: serverTimestamp()
        });

        return { id: userId, ...userData };
    } catch (error) {
        console.error('Ошибка при обновлении пользователя:', error);
        throw new Error('Не удалось обновить данные пользователя.');
    }
};

// Обновление статуса активности пользователя
export const updateUserActivity = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            lastSeen: serverTimestamp(),
            status: 'online'
        });
    } catch (error) {
        console.error('Ошибка при обновлении статуса активности:', error);
    }
};

// Получение случайного пользователя, кроме текущего
export const getRandomUser = async (currentUserId, _preferences = {}) => {
    try {
        let q = query(collection(db, 'users'),
            where('status', '==', 'active'),
            limit(30)
        );

        const querySnapshot = await getDocs(q);
        const users = [];

        querySnapshot.forEach(doc => {
            if (doc.id !== currentUserId) {
                users.push({ id: doc.id, ...doc.data() });
            }
        });

        if (users.length === 0) {
            return null;
        }

        // Выбираем случайного пользователя
        return users[Math.floor(Math.random() * users.length)];
    } catch (error) {
        console.error('Ошибка при поиске случайного пользователя:', error);
        throw new Error('Не удалось найти случайного пользователя.');
    }
};

// Добавление интереса пользователю
export const addUserInterest = async (userId, interest) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            interests: arrayUnion(interest),
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Ошибка при добавлении интереса:', error);
        throw new Error('Не удалось добавить интерес.');
    }
};

export default {
    createOrUpdateUser,
    getUserById,
    updateUser,
    updateUserActivity,
    getRandomUser,
    addUserInterest
};
