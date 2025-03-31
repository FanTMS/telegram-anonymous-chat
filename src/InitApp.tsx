import React, { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { isTelegramWebApp } from './utils/telegramWebAppHelper';
import { secureStorage } from './utils/secureStorage';
import { debugUtils } from './utils/debug';
import WebApp from '@twa-dev/sdk';

const InitApp: React.FC = () => {
    const [initialized, setInitialized] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initializeApp = async () => {
            try {
                console.log('Инициализация приложения...');

                // Инициализируем хранилище данных пользователя
                if (isTelegramWebApp() && WebApp.initDataUnsafe?.user) {
                    // Используем Telegram User ID для инициализации хранилища
                    const telegramUserId = WebApp.initDataUnsafe.user.id;
                    secureStorage.initialize(telegramUserId);
                    console.log(`Хранилище инициализировано с ID пользователя Telegram: ${telegramUserId}`);
                } else {
                    // Для локальной разработки используем временный ID
                    const devUserId = localStorage.getItem('dev_user_id') || `dev_${Date.now()}`;
                    localStorage.setItem('dev_user_id', devUserId);
                    secureStorage.initialize(devUserId);
                    console.log(`Хранилище инициализировано с временным ID: ${devUserId}`);
                }

                // Запускаем отладочные утилиты при необходимости
                if (process.env.NODE_ENV === 'development') {
                    setTimeout(() => {
                        debugUtils.runFullDebug();
                    }, 1000);
                }

                // Завершаем инициализацию
                setInitialized(true);
            } catch (error) {
                console.error('Ошибка при инициализации приложения:', error);
                setError('Произошла ошибка при инициализации приложения');
                setInitialized(true); // Все равно показываем приложение
            }
        };

        initializeApp();
    }, []);

    if (!initialized) {
        return (
            <div className="app-loading">
                <div className="spinner"></div>
                <p>Загрузка приложения...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="app-error">
                <h1>Ошибка</h1>
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>Перезагрузить</button>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <App />
        </BrowserRouter>
    );
};

export default InitApp;
