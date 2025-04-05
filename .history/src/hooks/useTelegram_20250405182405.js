import { useEffect, useState } from 'react';
import { isTelegramApp, getTelegramWebApp } from '../utils/telegramUtils';

/**
 * Хук для взаимодействия с Telegram WebApp
 * @returns {Object} Объект с информацией о Telegram WebApp
 */
export const useTelegram = () => {
    const [isTelegramAppLoaded, setIsTelegramAppLoaded] = useState(false);
    const [themeParams, setThemeParams] = useState(null);

    useEffect(() => {
        // Проверяем, запущено ли приложение в Telegram
        const isInTelegram = isTelegramApp();
        setIsTelegramAppLoaded(isInTelegram);

        // Получаем параметры темы, если приложение запущено в Telegram
        if (isInTelegram) {
            const webApp = getTelegramWebApp();
            if (webApp && webApp.themeParams) {
                setThemeParams(webApp.themeParams);
            }
        }
    }, []);

    return {
        isTelegramApp: isTelegramAppLoaded,
        WebApp: getTelegramWebApp(),
        themeParams: themeParams,
        // Добавляем удобный метод для определения темы
        isTelegramTheme: !!themeParams,
        // Метод для адаптации к теме Telegram
        adaptToTelegramTheme: () => {
            if (!isTelegramAppLoaded || !themeParams) return {};

            return {
                backgroundColor: themeParams.bg_color,
                color: themeParams.text_color,
                '--button-color': themeParams.button_color,
                '--button-text-color': themeParams.button_text_color,
            };
        }
    };
};

export default useTelegram;
