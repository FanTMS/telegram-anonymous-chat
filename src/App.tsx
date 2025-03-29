import { Suspense, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Layout } from './components/Layout'
import WebApp from '@twa-dev/sdk'
import { InitialRegistrationCheck } from './components/InitialRegistrationCheck'
import { validateLocalStorage } from './utils/database'

export function App() {
  useEffect(() => {
    // Гарантируем, что локальное хранилище в правильном состоянии
    validateLocalStorage();

    // Инициализируем WebApp
    try {
      // Сообщаем Telegram, что WebApp готов к работе
      WebApp.ready();

      // Расширяем WebApp на весь экран для лучшего UX
      if (WebApp.isExpanded === false) {
        WebApp.expand();
      }

      // Устанавливаем обработчик для основной кнопки Telegram
      WebApp.MainButton.setText('Меню');

      // Определяем функцию-обработчик для кнопки
      const handleMainButtonClick = () => {
        // Можно добавить навигацию в главное меню или другое действие
        console.log('Нажата основная кнопка Telegram');
      };

      // Устанавливаем обработчик
      WebApp.MainButton.onClick(handleMainButtonClick);

    } catch (error) {
      console.warn('Ошибка при инициализации Telegram WebApp:', error);
    }

    // Добавляем слушатель для событий изменения темы
    const handleThemeChange = () => {
      if (WebApp.colorScheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    };

    // Устанавливаем начальную тему
    handleThemeChange();

    // Возвращаем функцию cleanup для удаления обработчиков
    return () => {
      try {
        // Определяем функцию-обработчик, которую мы хотим удалить
        const handleMainButtonClick = () => {
          console.log('Нажата основная кнопка Telegram');
        };

        // Удаляем обработчик с указанием функции
        WebApp.MainButton.offClick(handleMainButtonClick);
      } catch (error) {
        console.warn('Ошибка при удалении обработчика:', error);
      }
    };
  }, []);

  return (
    <InitialRegistrationCheck>
      <Suspense fallback={<div className="loading">Загрузка...</div>}>
        <Outlet />
      </Suspense>
    </InitialRegistrationCheck>
  )
}
