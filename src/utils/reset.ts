// filepath: c:\Users\user\Desktop\Project\telegram-anonymous-chat\src\utils\reset.ts
import { db, telegramApi, validateLocalStorage } from './database';
import { addAdmin } from './user';
import WebApp from '@twa-dev/sdk';

/**
 * Функция для полной очистки базы данных и подготовки приложения для чистого запуска
 * @param preserveAdmins Сохранить список администраторов
 */
export const resetApplication = async (preserveAdmins: boolean = true): Promise<boolean> => {
    try {
        console.log('Начинаем полную очистку данных приложения...');

        // Сохраняем список администраторов, если нужно
        let adminsList: string[] = [];
        if (preserveAdmins) {
            try {
                const adminsData = localStorage.getItem('admin_users');
                adminsList = adminsData ? JSON.parse(adminsData) : [];
                console.log('Сохранен список администраторов:', adminsList);
            } catch (e) {
                console.error('Ошибка при сохранении списка администраторов:', e);
            }
        }

        // Особый администратор, который должен сохраниться в любом случае
        const targetAdminId = '5394381166';
        if (!adminsList.includes(targetAdminId)) {
            adminsList.push(targetAdminId);
        }

        // Очищаем все данные
        await db.clearAllData();
        console.log('База данных очищена');

        // Восстанавливаем базовую структуру
        validateLocalStorage();
        console.log('Базовая структура данных восстановлена');

        // Возвращаем администраторов, если нужно
        if (preserveAdmins && adminsList.length > 0) {
            localStorage.setItem('admin_users', JSON.stringify(adminsList));
            console.log('Список администраторов восстановлен');

            // Для уверенности добавляем главного администратора
            addAdmin(targetAdminId);
        }

        // Отображаем уведомление об успехе
        if (WebApp && WebApp.isExpanded) {
            WebApp.showPopup({
                title: 'Очистка завершена',
                message: 'База данных полностью очищена. Приложение готово к работе.',
                buttons: [{ type: 'ok' }]
            });
        }

        return true;
    } catch (error) {
        console.error('Ошибка при очистке базы данных:', error);

        // Отображаем уведомление об ошибке
        if (WebApp && WebApp.isExpanded) {
            WebApp.showPopup({
                title: 'Ошибка',
                message: 'Не удалось очистить базу данных. Попробуйте еще раз.',
                buttons: [{ type: 'ok' }]
            });
        }

        return false;
    }
};

/**
 * Функция для очистки всех данных чата и поиска
 */
export const resetChatData = async (): Promise<boolean> => {
    try {
        console.log('Очистка данных чатов и поиска...');

        // Очищаем данные поиска
        localStorage.setItem('searching_users', JSON.stringify([]));

        // Находим все ключи чатов
        const chatKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (
                key.startsWith('chat_') ||
                key.startsWith('active_chat_') ||
                key.startsWith('new_chat_') ||
                key.startsWith('message_')
            )) {
                chatKeys.push(key);
            }
        }

        // Удаляем все ключи чатов
        chatKeys.forEach(key => {
            localStorage.removeItem(key);
        });

        // Сбрасываем список чатов
        localStorage.setItem('chats', JSON.stringify([]));

        console.log(`Очищено ${chatKeys.length} записей, связанных с чатами`);

        return true;
    } catch (error) {
        console.error('Ошибка при очистке данных чата:', error);
        return false;
    }
};