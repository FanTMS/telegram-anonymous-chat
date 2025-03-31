import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './main.css'
import InitApp from './InitApp'

// Импортируем наш хелпер для Telegram WebApp
import { isTelegramWebApp, initializeTelegramWebApp } from './utils/telegramWebAppHelper'
import { createWebAppMock } from './utils/telegramMock'

// Для отслеживания времени загрузки
console.time('⏱️ app-initialization');

// Очищаем таймаут из HTML если он существует
if (window.telegramAppInitTimeout) {
  console.log('Очищаем таймаут инициализации из HTML');
  clearTimeout(window.telegramAppInitTimeout);
}

// Проверяем, запущено ли приложение в Telegram
const runningInTelegram = isTelegramWebApp();

// Инициализируем мок только если НЕ в Telegram
if (!runningInTelegram) {
  console.log('Запуск в режиме разработки, создаем мок Telegram WebApp');
  createWebAppMock();
} else {
  console.log('Приложение запущено в Telegram WebApp');
  // Инициализируем Telegram WebApp
  initializeTelegramWebApp();
}

// Инициализируем приложение с минимальными оболочками
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<InitApp />);

// Логируем время загрузки
console.timeEnd('⏱️ app-initialization');
