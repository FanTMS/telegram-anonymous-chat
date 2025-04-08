import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Добавляет пользователя с указанным Telegram ID в список администраторов
 * @param {string} telegramId - Telegram ID пользователя
 * @returns {Promise<boolean>} - true, если операция успешна
 */
export const addAdminByTelegramId = async (telegramId) => {
    try {
        if (!telegramId) {
            console.error('Telegram ID не указан');
            return false;
        }
        
        // Преобразуем в строку для совместимости
        const userId = telegramId.toString();
        
        // Получаем ссылку на документ конфигурации
        const configRef = doc(db, 'system', 'config');
        const configDoc = await getDoc(configRef);
        
        if (configDoc.exists()) {
            // Документ уже существует, обновляем его
            const config = configDoc.data();
            const admins = config.admins || [];
            
            // Проверяем, не является ли пользователь уже администратором
            if (admins.includes(userId)) {
                console.log(`Пользователь с Telegram ID ${userId} уже является администратором`);
                return true;
            }
            
            // Добавляем пользователя в список администраторов
            await updateDoc(configRef, {
                admins: arrayUnion(userId)
            });
            
            console.log(`Пользователь с Telegram ID ${userId} успешно добавлен в список администраторов`);
            return true;
        } else {
            // Документ не существует, создаем его
            await setDoc(configRef, {
                admins: [userId],
                created: new Date(),
                lastUpdated: new Date()
            });
            
            console.log(`Создан новый документ конфигурации. Пользователь с Telegram ID ${userId} добавлен как администратор`);
            return true;
        }
    } catch (error) {
        console.error('Ошибка при добавлении администратора:', error);
        return false;
    }
};

/**
 * Проверяет локальную разработку и при необходимости добавляет указанный Telegram ID в список администраторов
 * @param {string} telegramId - Telegram ID пользователя
 * @returns {Promise<boolean>} - true, если проверка прошла успешно
 */
export const setupLocalAdminRights = async (telegramId) => {
    try {
        // Проверяем, запущено ли приложение локально
        const isLocalhost =
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname.includes('192.168.');
            
        if (isLocalhost) {
            console.log('Локальная разработка: настройка прав администратора');
            
            // Добавляем указанный Telegram ID в список администраторов
            if (telegramId) {
                await addAdminByTelegramId(telegramId);
            }
            
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Ошибка при настройке прав локального администратора:', error);
        return false;
    }
};

/**
 * Проверяет, является ли пользователь с указанным Telegram ID администратором
 * @param {string} telegramId - Telegram ID пользователя
 * @returns {Promise<boolean>} - true, если пользователь является администратором
 */
export const isUserAdminByTelegramId = async (telegramId) => {
    try {
        if (!telegramId) return false;
        
        // Преобразуем в строку для совместимости
        const userId = telegramId.toString();
        
        // Получаем ссылку на документ конфигурации
        const configRef = doc(db, 'system', 'config');
        const configDoc = await getDoc(configRef);
        
        if (!configDoc.exists()) {
            console.warn('Системный документ конфигурации не найден');
            return false;
        }
        
        const config = configDoc.data();
        
        // Проверяем список администраторов
        if (config.admins && Array.isArray(config.admins)) {
            return config.admins.includes(userId);
        }
        
        return false;
    } catch (error) {
        console.error('Ошибка при проверке статуса администратора:', error);
        return false;
    }
};

/**
 * Добавляет пользователя с указанным Firebase UID в список администраторов
 * @param {string} uid - Firebase UID пользователя
 * @returns {Promise<boolean>} - true, если операция успешна
 */
export const addAdminByUID = async (uid) => {
    try {
        if (!uid) {
            console.error('Firebase UID не указан');
            return false;
        }
        
        // Обновляем поле isAdmin в документе пользователя
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            // Обновляем документ пользователя, устанавливая isAdmin: true
            await updateDoc(userRef, {
                isAdmin: true,
                adminSince: new Date()
            });
            
            console.log(`Пользователь с UID ${uid} получил права администратора`);
            
            // Добавляем UID в системную конфигурацию для резервного списка
            const configRef = doc(db, 'system', 'config');
            const configDoc = await getDoc(configRef);
            
            if (configDoc.exists()) {
                const config = configDoc.data();
                const adminUIDs = config.adminUIDs || [];
                
                if (!adminUIDs.includes(uid)) {
                    await updateDoc(configRef, {
                        adminUIDs: arrayUnion(uid)
                    });
                }
            } else {
                // Создаем документ конфигурации, если его нет
                await setDoc(configRef, {
                    adminUIDs: [uid],
                    created: new Date(),
                    lastUpdated: new Date()
                });
            }
            
            return true;
        } else {
            console.error(`Пользователь с UID ${uid} не найден`);
            return false;
        }
    } catch (error) {
        console.error('Ошибка при добавлении администратора по UID:', error);
        return false;
    }
};

/**
 * Проверяет, является ли пользователь с указанным Firebase UID администратором
 * @param {string} uid - Firebase UID пользователя
 * @returns {Promise<boolean>} - true, если пользователь является администратором
 */
export const isUserAdminByUID = async (uid) => {
    try {
        if (!uid) return false;
        
        // Проверяем запуск в локальной среде
        const isLocalhost =
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname.includes('192.168.');
        
        // В локальной разработке все пользователи считаются администраторами
        if (isLocalhost) {
            console.log('Локальная разработка: пользователь автоматически считается администратором');
            return true;
        }
        
        // Проверяем права администратора в документе пользователя
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            return userData.isAdmin === true;
        }
        
        // Проверяем в резервном списке в конфигурации
        const configRef = doc(db, 'system', 'config');
        const configDoc = await getDoc(configRef);
        
        if (configDoc.exists()) {
            const config = configDoc.data();
            if (config.adminUIDs && Array.isArray(config.adminUIDs)) {
                return config.adminUIDs.includes(uid);
            }
        }
        
        return false;
    } catch (error) {
        console.error('Ошибка при проверке статуса администратора по UID:', error);
        return false;
    }
};

export default {
    addAdminByTelegramId,
    setupLocalAdminRights,
    isUserAdminByTelegramId,
    addAdminByUID,
    isUserAdminByUID
}; 