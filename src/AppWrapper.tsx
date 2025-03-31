import React, { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { NotificationType } from './utils/notifications';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PreventReload } from './components/PreventReload';
import { initSafeViewport } from './utils/safe-viewport';
import { telegramApi } from './utils/database';
import { userStorage } from './utils/userStorage';
import WebApp from '@twa-dev/sdk';
import './utils/responsive.css';
import { NotificationProvider } from './components/NotificationProvider';

/**
 * Компонент-обертка для всего приложения
 * Включает все необходимые провайдеры и обработчики
 */
export const AppWrapper: React.FC = () => {
    const [isInitialized, setIsInitialized] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Инициализация приложения
    useEffect(() => {
        const initApp = async () => {
            try {
                // Инициализация безопасных областей
                initSafeViewport();

                // Инициализация Telegram API
                if (typeof WebApp !== 'undefined') {
                    // Обработка WebApp
                    try {
                        WebApp.ready();
                        console.log('WebApp.ready() успешно выполнен');

                        // Инициализация хранилища пользователя
                        if (WebApp.initDataUnsafe && WebApp.initDataUnsafe.user) {
                            const userId = WebApp.initDataUnsafe.user.id;
                            if (userId) {
                                const success = userStorage.initialize(userId);
                                console.log(`UserStorage инициализировано для пользователя ${userId}: ${success ? 'успешно' : 'с ошибкой'}`);
                            }
                        } else {
                            console.warn('Инициализация WebApp без данных пользователя');
                            // Для режима разработки
                            const devUserId = localStorage.getItem('dev_user_id') || `dev_${Date.now()}`;
                            localStorage.setItem('dev_user_id', devUserId);
                            userStorage.initialize(devUserId);
                        }
                    } catch (e) {
                        console.error('Ошибка при инициализации WebApp:', e);

                        // Резервный вариант - использовать dev_user_id
                        const devUserId = localStorage.getItem('dev_user_id') || `dev_${Date.now()}`;
                        localStorage.setItem('dev_user_id', devUserId);
                        userStorage.initialize(devUserId);
                    }
                } else {
                    // Режим разработки без WebApp
                    const devUserId = localStorage.getItem('dev_user_id') || `dev_${Date.now()}`;
                    localStorage.setItem('dev_user_id', devUserId);
                    userStorage.initialize(devUserId);
                    console.log('Инициализация в режиме разработки');
                }

                setIsInitialized(true);
            } catch (e) {
                console.error('Ошибка при инициализации приложения:', e);
                setError('Ошибка инициализации. Пожалуйста, перезагрузите приложение.');
                setIsInitialized(true); // Все равно устанавливаем как инициализированное, чтобы показать ошибку
            }
        };

        initApp();
    }, []);

    // Отображаем загрузку, пока приложение инициализируется
    if (!isInitialized) {
        return (
            <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-solid rounded-full animate-spin border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-300">Загрузка приложения...</p>
                </div>
            </div>
        );
    }

    // Отображаем ошибку, если она есть
    if (error) {
        return (
            <div className="flex items-center justify-center h-screen bg-white dark:bg-gray-900 p-4">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full mx-auto flex items-center justify-center mb-4">
                        <span className="text-red-600 dark:text-red-300 text-2xl">⚠️</span>
                    </div>
                    <h1 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">Ошибка инициализации</h1>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                    >
                        Перезагрузить
                    </button>
                </div>
            </div>
        );
    }

    // Основное приложение с провайдерами
    return (
        <ErrorBoundary>
            <NotificationProvider>
                <PreventReload />
                <RouterProvider router={router} />
            </NotificationProvider>
        </ErrorBoundary>
    );
};

export default AppWrapper;
