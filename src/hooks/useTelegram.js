import { useCallback, useEffect, useState } from 'react';

// Проверка наличия Telegram WebApp
const isTelegramWebAppAvailable = () => {
    return !!window.Telegram && !!window.Telegram.WebApp;
};

// Проверка на мобильное устройство Telegram
const isMobileTelegram = () => {
    return /Telegram/i.test(navigator.userAgent) || 
           document.referrer.includes('t.me') || 
           window.location.href.includes('tg://');
};

// Получение объекта WebApp из window
const getTelegramWebApp = () => {
    if (isTelegramWebAppAvailable()) {
        return window.Telegram.WebApp;
    }

    // Если WebApp недоступен, проверяем запущены ли мы в Telegram на мобильном
    if (isMobileTelegram()) {
        console.log('Мобильное приложение Telegram обнаружено, но WebApp не инициализирован');
        // Возвращаем заглушку для мобильных с ограниченной функциональностью
        return {
            ready: () => { },
            expand: () => { },
            close: () => { },
            isExpanded: true,
            MainButton: {
                text: '',
                isVisible: false,
                onClick: () => { },
                show: () => { },
                hide: () => { },
                enable: () => { },
                disable: () => { }
            },
            isMobile: true
        };
    }

    // Заглушка для тестирования
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
    const [isMobile, setIsMobile] = useState(isMobileTelegram());

    // Инициализация Telegram WebApp
    useEffect(() => {
        const app = getTelegramWebApp();
        setWebApp(app);
        setIsMobile(isMobileTelegram());

        // Уведомляем Telegram WebApp, что приложение готово
        if (app.ready) {
            app.ready();
        }
        
        // Расширяем приложение на полный экран
        if (app.expand && !app.isExpanded) {
            app.expand();
        }
    }, []);

    // Функция для хаптической обратной связи
    const hapticFeedback = useCallback((type, style, notificationType) => {
        try {
            if (!WebApp.HapticFeedback) {
                console.log('HapticFeedback не поддерживается на этом устройстве');
                return;
            }

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
        showPopup,
        isMobile
    };
}

// Добавляем экспорт по умолчанию
export default useTelegram;
