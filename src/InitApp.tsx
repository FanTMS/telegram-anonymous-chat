import React, { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { userStorage } from './utils/userStorage';
import { safeViewport } from './utils/safe-viewport';
import { telegramApi } from './utils/database';
import { loadOptimizer } from './utils/loadOptimizer';
import { AppWrapper } from './AppWrapper';

/**
 * Компонент инициализации приложения
 * Отвечает за безопасную и корректную инициализацию приложения в Telegram Mini-App
 */
const InitApp: React.FC = () => {
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Создаем таймаут для принудительного продолжения загрузки
        const timeoutId = setTimeout(() => {
            if (!isReady) {
                console.warn('Превышен лимит ожидания инициализации приложения, принудительное продолжение');
                setIsReady(true);
            }
        }, 5000); // 5 секунд максимум на инициализацию

        // Функция инициализации приложения с разбивкой по микрозадачам
        const initializeApp = async () => {
            try {
                // Шаг 1: Проверяем окружение и подготавливаем базовые параметры
                await loadOptimizer.delayExecution(() => {
                    console.log('Шаг 1: Инициализация базовых параметров');
                    safeViewport.setupViewport();
                });

                // Шаг 2: Инициализируем хранилище пользователя
                await loadOptimizer.delayExecution(() => {
                    console.log('Шаг 2: Инициализация хранилища пользователя');

                    // Проверяем наличие данных Telegram WebApp
                    if (typeof WebApp !== 'undefined' && WebApp.initDataUnsafe && WebApp.initDataUnsafe.user) {
                        const userId = WebApp.initDataUnsafe.user.id;
                        if (userId) {
                            console.log(`Инициализация хранилища для Telegram пользователя ${userId}`);
                            userStorage.initialize(userId);
                        }
                    } else {
                        // Для режима разработки или в случае ошибки
                        const devUserId = localStorage.getItem('dev_user_id') || `dev_${Date.now()}`;
                        localStorage.setItem('dev_user_id', devUserId);
                        console.log(`Инициализация хранилища для разработки с ID ${devUserId}`);
                        userStorage.initialize(devUserId);
                    }
                });

                // Шаг 3: Настройка Telegram WebApp
                await loadOptimizer.delayExecution(() => {
                    console.log('Шаг 3: Настройка WebApp');

                    try {
                        if (typeof WebApp !== 'undefined') {
                            // Уведомляем Telegram что приложение готово
                            WebApp.ready();
                            console.log('WebApp.ready() выполнен успешно');
                        }
                    } catch (e) {
                        console.warn('Ошибка при настройке WebApp:', e);
                    }
                });

                // Шаг 4: Инициализация сервисов
                await loadOptimizer.delayExecution(() => {
                    console.log('Шаг 4: Инициализация сервисов');
                    telegramApi.initialize();
                });

                // Шаг 5: Завершение инициализации
                console.log('Инициализация завершена успешно');
                setIsReady(true);

            } catch (error) {
                console.error('Ошибка при инициализации приложения:', error);
                setError('Не удалось инициализировать приложение, попробуйте обновить страницу');
                // Даже при ошибке продолжаем загрузку
                setIsReady(true);
            }
        };

        // Запускаем процесс инициализации
        initializeApp();

        // Очистка при размонтировании
        return () => clearTimeout(timeoutId);
    }, []);

    // Отображаем экран загрузки
    if (!isReady) {
        return (
            <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-300">Загрузка приложения...</p>
                </div>
            </div>
        );
    }

    // Отображаем ошибку при наличии
    if (error) {
        return (
            <div className="flex items-center justify-center h-screen p-4 bg-white dark:bg-gray-900">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-red-500 dark:text-red-400 text-2xl">⚠️</span>
                    </div>
                    <h1 className="text-xl font-bold mb-2 text-red-600 dark:text-red-400">Ошибка</h1>
                    <p className="mb-6 text-gray-700 dark:text-gray-300">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
                    >
                        Перезагрузить приложение
                    </button>
                </div>
            </div>
        );
    }

    // Запускаем приложение
    return <AppWrapper />;
};

export default InitApp;
