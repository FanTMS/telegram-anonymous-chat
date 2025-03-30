// filepath: c:\Users\user\Desktop\Project\telegram-anonymous-chat\src\utils\admin-helper.ts
import {
    addAdmin,
    getUserByTelegramId,
    getAdmins,
    createAdminUserFromTelegram,
    setAdminByTelegramId,
    getCurrentUser,
    saveUser
} from './user';

/**
 * Специальная функция для добавления администратора по Telegram ID
 * @param telegramId ID пользователя в Telegram
 * @param adminName Имя администратора (опционально)
 * @returns 
 */
export const makeAdmin = async (telegramId: string, adminName: string = 'Администратор'): Promise<boolean> => {
    try {
        console.log(`Начало процесса назначения администратора для Telegram ID: ${telegramId}`);

        // Проверяем, является ли пользователь уже администратором
        const admins = getAdmins();
        console.log('Текущие администраторы:', admins);

        if (admins.includes(telegramId)) {
            console.log(`Пользователь с ID ${telegramId} уже является администратором`);

            // Дополнительно проверяем текущего пользователя
            const currentUser = getCurrentUser();
            if (currentUser && currentUser.telegramData?.telegramId === telegramId && !currentUser.isAdmin) {
                currentUser.isAdmin = true;
                saveUser(currentUser);
                console.log(`Обновлен текущий пользователь: isAdmin = true`);
            }

            return true;
        }

        // Пытаемся найти пользователя с этим Telegram ID
        const existingUser = await getUserByTelegramId(telegramId);

        if (existingUser) {
            console.log(`Найден пользователь с Telegram ID ${telegramId}: ${existingUser.name}`);
            // Устанавливаем права администратора
            const result = await setAdminByTelegramId(telegramId);
            console.log(`Установка прав администратора: ${result ? 'Успешно' : 'Ошибка'}`);

            // Проверяем текущего пользователя
            const currentUser = getCurrentUser();
            if (currentUser && currentUser.id === existingUser.id) {
                currentUser.isAdmin = true;
                saveUser(currentUser);
                console.log(`Обновлен текущий пользователь: isAdmin = true`);
            }

            return result;
        } else {
            // Создаем нового пользователя-администратора
            console.log(`Пользователь с Telegram ID ${telegramId} не найден, создаем нового администратора`);
            const adminUser = await createAdminUserFromTelegram(telegramId, adminName);
            console.log(`Создание нового администратора: ${adminUser ? 'Успешно' : 'Ошибка'}`);
            return !!adminUser;
        }
    } catch (error) {
        console.error('Ошибка при назначении администратора:', error);
        console.error('Ошибка при назначении администратора:', error);
        return false;
    }
}

// Функция отложенного добавления администратора - вызывается когда WebApp готов
export const setupAdmin = () => {
    setTimeout(() => {
        const targetTelegramId = '5394381166';

        console.log(`Отложенное назначение администратора для ID: ${targetTelegramId}`);

        // Проверяем, является ли пользователь уже администратором
        const admins = getAdmins();
        console.log('Список администраторов перед добавлением:', admins);

        // Добавляем в список администраторов
        addAdmin(targetTelegramId);
        console.log(`Пользователь с ID ${targetTelegramId} добавлен в список администраторов`);
        console.log('Список администраторов после добавления:', getAdmins());

        // Проверяем текущего пользователя
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.telegramData?.telegramId === targetTelegramId) {
            console.log('Найден текущий пользователь с нужным Telegram ID, устанавливаем права администратора');
            currentUser.isAdmin = true;
            saveUser(currentUser);
            console.log('Текущий пользователь обновлен, права администратора выданы');
        } else {
            console.log('Текущего пользователя нет или у него другой Telegram ID');
            // Пытаемся создать или обновить пользователя
            makeAdmin(targetTelegramId, 'Администратор').catch(error => 
                console.error('Ошибка при назначении администратора:', error)
            );
        }
    }, 1000); // Небольшая задержка для уверенности, что приложение готово
}; // Close setupAdmin function

// Экспортируем функцию для ручного использования
export const addTelegramAdmin = (telegramId: string): boolean => {
    try {
        addAdmin(telegramId);

        // Проверяем текущего пользователя
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.telegramData?.telegramId === telegramId) {
            currentUser.isAdmin = true;
            saveUser(currentUser);
        }

        return true;
    } catch (error) {
        console.error('Ошибка при добавлении администратора:', error);
        return false;
    }
};