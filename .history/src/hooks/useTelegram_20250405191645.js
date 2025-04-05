import { useCallback, useEffect, useState } from 'react';

// Получение объекта WebApp из window
const getTelegramWebApp = () => {
    if (window.Telegram && window.Telegram.WebApp) {
        return window.Telegram.WebApp;
    }

    // Если WebApp недоступен, возвращаем заглушку для тестирования
    return {
        ready: () => { },
        expand: () => { },
        close: () => { },
        MainButton: {
            text: '',
            isVisible: false,
            onClick: () => { },
            show: () => { },
            hide: () => { },
            enable: () => { },
            disable: () => { }
        }
    };
};

export function useTelegram() {
    const [WebApp, setWebApp] = useState(getTelegramWebApp());

    // Инициализация Telegram WebApp
    useEffect(() => {
        const app = getTelegramWebApp();
        setWebApp(app);

        // Уведомляем Telegram WebApp, что приложение готово
        if (app.ready) {
            app.ready();
        }
    }, []);

    // Функция для хаптической обратной связи
    const hapticFeedback = useCallback((type, style, notificationType) => {
        try {
            if (!WebApp.HapticFeedback) return;

            switch (type) {
                case 'impact':
                    if (WebApp.HapticFeedback.impactOccurred) {
                        WebApp.HapticFeedback.impactOccurred(style || 'medium');
                    }
                    break;
                case 'notification':
                    if (WebApp.HapticFeedback.notificationOccurred) {
                        WebApp.HapticFeedback.notificationOccurred(notificationType || 'success');
                    }
                    break;
                case 'selection':
                    if (WebApp.HapticFeedback.selectionChanged) {
                        WebApp.HapticFeedback.selectionChanged();
                    }
                    break;
                default:
                    console.warn('Unknown haptic feedback type:', type);
            }
        } catch (error) {
            console.warn('Haptic feedback failed:', error);
        }
    }, [WebApp]);

    // Функция для показа всплывающего окна
    const showPopup = useCallback(async (params) => {
        try {
            if (WebApp.showPopup) {
                return await WebApp.showPopup(params);
            } else {
                // Запасной вариант - обычное окно alert
                alert(params.message || '');
                return null;
            }
        } catch (error) {
            console.warn('Show popup failed:', error);
            // Запасной вариант - обычное окно alert
            alert(params.message || '');
            return null;
        }
    }, [WebApp]);

    return {
        WebApp,
        hapticFeedback,
        showPopup
    };
}
