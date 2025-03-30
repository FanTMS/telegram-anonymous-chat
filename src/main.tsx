import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { routes } from './routes'
import { NotificationProvider } from './components/NotificationProvider'
import WebApp from '@twa-dev/sdk'
import './index.css'
import './styles/index.css'
import './styles/chat.css'  // Добавляем импорт стилей для чата
import './styles/bot-chat.css'  // Добавляем импорт стилей для чат-бота

// Инициализация WebApp и адаптация цветовой схемы
try {
  WebApp.ready();

  // Установка цветовой схемы
  if (WebApp.colorScheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
} catch (e) {
  console.warn('Cannot initialize Telegram WebApp:', e);

  // Если не в Telegram, определяем цветовую схему системы
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Устанавливаем переменные RGB для корректной работы прозрачности
document.documentElement.style.setProperty(
  '--tg-theme-bg-color-rgb',
  WebApp.themeParams?.bg_color
    ? hexToRgb(WebApp.themeParams.bg_color)
    : '255, 255, 255'
);

// Функция преобразования hex цвета в RGB строку
function hexToRgb(hex: string): string {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const longHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(longHex);
  if (!result) return '255, 255, 255';

  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

const router = createBrowserRouter(routes);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NotificationProvider>
      <RouterProvider router={router} />
    </NotificationProvider>
  </React.StrictMode>
)
