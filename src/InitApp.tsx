import React, { useState, useEffect } from 'react';
import App from './App';
import WebApp from '@twa-dev/sdk';
import { initializeTelegramWebApp } from './utils/telegramSetup';

// Глобальный флаг для отслеживания вызова ready()
let readyCalled = false;

const InitApp: React.FC = () => {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Максимально короткий таймаут безопасности
        const timeoutId = setTimeout(() => {
            if (!isReady) {
                console.warn('🚨 Таймаут инициализации, принудительно запускаем приложение');
                setIsReady(true);
            }
        }, 1500); // Уменьшаем до 1.5 секунд

        // Инициализация с немедленным показом приложения
        const initializeApp = async () => {
            try {
                // Вызываем ready() только если еще не вызывали
                if (!readyCalled && typeof WebApp !== 'undefined') {
                    try {
                        console.log('📣 Вызываем WebApp.ready() из InitApp');
                        WebApp.ready();
                        readyCalled = true;
                        console.log('✅ WebApp.ready() вызван успешно');
                    } catch (err) {
                        console.error('❌ Ошибка при вызове WebApp.ready():', err);
                    }
                }

                // Инициализируем через наш вспомогательный модуль
                initializeTelegramWebApp();

                // Завершаем инициализацию немедленно
                setIsReady(true);
                clearTimeout(timeoutId);

            } catch (error) {
                console.error('❌ Ошибка:', error);
                setIsReady(true); // Продолжаем в любом случае
                clearTimeout(timeoutId);
            }
        };

        // Запускаем инициализацию
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
                </div>
            </div>
        );
    }

    // Рендерим основное приложение
    return <App />;
};

export default InitApp;
