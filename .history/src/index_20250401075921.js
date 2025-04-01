import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import WebApp from '@twa-dev/sdk';
import { createMockTelegramWebApp } from './utils/mockTelegramWebApp';

// Инициализация мока Telegram Web App для режима разработки
if (process.env.NODE_ENV === 'development') {
    createMockTelegramWebApp();
}

// Инициализация Telegram Web App
try {
    WebApp.ready();
} catch (error) {
    console.warn("Ошибка при инициализации Telegram WebApp:", error);
    console.log("Продолжаем в режиме разработки без WebApp API");
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
