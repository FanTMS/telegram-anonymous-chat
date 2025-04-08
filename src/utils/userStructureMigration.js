import { db } from '../firebase';
import { collection, getDocs, doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Функция для миграции структуры пользователей - добавляет поля для поддержки функции друзей
 * Запускать её нужно один раз при обновлении приложения
 */
export const migrateUserStructure = async () => {
    try {
        console.log('Начинаем миграцию структуры пользователей...');
        
        // Получаем всех пользователей
        const usersQuery = collection(db, 'users');
        const usersSnapshot = await getDocs(usersQuery);
        
        if (usersSnapshot.empty) {
            console.log('Нет пользователей для миграции');
            return;
        }
        
        console.log(`Найдено ${usersSnapshot.size} пользователей для обновления`);
        
        // Обновляем каждого пользователя, добавляя недостающие поля
        const updatePromises = usersSnapshot.docs.map(async (userDoc) => {
            const userData = userDoc.data();
            const updates = {};
            
            // Добавляем поле friends, если его нет
            if (!Object.prototype.hasOwnProperty.call(userData, 'friends')) {
                updates.friends = [];
            }
            
            // Добавляем поле friendRequests, если его нет 
            if (!Object.prototype.hasOwnProperty.call(userData, 'friendRequests')) {
                updates.friendRequests = [];
            }
            
            // Добавляем поле sentFriendRequests, если его нет
            if (!Object.prototype.hasOwnProperty.call(userData, 'sentFriendRequests')) {
                updates.sentFriendRequests = [];
            }
            
            // Если есть что обновлять, выполняем обновление
            if (Object.keys(updates).length > 0) {
                await updateDoc(doc(db, 'users', userDoc.id), updates);
                return { id: userDoc.id, updated: true };
            }
            
            return { id: userDoc.id, updated: false };
        });
        
        const results = await Promise.all(updatePromises);
        const updatedCount = results.filter(result => result.updated).length;
        
        console.log(`Миграция завершена. Обновлено ${updatedCount} из ${results.length} пользователей.`);
        
        return {
            success: true,
            totalUsers: results.length,
            updatedUsers: updatedCount
        };
    } catch (error) {
        console.error('Ошибка при миграции структуры пользователей:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Функция для проверки наличия всех необходимых полей у конкретного пользователя
 * и их добавления при необходимости
 */
export const ensureUserFields = async (userId) => {
    if (!userId) return;
    
    try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            console.log(`Пользователь ${userId} не найден`);
            return;
        }
        
        const userData = userDoc.data();
        const updates = {};
        
        // Проверяем и добавляем необходимые поля
        if (!Object.prototype.hasOwnProperty.call(userData, 'friends')) {
            updates.friends = [];
        }
        
        if (!Object.prototype.hasOwnProperty.call(userData, 'friendRequests')) {
            updates.friendRequests = [];
        }
        
        if (!Object.prototype.hasOwnProperty.call(userData, 'sentFriendRequests')) {
            updates.sentFriendRequests = [];
        }
        
        // Если есть что обновлять, выполняем обновление
        if (Object.keys(updates).length > 0) {
            await updateDoc(userRef, updates);
            console.log(`Поля пользователя ${userId} обновлены`);
        }
    } catch (error) {
        console.error(`Ошибка при обновлении полей пользователя ${userId}:`, error);
    }
}; 