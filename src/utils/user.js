import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getTelegramUser } from './telegramUtils';

/**
 * Проверяет, имеет ли текущий пользователь права администратора
 * @returns {Promise<boolean>} - true, если пользователь имеет права администратора
 */
export const isAdmin = async () => {
    try {
        // Проверяем, запущено ли приложение локально (в разработке)
        const isLocalhost =
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname.includes('192.168.');
        
        // В локальной разработке всегда возвращаем true
        if (isLocalhost) {
            console.log('Локальная разработка: полные права администратора предоставлены автоматически');
            return true;
        }
        
        // Получаем данные пользователя из Telegram
        const telegramUser = getTelegramUser();
        
        if (!telegramUser || !telegramUser.id) {
            console.warn('Не удалось получить данные пользователя Telegram');
            return false;
        }
        
        // Формируем ID пользователя
        const userId = telegramUser.id.toString();
        
        // Специальные администраторы
        if (userId === '5394381166') {
            console.log('Обнаружен главный администратор');
            return true;
        }
        
        // Проверяем в системном документе, является ли пользователь администратором
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
        console.error('Ошибка при проверке прав администратора:', error);
        return false;
    }
};

/**
 * Проверяет, является ли указанный пользователь администратором
 * @param {string} userId - ID пользователя для проверки
 * @returns {Promise<boolean>} - true, если пользователь имеет права администратора
 */
export const isUserAdmin = async (userId) => {
    try {
        // Проверяем, запущено ли приложение локально (в разработке)
        const isLocalhost =
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname.includes('192.168.');
        
        // В локальной разработке всегда возвращаем true
        if (isLocalhost) {
            return true;
        }
        
        if (!userId) return false;
        
        // Специальные администраторы
        if (userId === '5394381166') {
            return true;
        }
        
        // Проверяем в системном документе, является ли пользователь администратором
        const configRef = doc(db, 'system', 'config');
        const configDoc = await getDoc(configRef);
        
        if (!configDoc.exists()) {
            console.warn('Системный документ конфигурации не найден');
            return false;
        }
        
        const config = configDoc.data();
        
        // Проверяем список администраторов
        if (config.admins && Array.isArray(config.admins)) {
            return config.admins.includes(userId.toString());
        }
        
        return false;
    } catch (error) {
        console.error('Ошибка при проверке прав администратора для пользователя:', error);
        return false;
    }
};

export default {
    isAdmin,
    isUserAdmin
}; 