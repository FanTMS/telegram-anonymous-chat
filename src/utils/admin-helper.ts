// filepath: c:\Users\user\Desktop\Project\telegram-anonymous-chat\src\utils\admin-helper.ts
import {
    addAdmin,
    getUserByTelegramId,
    getAdmins,
    createAdminUserFromTelegram,
    setAdminByTelegramId
} from './user';
import WebApp from '@twa-dev/sdk';

/**
 * Специальная функция для добавления администратора по Telegram ID
 * @param telegramId ID пользователя в Telegram
 * @param adminName Имя администратора (опционально)
 * @returns 
 */
export const makeAdmin = (telegramId: string, adminName: string = 'Администратор'): boolean => {
    try {
        console.log(`Начало процесса назначения администратора для Telegram ID: ${telegramId}`);

        // Проверяем, является ли пользователь уже администратором
        const admins = getAdmins();
        console.log('Текущие администраторы:', admins);

        if (admins.includes(telegramId)) {
            console.log(`Пользователь с ID ${telegramId} уже является администратором`);
            return true;
        }

        // Пытаемся найти пользователя с этим Telegram ID
        const existingUser = getUserByTelegramId(telegramId);

        if (existingUser) {
            console.log(`Найден пользователь с Telegram ID ${telegramId}: ${existingUser.name}`);
            // Устанавливаем права администратора
            const result = setAdminByTelegramId(telegramId);
            console.log(`Установка прав администратора: ${result ? 'Успешно' : 'Ошибка'}`);
            return result;
        } else {
            // Создаем нового пользователя-администратора
            console.log(`Пользователь с Telegram ID ${telegramId} не найден, создаем нового администратора`);
            const adminUser = createAdminUserFromTelegram(telegramId, adminName);
            console.log(`Создание нового администратора: ${adminUser ? 'Успешно' : 'Ошибка'}`);
            return !!adminUser;
        }
    } catch (error) {
        console.error('Ошибка при назначении администратора:', error);
        return false;
    }
};

// Добавляем пользователя с ID 5394381166 как администратора при загрузке модуля
(() => {
    const targetTelegramId = '5394381166';

    console.log(`Автоматическое назначение администратора для ID: ${targetTelegramId}`);

    // Проверяем, является ли пользователь уже администратором
    const admins = getAdmins();
    if (admins.includes(targetTelegramId)) {
        console.log(`Пользователь с ID ${targetTelegramId} уже является администратором`);
        return;
    }

    // Добавляем в список администраторов
    addAdmin(targetTelegramId);
    console.log(`Пользователь с ID ${targetTelegramId} добавлен в список администраторов`);

    // Пытаемся создать или обновить пользователя
    makeAdmin(targetTelegramId, 'Администратор');

    // Уведомляем об успешном выполнении
    if (WebApp && WebApp.isExpanded) {
        WebApp.showPopup({
            title: 'Права администратора',
            message: `Пользователю с Telegram ID ${targetTelegramId} выданы права администратора`,
            buttons: [{ type: 'ok' }]
        });
    }
})();

// Экспортируем функцию для ручного использования
export const addTelegramAdmin = (telegramId: string): boolean => {
    try {
        addAdmin(telegramId);
        return true;
    } catch (error) {
        console.error('Ошибка при добавлении администратора:', error);
        return false;
    }
};