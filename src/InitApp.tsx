import React, { useState, useEffect } from 'react';
import App from './App';
import WebApp from '@twa-dev/sdk';

const InitApp: React.FC = () => {
    const [initialized, setInitialized] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Таймер для случая, если инициализация зависнет
        const timeoutId = setTimeout(() => {
            if (!initialized) {
                console.warn('Таймаут инициализации, принудительно продолжаем работу');
                setInitialized(true);
            }
        }, 2000); // 2 секунды максимальное время ожидания

        const initializeApp = async () => {
            try {
                console.log('Инициализация приложения...');

                // Проверка, запущены ли мы в Telegram
                const isTelegramWebApp = typeof window.Telegram !== 'undefined' &&
                    typeof window.Telegram.WebApp !== 'undefined';

                console.log(`Запущено в Telegram WebApp: ${isTelegramWebApp}`);

                // Сигнализируем Telegram о готовности приложения
                if (isTelegramWebApp) {
                    try {
                        console.log('Вызов WebApp.ready()...');
                        WebApp.ready();
                        console.log('WebApp.ready() вызван успешно');
                    } catch (e) {
                        console.error('Ошибка при вызове WebApp.ready():', e);
                    }
                }

                // Небольшая задержка чтобы убедиться, что все инициализировано
                setTimeout(() => {
                    setInitialized(true);
                    clearTimeout(timeoutId); // Очищаем таймер безопасности
                }, 100);
            } catch (error) {
                console.error('Ошибка при инициализации приложения:', error);
                setError('Ошибка инициализации');
                setInitialized(true);
                clearTimeout(timeoutId); // Очищаем таймер безопасности
            }
        };

        initializeApp();

        // Очистка при размонтировании
        return () => clearTimeout(timeoutId);
    }, []);

    if (!initialized) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-lg">Загрузка приложения...</p>
                </div>
            </div>
        );
    }

    // Рендер основного приложения
    return <App />;
};

export default InitApp;
