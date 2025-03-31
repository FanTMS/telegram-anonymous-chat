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
                if (isTelegramWebApp() &&
                    typeof WebApp !== 'undefined' &&
                    WebApp.initDataUnsafe &&
                    WebApp.initDataUnsafe.user &&
                    WebApp.initDataUnsafe.user.id) {

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

                // Запускаем отладочные утилиты только если они существуют и мы в режиме разработки
                if (process.env.NODE_ENV === 'development' && debugUtils && typeof debugUtils.runFullDebug === 'function') {
                    try {
                        debugUtils.runFullDebug();
                    } catch (debugError) {
                        console.error('Ошибка отладочных утилит:', debugError);
                    }
                }

                // Завершаем инициализацию
                setInitialized(true);
            } catch (error) {
                console.error('Ошибка при инициализации приложения:', error);
                setError('Произошла ошибка при инициализации приложения');
                setInitialized(true); // Всё равно показываем приложение
            }
        };

        initializeApp();
    }, []);

    if (!initialized) {
        return (
            <div className="app-loading" style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                textAlign: 'center'
            }}>
                <div className="spinner" style={{
                    border: '4px solid rgba(0, 0, 0, 0.1)',
                    borderRadius: '50%',
                    borderTop: '4px solid #3498db',
                    width: '50px',
                    height: '50px',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <p>Загрузка приложения...</p>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div className="app-error" style={{
                padding: '20px',
                textAlign: 'center',
                maxWidth: '600px',
                margin: '40px auto'
            }}>
                <h1>Ошибка</h1>
                <p>{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Перезагрузить
                </button>
            </div>
        );
    }

    // Добавляем простой обертку для отладки, если приложение рендерится корректно
    return (
        <BrowserRouter>
            <div id="app-container">
                <App />
            </div>
        </BrowserRouter>
    );
};

export default InitApp;
