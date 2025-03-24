import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { isAdmin as checkAdmin, getCurrentUser, saveUser, User } from '../utils/user'
import { NavButton } from './NavButton'
import { motion, AnimatePresence } from 'framer-motion'
import { ChatRedirectHandler } from './ChatRedirectHandler'
import { hasNewChat, getNewChatNotification, markChatNotificationAsRead } from '../utils/matchmaking'

export const Layout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const [isLoading, setIsLoading] = useState(true) // Добавляем состояние загрузки
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null)

  // Инициализация с таймаутом
  useEffect(() => {
    // Устанавливаем таймаут, чтобы избежать бесконечной загрузки
    const timeout = setTimeout(() => {
      setIsLoading(false);
      console.log("Layout forced loading completion after timeout");
    }, 3000);

    setLoadingTimeout(timeout);

    return () => {
      if (loadingTimeout) clearTimeout(loadingTimeout);
    };
  }, []);

  // Проверяем, является ли пользователь администратором
  useEffect(() => {
    try {
      // Убедимся, что данные в localStorage корректны
      const currentUserID = localStorage.getItem('current_user_id');
      if (currentUserID) {
        const userKey = `user_${currentUserID}`;
        const userData = localStorage.getItem(userKey);

        if (!userData) {
          console.warn('Layout: current_user_id exists but user data not found');
        }
      }

      const isUserAdmin = checkAdmin();
      setIsAdminUser(isUserAdmin);

      // Завершаем загрузку после инициализации
      setIsLoading(false);
      if (loadingTimeout) clearTimeout(loadingTimeout);

    } catch (error) {
      console.error('Layout initialization error:', error);
      setIsLoading(false);
      if (loadingTimeout) clearTimeout(loadingTimeout);
    }

    // Проверяем наличие новых чатов с таймаутом
    let checkAttemptsCount = 0;
    const maxAttempts = 5;

    const checkNewChats = () => {
      try {
        checkAttemptsCount++;
        const currentUser = getCurrentUser();
        if (currentUser) {
          const newChat = hasNewChat(currentUser.id);
          setHasNewMessage(newChat);
        }

        // После maxAttempts попыток завершаем проверку, чтобы избежать бесконечных циклов
        if (checkAttemptsCount >= maxAttempts) {
          console.log(`Reached max check attempts (${maxAttempts}), stopping new chat checks`);
          return;
        }
      } catch (error) {
        console.error('Ошибка при проверке новых чатов:', error);
      }
    };

    // Проверяем при монтировании
    checkNewChats();

    // После успешной проверки устанавливаем меньший интервал
    const intervalId = setInterval(checkNewChats, 10000); // проверка каждые 10 секунд

    return () => clearInterval(intervalId);
  }, []);

  // Функция создания демо-пользователя
  const createDemoUser = () => {
    const userId = `user_${Date.now()}`
    const demoUser: User = {
      id: userId,
      name: 'Демо Пользователь',
      age: 25,
      city: 'Москва',
      rating: 4.5,
      interests: ['Музыка', 'Кино', 'Путешествия'],
      isAnonymous: false,
      createdAt: Date.now(),
      lastActive: Date.now(),
      isAdmin: true, // По умолчанию пользователь является администратором
      telegramData: {
        telegramId: '5394381166' // ID из запроса
      }
    }

    saveUser(demoUser)
    return demoUser
  }

  // Определяем заголовок в зависимости от текущего маршрута
  const getTitle = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    const mainPath = pathSegments[0] || 'home'

    const titles: Record<string, string> = {
      'home': 'Анонимный чат',
      'profile': 'Профиль',
      'settings': 'Настройки',
      'friends': 'Друзья',
      'chat': 'Чат',
      'help': 'Как начать общение',
      'store': 'Магазин',
      'admin': 'Админ-панель',
      'beginner-guide': 'Как начать общение'
    }

    return titles[mainPath] || 'Анонимный чат'
  }

  // Адаптируем Telegram WebApp при монтировании компонента
  useEffect(() => {
    try {
      if (typeof WebApp !== 'undefined') {
        WebApp.ready()
        WebApp.expand()

        // Определяем тип для параметров темы
        type ThemeParams = {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        }

        // Безопасно получаем параметры темы
        const themeParams: ThemeParams = WebApp.themeParams || {}

        // Устанавливаем фоновой цвет и цвет текста из Telegram
        document.documentElement.style.setProperty('--tg-theme-bg-color', themeParams.bg_color || '#ffffff')
        document.documentElement.style.setProperty('--tg-theme-text-color', themeParams.text_color || '#000000')
        document.documentElement.style.setProperty('--tg-theme-hint-color', themeParams.hint_color || '#999999')
        document.documentElement.style.setProperty('--tg-theme-link-color', themeParams.link_color || '#2678b6')
        document.documentElement.style.setProperty('--tg-theme-button-color', themeParams.button_color || '#2678b6')
        document.documentElement.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color || '#ffffff')
        document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', themeParams.secondary_bg_color || '#f0f0f0')

        // Для правильной работы фона с прозрачностью
        const bgColor = themeParams.bg_color || '#ffffff'
        // Преобразуем цвет в RGB для использования с rgba
        const rgb = hexToRgb(bgColor)
        if (rgb) {
          document.documentElement.style.setProperty('--tg-theme-bg-color-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`)
        }

        // Установка цветовой схемы
        if (WebApp.colorScheme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }

        // Устанавливаем заголовок в MainButton Telegram
        if (WebApp.MainButton && WebApp.MainButton.setText) {
          WebApp.MainButton.setText(getTitle())
        }
      }
    } catch (error) {
      console.error('Error initializing Telegram WebApp:', error)
    }
  }, [location])

  // Функция для преобразования HEX цвета в RGB
  const hexToRgb = (hex: string) => {
    // Убираем # если он есть
    hex = hex.replace(/^#/, '')

    // Обрабатываем 3-символьный формат
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    }

    // Преобразуем в RGB
    const bigint = parseInt(hex, 16)
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255
    }
  }

  // Оптимизируем обработку чатов
  useEffect(() => {
    // Функция для проверки новых чатов
    const checkNewChats = () => {
      const currentUser = getCurrentUser();
      if (currentUser) {
        const newChat = hasNewChat(currentUser.id);
        setHasNewMessage(newChat);
      }
    };

    // Проверяем при монтировании и запускаем интервал
    checkNewChats();
    const intervalId = setInterval(checkNewChats, 3000);

    return () => clearInterval(intervalId);
  }, [location.pathname]); // Добавляем зависимость от маршрута

  // Добавляем проверку для перенаправления чатов
  useEffect(() => {
    // Функция для проверки новых чатов
    const checkForNewChats = () => {
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      try {
        // Проверяем, есть ли новый чат
        if (hasNewChat(currentUser.id)) {
          const notification = getNewChatNotification(currentUser.id);

          if (notification && !notification.isRead) {
            console.log(`Новый чат обнаружен: ${notification.chatId}`, notification);

            // Сохраняем ID чата для использования в компоненте чата
            localStorage.setItem('active_chat_id', notification.chatId);

            // Отмечаем уведомление как прочитанное только при переходе в чат
            if (!location.pathname.includes(`/chat/${notification.chatId}`)) {
              console.log(`Перенаправляем на чат: /chat/${notification.chatId}`);
              navigate(`/chat/${notification.chatId}`);
            }
          }
        }
      } catch (error) {
        console.error('Ошибка при проверке новых чатов:', error);
      }
    };

    // Проверяем сразу после монтирования
    checkForNewChats();

    // Запускаем периодическую проверку
    const intervalId = setInterval(checkForNewChats, 3000);

    return () => {
      clearInterval(intervalId);
    };
  }, [navigate, location.pathname]);

  // Отображаем индикатор загрузки, если Layout всё еще инициализируется
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-blue-500 border-solid rounded-full animate-spin border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="tg-container">
      {/* Основной контент */}
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="pt-2 pb-20" // Отступ снизу для навигации
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>

      {/* Нижняя навигация с индикатором нового сообщения */}
      <motion.nav
        className="fixed bottom-0 left-0 right-0 tg-navbar"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="grid grid-cols-6 items-center max-w-md mx-auto">
          <NavButton
            to="/"
            icon="🏠"
            label="Главная"
            isActive={location.pathname === '/' || location.pathname.startsWith('/chat')}
          />
          <NavButton
            to="/friends"
            icon="👥"
            label="Друзья"
            isActive={location.pathname === '/friends'}
            hasNotification={hasNewMessage}
          />
          <NavButton
            to="/groups"
            icon="👨‍👩‍👧‍👦"
            label="Группы"
            isActive={location.pathname === '/groups'}
          />
          <NavButton
            to="/chats"
            icon="💬"
            label="Чаты"
            isActive={location.pathname === '/chats' || location.pathname.startsWith('/direct/chat')}
          />
          <NavButton
            to="/store"
            icon="🛒"
            label="Магазин"
            isActive={location.pathname === '/store'}
          />
          <NavButton
            to="/profile"
            icon="👤"
            label="Профиль"
            isActive={location.pathname === '/profile'}
          />
        </div>
      </motion.nav>
    </div>
  );
}
