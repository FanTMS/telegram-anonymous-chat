import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useTelegramWebApp } from './hooks/useTelegramWebApp';
import WebApp from '@twa-dev/sdk';

// Создаем базовые компоненты
const HomePage = () => {
  const twa = useTelegramWebApp({ expandApp: true });
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    // Отправляем сообщение, что страница загрузилась
    if (twa.isAvailable) {
      twa.hapticFeedback.notificationOccurred('success');
    }

    // Получаем данные из Telegram WebApp если доступны
    if (WebApp && WebApp.initDataUnsafe && WebApp.initDataUnsafe.user) {
      setUserData(WebApp.initDataUnsafe.user);
    } else {
      setUserData({ id: 'dev-user', first_name: 'Developer' });
    }
  }, [twa]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Telegram Anonymous Chat</h1>

      {userData ? (
        <div className="bg-white shadow rounded p-4 mb-4 dark:bg-gray-800 dark:text-white">
          <h2 className="text-lg font-semibold">Привет, {userData.first_name}!</h2>
          <p className="text-gray-600 dark:text-gray-300">ID: {userData.id}</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded p-4 mb-4 dark:bg-gray-800 dark:text-white">
          <p>Загрузка данных пользователя...</p>
        </div>
      )}

      <div className="bg-white shadow rounded p-4 dark:bg-gray-800 dark:text-white">
        <h2 className="text-lg font-semibold mb-2">Информация о WebApp</h2>
        <div className="text-sm text-gray-700 dark:text-gray-300">
          <p>Тема: {twa.colorScheme || 'не определена'}</p>
          <p>Платформа: {navigator.userAgent}</p>
          <p>Версия SDK: 6.9.2</p>
          <p>Доступен Telegram WebApp: {twa.isAvailable ? 'Да' : 'Нет'}</p>
        </div>

        <div className="mt-4">
          <button
            onClick={() => twa.showAlert('Это тестовое сообщение')}
            className="bg-blue-500 text-white px-4 py-2 rounded mr-2 hover:bg-blue-600"
          >
            Показать уведомление
          </button>

          <button
            onClick={() => twa.hapticFeedback.notificationOccurred('success')}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Haptic отклик
          </button>
        </div>
      </div>
    </div>
  );
};

const NotFoundPage = () => {
  const twa = useTelegramWebApp({ useBackButton: true });

  useEffect(() => {
    if (twa.isAvailable) {
      twa.hapticFeedback.notificationOccurred('error');
    }
  }, [twa]);

  return (
    <div className="p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">404 - Страница не найдена</h1>
      <p>Запрошенная страница не существует.</p>
      <button
        onClick={() => window.history.back()}
        className="bg-blue-500 text-white px-4 py-2 rounded mt-4 hover:bg-blue-600"
      >
        Вернуться назад
      </button>
    </div>
  );
};

// Основной компонент App
const App: React.FC = () => {
  return (
    <Router>
      <div className="app-container min-h-screen bg-gray-100 dark:bg-gray-900">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
