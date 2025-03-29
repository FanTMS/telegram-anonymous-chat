// filepath: c:\Users\user\Desktop\Project\telegram-anonymous-chat\src\utils\app-status.ts
import WebApp from '@twa-dev/sdk';
import { getCurrentUser, getAdmins, isAdmin } from './user';
import { telegramApi } from './database';

/**
 * Функция для проверки статуса приложения и отображения информации
 * о текущем пользователе, состоянии Telegram WebApp и административных правах
 */
export const checkAppStatus = () => {
    try {
        console.group('=== TELEGRAM APP STATUS ===');
        console.log('WebApp версия:', WebApp.version || 'Не определена');
        console.log('WebApp инициализирован:', WebApp.initData && WebApp.initData.length > 0 ? 'Да' : 'Нет');
        console.log('Режим запуска:', window.location.hostname.includes('localhost') ||
            window.location.hostname === '127.0.0.1' ? 'Локальная разработка' : 'Рабочее окружение');
        console.log('Цветовая схема:', WebApp.colorScheme || 'Не определена');
        console.groupEnd();

        // Информация о пользователе
        console.group('=== ПОЛЬЗОВАТЕЛЬ ===');
        const currentUser = getCurrentUser();
        console.log('Текущий пользователь:', currentUser ? 'Найден' : 'Не найден');

        if (currentUser) {
            console.log('ID:', currentUser.id);
            console.log('Имя:', currentUser.name);
            console.log('Администратор (флаг isAdmin):', currentUser.isAdmin ? 'Да' : 'Нет');

            if (currentUser.telegramData) {
                console.log('Telegram ID:', currentUser.telegramData.telegramId);
                console.log('Username:', currentUser.telegramData.username);
            } else {
                console.log('Telegram данные: Отсутствуют');
            }
        }
        console.groupEnd();

        // Проверка административных прав
        console.group('=== ПРАВА АДМИНИСТРАТОРА ===');
        console.log('Список администраторов:', getAdmins());

        const adminStatus = isAdmin();
        console.log('Текущий пользователь администратор:', adminStatus ? 'Да' : 'Нет');

        const telegramID = telegramApi.getUserId();
        console.log('Текущий Telegram ID:', telegramID);
        console.groupEnd();

        return {
            isWebApp: WebApp.initData && WebApp.initData.length > 0,
            user: currentUser,
            isAdmin: adminStatus,
            telegramId: telegramID
        };
    } catch (error) {
        console.error('Ошибка при проверке статуса приложения:', error);
        return null;
    }
};

/**
 * Утилита для проверки корректности работы функции поиска собеседников
 */
export const checkMatchmakingStatus = () => {
    try {
        console.group('=== СТАТУС ПОИСКА СОБЕСЕДНИКОВ ===');

        // Получаем статус поиска из localStorage
        const searchingUsers = localStorage.getItem('searching_users');
        const searchingUsersData = searchingUsers ? JSON.parse(searchingUsers) : [];
        console.log('Пользователи в поиске:', searchingUsersData);

        // Получаем активные чаты
        let activeChats = 0;
        let activeChatsData = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('active_chat_')) {
                activeChats++;
                try {
                    const chatId = localStorage.getItem(key);
                    if (chatId) {
                        const chatData = localStorage.getItem(`chat_${chatId}`);
                        if (chatData) {
                            activeChatsData.push(JSON.parse(chatData));
                        }
                    }
                } catch (e) {
                    console.error('Ошибка при чтении данных чата:', e);
                }
            }
        }

        console.log('Активные чаты:', activeChats);
        console.log('Данные чатов:', activeChatsData);
        console.groupEnd();

        return {
            searchingUsers: searchingUsersData,
            activeChats: activeChatsData
        };
    } catch (error) {
        console.error('Ошибка при проверке статуса поиска:', error);
        return null;
    }
};

/**
 * Функция для запуска полной диагностики статуса приложения
 */
export const runDiagnostics = () => {
    console.log('=========================================');
    console.log('ЗАПУСК ПОЛНОЙ ДИАГНОСТИКИ ПРИЛОЖЕНИЯ');
    console.log('=========================================');

    const appStatus = checkAppStatus();
    const matchmakingStatus = checkMatchmakingStatus();

    console.log('Диагностика завершена.');

    return {
        appStatus,
        matchmakingStatus,
        timestamp: new Date().toISOString()
    };
};

// Добавляем функции в глобальный объект window для удобного доступа из консоли
if (typeof window !== 'undefined') {
    (window as any).checkAppStatus = checkAppStatus;
    (window as any).checkMatchmakingStatus = checkMatchmakingStatus;
    (window as any).runDiagnostics = runDiagnostics;
}