import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import WebApp from '@twa-dev/sdk'
import { isAdmin as checkAdmin, getCurrentUser, saveUser, User, createUserFromTelegram } from '../utils/user'
import { NavButton } from './NavButton'
import { motion, AnimatePresence } from 'framer-motion'
import { ChatRedirectHandler } from './ChatRedirectHandler'
import { hasNewChat, getNewChatNotification, markChatNotificationAsRead } from '../utils/matchmaking'
import { userStorage } from '../utils/userStorage'

export const Layout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [isAdminUser, setIsAdminUser] = useState(false)
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isDevMode, setIsDevMode] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  // Инициализация с таймаутом
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsLoading(false);
      console.log("Layout forced loading completion after timeout");
    }, 3000);

    setLoadingTimeout(timeout);

    return () => {
      if (loadingTimeout) clearTimeout(loadingTimeout);
    };
  }, []);

  useEffect(() => {
    const checkUserAndAuthenticate = async () => {
      try {
        // Проверяем, инициализировано ли хранилище пользователя
        if (WebApp && WebApp.initDataUnsafe && WebApp.initDataUnsafe.user) {
          const userId = WebApp.initDataUnsafe.user.id;
          if (!userStorage.isInitialized() || userStorage.getUserId() !== String(userId)) {
            console.log(`Инициализация хранилища для Telegram пользователя ${userId}`);
            userStorage.initialize(userId);
          }
        } else if (localStorage.getItem('dev_user_id')) {
          const devUserId = localStorage.getItem('dev_user_id');
          if (!userStorage.isInitialized() || userStorage.getUserId() !== devUserId) {
            console.log(`Инициализация хранилища для разработки с ID ${devUserId}`);
            userStorage.initialize(devUserId!);
          }
        }

        let user = getCurrentUser();
        console.log('Layout проверяет пользователя:', user ? {
          id: user.id,
          name: user.name,
          age: user.age,
          hasInterests: user.interests && user.interests.length > 0
        } : 'нет пользователя');

        // Проверка полной регистрации - пользователь должен иметь возраст и хотя бы один интерес
        const isFullyRegistered = user &&
          user.name &&
          user.age &&
          user.age >= 13 &&
          user.interests &&
          user.interests.length > 0;

        // Перенаправляем на регистрацию, если пользователь не прошел полную регистрацию
        if (!isFullyRegistered) {
          console.log('Пользователь не прошел полную регистрацию - перенаправление');
          // Очищаем локальное хранилище, чтобы убедиться, что нет устаревших данных
          // НЕ удаляем пользователя, только флаг текущего пользователя
          localStorage.removeItem('current_user_id');
          navigate('/registration', { replace: true });
          return;
        }

        setCurrentUser(user);

        const isAdmin = await checkAdmin();
        setIsAdminUser(isAdmin);

        if (user) {
          user.lastActive = Date.now();
          saveUser(user);
        }
      } catch (error) {
        console.error('Ошибка при проверке пользователя:', error);
        // При ошибке также перенаправляем на регистрацию
        navigate('/registration', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    checkUserAndAuthenticate();
  }, [navigate, location.pathname]);

  useEffect(() => {
    try {
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

      setIsLoading(false);
      if (loadingTimeout) clearTimeout(loadingTimeout);
    } catch (error) {
      console.error('Layout initialization error:', error);
      setIsLoading(false);
      if (loadingTimeout) clearTimeout(loadingTimeout);
    }

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

        if (checkAttemptsCount >= maxAttempts) {
          console.log(`Reached max check attempts (${maxAttempts}), stopping new chat checks`);
          return;
        }
      } catch (error) {
        console.error('Ошибка при проверке новых чатов:', error);
      }
    };

    checkNewChats();

    const intervalId = setInterval(checkNewChats, 10000);

    return () => clearInterval(intervalId);
  }, []);

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
      isAdmin: true,
      telegramData: {
        telegramId: '5394381166'
      }
    }

    saveUser(demoUser)
    return demoUser
  }

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

  useEffect(() => {
    try {
      if (typeof WebApp !== 'undefined') {
        WebApp.ready()
        WebApp.expand()

        type ThemeParams = {
          bg_color?: string;
          text_color?: string;
          hint_color?: string;
          link_color?: string;
          button_color?: string;
          button_text_color?: string;
          secondary_bg_color?: string;
        }

        const themeParams: ThemeParams = WebApp.themeParams || {}

        document.documentElement.style.setProperty('--tg-theme-bg-color', themeParams.bg_color || '#ffffff')
        document.documentElement.style.setProperty('--tg-theme-text-color', themeParams.text_color || '#000000')
        document.documentElement.style.setProperty('--tg-theme-hint-color', themeParams.hint_color || '#999999')
        document.documentElement.style.setProperty('--tg-theme-link-color', themeParams.link_color || '#2678b6')
        document.documentElement.style.setProperty('--tg-theme-button-color', themeParams.button_color || '#2678b6')
        document.documentElement.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color || '#ffffff')
        document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', themeParams.secondary_bg_color || '#f0f0f0')

        const bgColor = themeParams.bg_color || '#ffffff'
        const rgb = hexToRgb(bgColor)
        if (rgb) {
          document.documentElement.style.setProperty('--tg-theme-bg-color-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`)
        }

        if (WebApp.colorScheme === 'dark') {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }

        if (WebApp.MainButton && WebApp.MainButton.setText) {
          WebApp.MainButton.setText(getTitle())
        }
      }
    } catch (error) {
      console.error('Error initializing Telegram WebApp:', error)
    }
  }, [location])

  const hexToRgb = (hex: string) => {
    hex = hex.replace(/^#/, '')

    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    }

    const bigint = parseInt(hex, 16)
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255
    }
  }

  useEffect(() => {
    const checkNewChats = () => {
      const currentUser = getCurrentUser();
      if (currentUser) {
        const newChat = hasNewChat(currentUser.id);
        setHasNewMessage(newChat);
      }
    };

    checkNewChats();
    const intervalId = setInterval(checkNewChats, 3000);

    return () => clearInterval(intervalId);
  }, [location.pathname]);

  useEffect(() => {
    const checkForNewChats = () => {
      const currentUser = getCurrentUser();
      if (!currentUser) return;

      try {
        if (hasNewChat(currentUser.id)) {
          const notification = getNewChatNotification(currentUser.id);

          if (notification && !notification.isRead) {
            console.log(`Новый чат обнаружен: ${notification.chatId}`, notification);

            localStorage.setItem('active_chat_id', notification.chatId);

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

    checkForNewChats();

    const intervalId = setInterval(checkForNewChats, 3000);

    return () => {
      clearInterval(intervalId);
    };
  }, [navigate, location.pathname]);

  const renderDevModeIndicator = () => {
    if (!isDevMode) return null;

    return (
      <div
        className="fixed bottom-4 right-4 z-50 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-medium shadow-lg cursor-pointer"
        onClick={() => navigate('/test-chat')}
      >
        Режим разработки
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-blue-500 border-solid rounded-full animate-spin border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="tg-container">
      <ChatRedirectHandler enabled={true} />

      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="pt-2 pb-20"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>

      <motion.nav
        className="tg-navbar fixed bottom-0 left-0 right-0 max-w-full bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-2 z-50"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex justify-around items-center w-full px-1 max-w-md mx-auto">
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
          {isAdminUser && (
            <NavButton
              to="/admin"
              icon="⚙️"
              label="Админ"
              isActive={location.pathname.includes('/admin')}
            />
          )}
        </div>
      </motion.nav>

      {renderDevModeIndicator()}
    </div>
  );
}
