import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './main.css';
import App from './App';
import WebApp from '@twa-dev/sdk';
import { errorTracker } from './utils/errorTracker';
import appState from './utils/globals';
import { whiteScreenDetector } from './utils/whiteScreenDetector';

// Импортируем мок для разработки
import { createWebAppMock } from './utils/telegramMock';

console.time('⏱️ app-initialization');

// Очищаем таймаут загрузочного экрана из HTML
if (window.telegramAppInitTimeout) {
  clearTimeout(window.telegramAppInitTimeout);
}

// Проверяем, работаем ли мы в Telegram WebApp
const isInTelegram = appState.inTelegram;

console.log(`🚀 Приложение запускается ${isInTelegram ? 'В TELEGRAM' : 'ЛОКАЛЬНО'}`);
console.log(`🌎 Окружение: ${process.env.NODE_ENV}, платформа: ${appState.platform}`);

// Создаем мок в режиме разработки если нужно
if (!isInTelegram) {
  console.log('🔧 Создаем мок Telegram WebApp API для локальной разработки');
  createWebAppMock();
}

// Инициализируем и вызываем WebApp.ready() для Telegram
if (isInTelegram) {
  try {
    WebApp.ready();
    WebApp.expand();
    console.log('✓ Telegram WebApp API инициализирован');

    // Устанавливаем тему
    const theme = WebApp.colorScheme || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    console.log(`🎨 Установлена тема: ${theme}`);
  } catch (e) {
    console.error('❌ Ошибка при инициализации Telegram WebApp:', e);
    errorTracker.logError(e instanceof Error ? e : new Error('Ошибка инициализации WebApp'));
  }
}

// Получаем корневой элемент для рендеринга
const rootElement = document.getElementById('root');

if (!rootElement) {
  console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: Элемент #root не найден!');
  document.body.innerHTML = '<div style="padding:20px;text-align:center;"><h1>Ошибка загрузки</h1><p>Не найден корневой элемент приложения</p></div>';
} else {
  try {
    // Рендерим приложение без StrictMode для предотвращения двойных рендеров
    ReactDOM.createRoot(rootElement).render(<App />);
    console.log('✓ Приложение успешно отрендерено');

    // Удаляем загрузочный экран
    if (typeof window.removeLoadingScreen === 'function') {
      window.removeLoadingScreen();
    }

    // Запускаем детектор белых экранов через некоторое время
    setTimeout(() => {
      whiteScreenDetector.start();
    }, 2000);
  } catch (error) {
    console.error('❌ КРИТИЧЕСКАЯ ОШИБКА при рендеринге приложения:', error);
    errorTracker.logError(error instanceof Error ? error : new Error('Ошибка рендеринга приложения'));

    document.body.innerHTML = `<div style="padding:20px;text-align:center;">
      <h1>Ошибка запуска приложения</h1>
      <p>${error instanceof Error ? error.message : 'Неизвестная ошибка'}</p>
      <button onclick="window.location.reload()">Перезагрузить</button>
    </div>`;
  }
}

console.timeEnd('⏱️ app-initialization');
