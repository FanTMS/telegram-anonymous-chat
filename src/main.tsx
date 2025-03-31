import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './main.css'
import InitApp from './InitApp'
import WebApp from '@twa-dev/sdk'
import './utils/webAppHelper' // Подключаем хелпер, который вызывает WebApp.ready() немедленно

// Для отслеживания времени загрузки
console.time('⏱️ app-initialization');

// Очищаем таймаут из HTML если он существует
if (window.telegramAppInitTimeout) {
  console.log('Очищаем таймаут инициализации из HTML');
  clearTimeout(window.telegramAppInitTimeout);
}

// Еще один вызов ready() для надежности
try {
  if (typeof WebApp !== 'undefined') {
    console.log('Дополнительный вызов WebApp.ready() в main.tsx');
    WebApp.ready();
  }
} catch (e) {
  console.warn('Ошибка при дополнительном вызове WebApp.ready():', e);
}

// Инициализируем приложение с минимальными оболочками
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<InitApp />);

// Логируем время загрузки
console.timeEnd('⏱️ app-initialization');
