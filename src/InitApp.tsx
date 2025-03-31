import React, { useState, useEffect } from 'react';
import App from './App';
import WebApp from '@twa-dev/sdk';
import { createWebAppMock } from './utils/telegramMock';

const InitApp: React.FC = () => {
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Устанавливаем таймер безопасности на случай зависания инициализации
        const timeoutId = setTimeout(() => {
            if (!isReady) {
                console.warn('🚨 Инициализация не завершилась вовремя, принудительно продолжаем');
                setIsReady(true);
            }
        }, 3000); // 3 секунды максимальное время ожидания

        const initializeApp = async () => {
            try {
                console.log('🚀 Начало инициализации приложения...');

                // Проверяем доступность Telegram API
                const isTelegramAvailable = typeof window !== 'undefined' &&
                    typeof window.Telegram !== 'undefined' &&
                    typeof window.Telegram.WebApp !== 'undefined';

                console.log(`📱 Telegram WebApp ${isTelegramAvailable ? 'доступен' : 'недоступен'}`);

                // Если не доступен, пытаемся создать мок еще раз
                if (!isTelegramAvailable) {
                    console.log('⚠️ Telegram WebApp недоступен, создаем мок');
                    createWebAppMock();
                }

                // Вызываем ready() с небольшой задержкой для стабильности
                setTimeout(() => {
                    try {
                        if (typeof WebApp !== 'undefined') {
                            console.log('📣 Вызываем WebApp.ready()');
                            WebApp.ready();
                            console.log('✅ WebApp.ready() вызван успешно');
                        } else {
                            console.warn('⚠️ WebApp не определен, не вызываем ready()');
                        }
                    } catch (err) {
                        console.error('❌ Ошибка при вызове WebApp.ready():', err);
                    }

                    // Завершаем инициализацию в любом случае
                    console.log('✅ Инициализация успешно завершена');
                    setIsReady(true);
                    clearTimeout(timeoutId);
                }, 300); // Небольшая задержка для стабильности
            } catch (error) {
                console.error('❌ Критическая ошибка при инициализации:', error);
                setError('Не удалось инициализировать приложение');
                setIsReady(true); // Продолжаем в любом случае
                clearTimeout(timeoutId);
            }
        };

        initializeApp();

        // Очищаем таймер при размонтировании
        return () => clearTimeout(timeoutId);
    }, []);

    // Экран загрузки
    if (!isReady) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">Загрузка приложения...</p>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Пожалуйста, подождите</p>
                </div>
            </div>
        );
    }

    // Если есть ошибка, показываем уведомление, но все равно рендерим приложение
    if (error) {
        console.warn(`⚠️ Ошибка инициализации: ${error}, но продолжаем работу`);
    }

    // Рендерим основное приложение
    return <App />;
};

export default InitApp;
