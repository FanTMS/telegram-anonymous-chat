import WebApp from '@twa-dev/sdk';
import { debugUtils } from './debug';

/**
 * Проверяет, запущено ли приложение в Telegram WebApp
 */
export const isTelegramWebApp = (): boolean => {
    try {
        return typeof window !== 'undefined' &&
            !!window.Telegram?.WebApp &&
            !!window.Telegram.WebApp.initData &&
            window.Telegram.WebApp.initData.length > 0;
    } catch (e) {
        console.warn('Ошибка при проверке Telegram WebApp:', e);
        return false;
    }
};

/**
 * Инициализирует Telegram WebApp и настраивает приложение
 */
export const initializeTelegramWebApp = (): void => {
    try {
        if (!isTelegramWebApp()) {
            console.log('Приложение запущено вне Telegram WebApp, инициализация не требуется');
            return;
        }

        console.log('Инициализация Telegram WebApp...');

        // Сообщаем Telegram, что приложение готово
        WebApp.ready();
        console.log('WebApp.ready() вызван');

        // Настраиваем основные параметры
        WebApp.expand(); // Раскрываем приложение на весь экран

        // Устанавливаем тему
        document.documentElement.setAttribute('data-theme', WebApp.colorScheme);

        // Логируем информацию для отладки
        if (process.env.NODE_ENV === 'development') {
            debugUtils.logWebAppInfo();
        }

        // Добавляем слушатель событий для темы
        WebApp.onEvent('themeChanged', () => {
            document.documentElement.setAttribute('data-theme', WebApp.colorScheme);
            console.log('Тема изменена на:', WebApp.colorScheme);
        });

        // Настраиваем MainButton по умолчанию (если нужно)
        configureMainButton();

        console.log('Telegram WebApp успешно инициализирован');
    } catch (e) {
        console.error('Ошибка при инициализации Telegram WebApp:', e);
    }
};

/**
 * Настраивает основную кнопку Telegram WebApp
 */
const configureMainButton = (text?: string, color?: string, textColor?: string): void => {
    try {
        if (!WebApp.MainButton) return;

        if (text) WebApp.MainButton.setText(text);

        // Используем методы вместо прямого присваивания свойств
        if (color) WebApp.MainButton.setParams({ color });
        if (textColor) WebApp.MainButton.setParams({ text_color: textColor });

        // Скрываем кнопку по умолчанию (показать можно будет когда потребуется)
        WebApp.MainButton.hide();
    } catch (e) {
        console.warn('Ошибка при настройке MainButton:', e);
    }
};

/**
 * Показывает сообщение с помощью WebApp API
 */
export const showTelegramAlert = (message: string): Promise<void> => {
    return new Promise((resolve) => {
        if (isTelegramWebApp()) {
            WebApp.showAlert(message, () => resolve());
        } else {
            alert(message);
            resolve();
        }
    });
};

// Экспортируем Telegram WebApp для использования в других файлах
export { WebApp };
