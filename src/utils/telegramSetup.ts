import WebApp from '@twa-dev/sdk';
import { createWebAppMock, isRunningInTelegram } from './telegramMock';

/**
 * Инициализирует Telegram WebApp
 * @returns {boolean} Успешность инициализации
 */
export const initializeTelegramWebApp = (): boolean => {
    try {
        console.log('🔄 Инициализация Telegram WebApp...');

        // Создаем мок если не запущено в Telegram
        if (!isRunningInTelegram()) {
            console.log('⚠️ Не запущено в Telegram, создаем мок');
            createWebAppMock();
        } else {
            console.log('✅ Приложение запущено в Telegram, используем реальное API');
        }

        // Вызываем WebApp.ready() для сигнализации о готовности приложения
        try {
            if (typeof WebApp !== 'undefined' && typeof WebApp.ready === 'function') {
                console.log('📢 Вызываем WebApp.ready()');
                WebApp.ready();
                console.log('✅ WebApp.ready() успешно вызван');
            } else {
                console.warn('⚠️ WebApp.ready() недоступен');
            }
        } catch (e) {
            console.error('❌ Ошибка при вызове WebApp.ready():', e);
        }

        return true;
    } catch (error) {
        console.error('❌ Ошибка при инициализации Telegram WebApp:', error);
        return false;
    }
};

/**
 * Показать всплывающее сообщение в Telegram
 * @param title - Заголовок сообщения
 * @param message - Текст сообщения
 */
export const showTelegramPopup = (title: string, message: string): void => {
    try {
        if (typeof WebApp !== 'undefined' && typeof WebApp.showPopup === 'function') {
            WebApp.showPopup({
                title,
                message,
                buttons: [{ type: 'ok' }]
            });
        } else {
            // Запасной вариант для случаев, когда WebApp недоступен
            alert(`${title}\n${message}`);
        }
    } catch (e) {
        console.error('❌ Ошибка при показе всплывающего окна:', e);
        alert(`${title}\n${message}`);
    }
};

export default {
    initializeTelegramWebApp,
    showTelegramPopup,
    isRunningInTelegram
};
