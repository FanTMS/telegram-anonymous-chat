import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './main.css'
import InitApp from './InitApp'
import WebApp from '@twa-dev/sdk'
import './utils/webAppHelper' // Подключаем хелпер, который вызывает WebApp.ready() немедленно

// Импортируем мок для Telegram WebApp
import { createWebAppMock } from './utils/telegramMock'

// Для отслеживания времени загрузки
console.time('⏱️ app-initialization');

// Очищаем таймаут из HTML если он существует
if (window.telegramAppInitTimeout) {
  console.log('Очищаем таймаут инициализации из HTML');
  clearTimeout(window.telegramAppInitTimeout);
}

// Безопасная проверка наличия Telegram WebApp
const isTelegramAvailable = typeof window !== 'undefined' &&
  window.Telegram &&
  typeof window.Telegram.WebApp !== 'undefined' &&
  !!window.Telegram.WebApp.initData &&
  window.Telegram.WebApp.initData.length > 0;

// Инициализируем мок только если нужно (не в Telegram)
if (!isTelegramAvailable) {
  console.log('Telegram WebApp не обнаружен, создаем мок для разработки');
  createWebAppMock();
} else {
  console.log('Приложение запущено в реальном Telegram WebApp');
}

// Еще один вызов ready() - только при реальном Telegram
try {
  if (isTelegramAvailable) {
    console.log('Сигнализируем Telegram WebApp о готовности');
    WebApp.ready();
  } else {
    console.log('Не вызываем WebApp.ready() в режиме разработки');
  }
} catch (e) {
  console.warn('Ошибка при вызове WebApp.ready():', e);
}

// Инициализируем приложение с минимальными оболочками
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<InitApp />);

// Логируем время загрузки
console.timeEnd('⏱️ app-initialization');
