import { resetApplication } from './reset';
import WebApp from '@twa-dev/sdk';

/**
 * Функция для перехода в production режим с очисткой тестовых данных
 * при сохранении важных настроек, таких как права администратора
 */
export const prepareForProduction = async () => {
    try {
        console.log('Подготовка приложения к production режиму...');

        // Очищаем базу данных, но сохраняем список администраторов
        const result = await resetApplication(true);

        if (result) {
            console.log('Приложение успешно подготовлено к production режиму!');

            // Показываем уведомление, если приложение запущено в Telegram
            if (WebApp.isExpanded) {
                WebApp.showPopup({
                    title: 'Готово к работе',
                    message: 'Приложение очищено и готово к production использованию. Теперь все Telegram ID пользователей будут уникальными.',
                    buttons: [{ type: 'ok' }]
                });
            }

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
