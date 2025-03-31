import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './main.css'
import InitApp from './InitApp'
import WebApp from '@twa-dev/sdk'

// Импортируем мок для Telegram WebApp
import { createWebAppMock } from './utils/telegramMock'

// Для отслеживания времени загрузки
console.time('app-initialization');

// Безопасная проверка наличия Telegram WebApp
const isTelegramAvailable = typeof window !== 'undefined' &&
  window.Telegram &&
  typeof window.Telegram.WebApp !== 'undefined';

// Инициализируем мок только если нужно
if (!isTelegramAvailable) {
  console.log('Telegram WebApp не обнаружен, создаем мок');
  createWebAppMock();
} else {
  console.log('Telegram WebApp обнаружен, используем реальное API');
}

// Инициализируем приложение
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <InitApp />
  </React.StrictMode>
)

// Логируем время загрузки
console.timeEnd('app-initialization');
