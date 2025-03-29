import { resetApplication } from './reset';
import WebApp from '@twa-dev/sdk';
import { getCurrentUser, isAdmin } from './user';
import { telegramApi } from './database';

/**
 * Функция для перехода в production режим с очисткой тестовых данных
 * при сохранении важных настроек, таких как права администратора
 */
export const prepareForProduction = async () => {
    try {
        console.log('Подготовка приложения к production режиму...');

        // Сохраняем текущего пользователя и его Telegram ID если он администратор
        const currentUser = getCurrentUser();
        const currentTelegramId = telegramApi.getUserId();

        // Обязательно проверяем, является ли пользователь администратором
        const isCurrentAdmin = currentUser?.isAdmin || isAdmin();

        console.log('Текущий пользователь перед очисткой:',
            currentUser ? `${currentUser.name} (ID: ${currentUser.id})` : 'Не найден',
            'Telegram ID:', currentTelegramId,
            'Админ:', isCurrentAdmin);

        // Получаем текущее хранилище администраторов перед очисткой
        const adminsTelegram = {};

        // Сохраняем ID текущего администратора
        if (currentTelegramId && isCurrentAdmin) {
            adminsTelegram[currentTelegramId] = true;
            console.log(`Сохраняем текущего администратора с Telegram ID: ${currentTelegramId}`);

            // Гарантируем сохранение в localStorage для последующего использования
            localStorage.setItem('temp_current_admin', currentTelegramId);

            // Добавляем в список Telegram ID администраторов, если такой список уже есть
            try {
                const existingAdminTelegramIds = localStorage.getItem('admin_telegram_ids');
                const adminIds = existingAdminTelegramIds ? JSON.parse(existingAdminTelegramIds) : [];

                if (!adminIds.includes(currentTelegramId)) {
                    adminIds.push(currentTelegramId);
                    localStorage.setItem('admin_telegram_ids', JSON.stringify(adminIds));
                    console.log(`Добавлен ID ${currentTelegramId} в список admin_telegram_ids`);
                }
            } catch (e) {
                console.error('Ошибка при сохранении admin_telegram_ids:', e);
            }
        }

        // Сохраняем целевого администратора
        const targetAdminId = '5394381166';
        adminsTelegram[targetAdminId] = true;

        // Очищаем базу данных, но сохраняем список администраторов
        const result = await resetApplication(true, adminsTelegram);

        if (result) {
            console.log('Приложение успешно подготовлено к production режиму!');

            // Очищаем текущего пользователя для принудительной регистрации
            localStorage.removeItem('current_user_id');

            // Обновляем список пользователей (чистим кэш)
            localStorage.setItem('users', JSON.stringify([]));

            // Показываем уведомление, если приложение запущено в Telegram
            if (WebApp.isExpanded) {
                WebApp.showPopup({
                    title: 'Готово к работе',
                    message: 'Приложение очищено и готово к production использованию. Необходимо зарегистрироваться заново.',
                    buttons: [{ type: 'ok' }]
                });
            }

            // Перезагрузка страницы после очистки для сброса всех кэшей
            setTimeout(() => {
                window.location.reload();
            }, 1000);

            return true;
        } else {
            console.error('Произошла ошибка при подготовке приложения к production режиму');
            return false;
        }
    } catch (error) {
        console.error('Произошла ошибка при подготовке приложения:', error);
        return false;
    }
};

/**
 * Функция для полного удаления всех данных и выхода из приложения
 * Может использоваться для "выхода из аккаунта"
 */
export const clearAllAndExit = async () => {
    try {
        console.log('Полная очистка данных перед выходом...');

        // Полная очистка без сохранения администраторов
        await resetApplication(false);

        // Очищаем сессию Telegram
        localStorage.removeItem('telegram_user_id');
        localStorage.removeItem('telegram_user_data');
        localStorage.removeItem('current_user_id');

        console.log('Данные очищены, выход из приложения...');

        // Если в Telegram, закрываем WebApp
        if (WebApp.isExpanded) {
            // Показываем сообщение перед закрытием
            WebApp.showPopup({
                title: 'Выход выполнен',
                message: 'Все данные очищены. До свидания!',
                buttons: [
                    {
                        type: 'ok',
                        id: 'close'
                    }
                ]
            }, () => {
                // После закрытия сообщения закрываем WebApp
                setTimeout(() => WebApp.close(), 500);
            });
        } else {
            // Если не в Telegram, перезагружаем страницу
            window.location.reload();
        }

        return true;
    } catch (error) {
        console.error('Произошла ошибка при очистке и выходе:', error);
        return false;
    }
};
