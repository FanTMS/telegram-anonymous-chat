// filepath: c:\Users\user\Desktop\Project\telegram-anonymous-chat\src\utils\reset.ts
import { db, telegramApi, validateLocalStorage } from './database';
import { addAdmin } from './user';
import WebApp from '@twa-dev/sdk';

/**
 * Функция для полной очистки базы данных и подготовки приложения для чистого запуска
 * @param preserveAdmins Сохранить список администраторов
 * @param adminsTelegram Объект с Telegram ID администраторов для сохранения
 */
export const resetApplication = async (preserveAdmins: boolean = true, adminsTelegram: Record<string, boolean> = {}): Promise<boolean> => {
    try {
        console.log('Начинаем полную очистку данных приложения...');

        // Сохраняем список администраторов, если нужно
        let adminsList: string[] = [];
        let adminsTelegramIds: string[] = [];

        if (preserveAdmins) {
            try {
                // Получаем стандартных админов из локального хранилища
                const adminsData = localStorage.getItem('admin_users');
                adminsList = adminsData ? JSON.parse(adminsData) : [];
                console.log('Сохранен список администраторов по ID:', adminsList);

                // Сохраняем Telegram ID администраторов
                const tempAdminTelegramId = localStorage.getItem('temp_current_admin');
                if (tempAdminTelegramId) {
                    adminsTelegramIds.push(tempAdminTelegramId);
                    console.log('Сохраняем администратора из временного хранилища:', tempAdminTelegramId);
                }

                // Добавляем переданные в функцию Telegram ID админов
                if (adminsTelegram) {
                    Object.keys(adminsTelegram).forEach(telegramId => {
                        if (telegramId && !adminsTelegramIds.includes(telegramId)) {
                            adminsTelegramIds.push(telegramId);
                            console.log('Добавлен Telegram ID администратора:', telegramId);
                        }
                    });
                }

                // Проверяем сохраненный список Telegram ID администраторов
                const savedAdminIds = localStorage.getItem('admin_telegram_ids');
                if (savedAdminIds) {
                    try {
                        const savedIds = JSON.parse(savedAdminIds);
                        if (Array.isArray(savedIds)) {
                            savedIds.forEach(id => {
                                if (id && !adminsTelegramIds.includes(id)) {
                                    adminsTelegramIds.push(id);
                                    console.log('Добавлен сохраненный Telegram ID администратора:', id);
                                }
                            });
                        }
                    } catch (e) {
                        console.error('Ошибка при обработке сохраненных ID администраторов:', e);
                    }
                }

                console.log('Сохранен список администраторов по Telegram ID:', adminsTelegramIds);
            } catch (e) {
                console.error('Ошибка при сохранении списка администраторов:', e);
            }
        }

        // Особый администратор, который должен сохраниться в любом случае
        const targetAdminId = '5394381166';
        if (!adminsList.includes(targetAdminId)) {
            adminsList.push(targetAdminId);
        }
        // Добавляем также Telegram ID этого администратора
        if (!adminsTelegramIds.includes(targetAdminId)) {
            adminsTelegramIds.push(targetAdminId);
        }

        // Очищаем все данные
        await db.clearAllData();
        console.log('База данных очищена');

        // Восстанавливаем базовую структуру
        validateLocalStorage();
        console.log('Базовая структура данных восстановлена');

        // Сохраняем Telegram ID администраторов для последующего использования
        if (adminsTelegramIds.length > 0) {
            localStorage.setItem('admin_telegram_ids', JSON.stringify(adminsTelegramIds));
            console.log('Сохранены Telegram ID администраторов:', adminsTelegramIds);
        }

        // Возвращаем администраторов, если нужно
        if (preserveAdmins && adminsList.length > 0) {
            localStorage.setItem('admin_users', JSON.stringify(adminsList));
            console.log('Список администраторов по ID восстановлен');

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