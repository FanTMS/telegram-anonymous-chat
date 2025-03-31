import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { router } from './routes'
import { RouterProvider } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { userStorage } from './utils/userStorage'

// Инициализация изолированного хранилища для пользователя
try {
  if (WebApp && WebApp.initDataUnsafe && WebApp.initDataUnsafe.user) {
    const userId = WebApp.initDataUnsafe.user.id;
    userStorage.initialize(userId);
    console.log(`UserStorage инициализировано для пользователя ${userId}`);
  } else {
    // В режиме разработки используем временный ID
    const devUserId = localStorage.getItem('dev_user_id') || `dev_${Date.now()}`;
    localStorage.setItem('dev_user_id', devUserId);
    userStorage.initialize(devUserId);
    console.log('UserStorage инициализировано для режима разработки');
  }
} catch (e) {
  console.error('Ошибка при инициализации UserStorage:', e);
}

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

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
