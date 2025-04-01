import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import WebApp from '@twa-dev/sdk';

// Инициализация Telegram Web App
WebApp.ready();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
