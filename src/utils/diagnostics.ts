/**
 * Утилита для выполнения диагностики и отладки приложения
 */

// Функция для проверки окружения
export function checkEnvironment(): { [key: string]: any } {
    const env = {
        isProduction: process.env.NODE_ENV === 'production',
        isDevelopment: process.env.NODE_ENV === 'development',
        windowSize: {
            width: window.innerWidth,
            height: window.innerHeight
        },
        userAgent: navigator.userAgent,
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        isInFrame: window !== window.parent,
        isTelegramWebViewAgent: /TelegramWebApp/i.test(navigator.userAgent),
        hasLocalStorage: (() => {
            try {
                localStorage.setItem('test', 'test');
                localStorage.removeItem('test');
                return true;
            } catch (e) {
                return false;
            }
        })(),
        telegramWebApp: {
            available: typeof window.Telegram !== 'undefined' && typeof window.Telegram.WebApp !== 'undefined',
            hasInitData: typeof window.Telegram?.WebApp?.initData !== 'undefined' && window.Telegram.WebApp.initData.length > 0,
            colorScheme: window.Telegram?.WebApp?.colorScheme,
            isExpanded: window.Telegram?.WebApp?.isExpanded
        },
        documentReady: document.readyState,
        timestamp: new Date().toISOString()
    };

    return env;
}

// Функция для записи диагностической информации в консоль
export function logDiagnostics() {
    const env = checkEnvironment();
    console.group('📊 Диагностика приложения');
    console.log('Окружение:', env);
    console.log('DOM готов:', document.readyState);
    console.log('Root элемент:', document.getElementById('root'));

    // Проверяем стили
    try {
        const rootStyles = window.getComputedStyle(document.documentElement);
        const bodyStyles = window.getComputedStyle(document.body);
        console.log('Root стили:', {
            backgroundColor: rootStyles.backgroundColor,
            color: rootStyles.color,
            width: rootStyles.width,
            height: rootStyles.height
        });
        console.log('Body стили:', {
            backgroundColor: bodyStyles.backgroundColor,
            color: bodyStyles.color,
            width: bodyStyles.width,
            height: bodyStyles.height,
            margin: bodyStyles.margin,
            padding: bodyStyles.padding
        });
    } catch (e) {
        console.error('Ошибка при получении стилей:', e);
    }

    console.groupEnd();

    return env;
}

// Автоматически запускаем диагностику
if (process.env.NODE_ENV === 'development') {
    window.addEventListener('DOMContentLoaded', () => {
        logDiagnostics();
    });

    // Также запустим через небольшую задержку после загрузки
    window.addEventListener('load', () => {
        setTimeout(logDiagnostics, 1000);
    });
}

// Экспортируем для ручного вызова
export default { checkEnvironment, logDiagnostics };
