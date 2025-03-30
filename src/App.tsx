import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { router } from './routes'
import { startMatchmakingService, stopMatchmakingService } from './utils/matchmaking'
import { validateLocalStorage } from './utils/database'
import { getCurrentUser, saveUser, User } from './utils/user' // Добавим тип User
import WebApp from '@twa-dev/sdk';
import Debug from './pages/Debug'

// Инициализация глобальных переменных для интервалов и флагов
if (typeof window !== 'undefined') {
  window._matchmakingIntervalId = null;
  window._newChatCheckInterval = null;
  window.demoUserAdded = false;
}

export const App = () => {
  const [matchmakingServiceId, setMatchmakingServiceId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Инициализация глобальных сервисов и установка светлой темы
  useEffect(() => {
    try {
      // Проверяем, запущено ли приложение локально
      const isLocalhost =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.includes('192.168.');

      // Если это локальная разработка, добавляем маркер в локальное хранилище
      if (isLocalhost) {
        console.log('Локальный запуск: предоставляем расширенные возможности отладки');
        localStorage.setItem('dev_mode', 'true');

        // Проверяем текущего пользователя и делаем его админом если локальная разработка
        getCurrentUser().then(currentUser => {
          if (currentUser) {
            currentUser.isAdmin = true;
            saveUser(currentUser);
          }
        });
      }

      // Принудительно устанавливаем светлую тему для всех пользователей
      document.body.classList.remove('dark');
      document.body.classList.add('light');

      // Пытаемся переопределить тему Telegram WebApp
      try {
        if (WebApp && WebApp.setHeaderColor) {
          WebApp.setHeaderColor('secondary_bg_color');
        }

        if (WebApp && WebApp.setBackgroundColor) {
          WebApp.setBackgroundColor('#ffffff');
        }
      } catch (e) {
        console.log('WebApp theme setting error:', e);
      }

      // Добавляем обработчик изменения темы Telegram, чтобы вернуть светлую тему
      const handleThemeChange = () => {
        document.body.classList.remove('dark');
        document.body.classList.add('light');
      };

      // Подписываемся на изменения темы
      if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', handleThemeChange);
      }

      // Валидируем данные в localStorage при запуске приложения
      if (validateLocalStorage) {
        validateLocalStorage(); // Проверяем наличие функции перед вызовом
      } else {
        console.warn('validateLocalStorage не определена, пропускаем проверку');
      }

      // Проверяем структуру основных данных
      const checkAndFixLocalStorage = () => {
        // Проверка chats
        try {
          const chatsData = localStorage.getItem('chats');
          if (chatsData) {
            try {
              const chats = JSON.parse(chatsData);
              if (!Array.isArray(chats)) {
                console.warn('Исправляем данные чатов - не массив');
                localStorage.setItem('chats', JSON.stringify([]));
              } else {
                // Проверяем валидность каждого чата
                const validChats = chats.filter(chat =>
                  chat &&
                  typeof chat === 'object' &&
                  chat.id &&
                  Array.isArray(chat.participants) &&
                  chat.participants.length === 2
                );

                // Если есть невалидные чаты, сохраняем только валидные
                if (validChats.length !== chats.length) {
                  console.warn(`Обнаружены невалидные чаты (${chats.length - validChats.length}), исправляем`);
                  localStorage.setItem('chats', JSON.stringify(validChats));
                }
              }
            } catch (e) {
              console.warn('Исправляем данные чатов - ошибка парсинга');
              localStorage.setItem('chats', JSON.stringify([]));
            }
          } else {
            console.log('Инициализируем пустой массив чатов');
            localStorage.setItem('chats', JSON.stringify([]));
          }
        } catch (error) {
          console.error('Ошибка при проверке чатов:', error);
        }

        // Проверка users
        try {
          const usersData = localStorage.getItem('users');
          if (usersData) {
            try {
              const users = JSON.parse(usersData);
              if (!Array.isArray(users)) {
                console.warn('Исправляем данные пользователей - не массив');
                localStorage.setItem('users', JSON.stringify([]));
              }
            } catch (e) {
              console.warn('Исправляем данные пользователей - ошибка парсинга');
              localStorage.setItem('users', JSON.stringify([]));
            }
          } else {
            console.log('Инициализируем пустой массив пользователей');
            localStorage.setItem('users', JSON.stringify([]));
          }
        } catch (error) {
          console.error('Ошибка при проверке пользователей:', error);
        }

        // Также очищаем устаревшие данные поиска при старте приложения
        try {
          // Очищаем данные поиска
          localStorage.setItem('searching_users', JSON.stringify([]));
          console.log('Данные поиска сброшены при старте');
        } catch (error) {
          console.error('Ошибка при сбросе данных поиска:', error);
        }
      };

      // Выполняем проверку и исправление
      checkAndFixLocalStorage();

      // Запуск сервиса поиска совпадений
      console.log("Запуск глобального сервиса подбора пар");
      const serviceId = startMatchmakingService(3000); // Сократили время проверки до 3 секунд
      setMatchmakingServiceId(serviceId);

      // Обработка ошибок в глобальном контексте
      const errorHandler = (event: ErrorEvent) => {
        console.error('Глобальная ошибка:', event.error);
        setError(`Произошла ошибка: ${event.message}`);
      };

      window.addEventListener('error', errorHandler);

      return () => {
        // Отписка от события изменения темы
        if (window.matchMedia) {
          window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', handleThemeChange);
        }

        // Отключение обработчика ошибок
        window.removeEventListener('error', errorHandler);

        // Отключение сервиса при размонтировании
        if (matchmakingServiceId) {
          console.log("Остановка глобального сервиса подбора пар");
          stopMatchmakingService(matchmakingServiceId);
        }

        // Очищаем все интервалы
        if (window._newChatCheckInterval) {
          clearInterval(window._newChatCheckInterval);
          window._newChatCheckInterval = null;
        }
      };
    } catch (error) {
      console.error("Failed to start matchmaking service:", error);
      setError(`Ошибка при запуске сервиса подбора: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  }, [matchmakingServiceId]);

  // Если есть ошибка, показываем уведомление
  if (error) {
    return (
      <div className="fixed inset-0 bg-red-50 flex flex-col items-center justify-center p-4 z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md text-center">
          <h2 className="text-red-600 text-xl font-bold mb-4">Произошла ошибка</h2>
          <p className="text-gray-800 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Перезагрузить приложение
          </button>
        </div>
      </div>
    );
  }

  // Рендерим только роутер
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/debug" element={<Debug />} /> {/* Добавляем маршрут отладки */}
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
