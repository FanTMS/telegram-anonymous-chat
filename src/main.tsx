import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './main.css'
import InitApp from './InitApp'

// Импортируем мок для Telegram WebApp
import { createWebAppMock } from './utils/telegramMock'

// Для отслеживания времени загрузки
console.time('app-initialization');

// Инициализируем мок перед запуском приложения (только в режиме разработки)
createWebAppMock();

// Запускаем приложение через инициализатор для корректной загрузки в Telegram WebApp
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <InitApp />
  </React.StrictMode>
)

// Логируем время загрузки
console.timeEnd('app-initialization');
