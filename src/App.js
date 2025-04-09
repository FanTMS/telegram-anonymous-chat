import React, { useState, useEffect, useContext } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { UserContext } from './contexts/UserContext';
import { ToastProvider } from './components/Toast';
import { NotificationProvider } from './contexts/NotificationContext';
import './styles/global.css';
import './styles/compact-mode.css';
import { checkAppStatus } from './utils/appCheck';

// Импорт компонентов
import RegistrationForm from './components/RegistrationForm';
import Home from './pages/Home';
import ChatsList from './pages/ChatsList';
import Chat from './pages/Chat';
import RandomChat from './pages/RandomChat';
import NotFoundPage from './pages/NotFoundPage';
import Profile from './pages/Profile';
import AppLayout from './components/AppLayout';
import BeginnerGuide from './pages/BeginnerGuide';
import AdminSupport from './pages/AdminSupport';
import SupportDiagnostics from './pages/SupportDiagnostics';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import GroupCreate from './pages/GroupCreate';
import GroupEdit from './pages/GroupEdit';
import IndexLoader from './components/IndexLoader';
import Admin from './pages/Admin';
import AdminDashboard from './pages/AdminDashboard';
import AdminConfig from './pages/AdminConfig';
import AdminUtility from './pages/AdminUtility';
import Friends from './pages/Friends';
import AdminReports from './pages/AdminReports';
import AdminStats from './pages/AdminStats';
import AdminUsers from './pages/AdminUsers';
import OnboardingTutorial from './components/OnboardingTutorial';

import './styles/BeginnerGuide.css';
import './App.css';

import WebApp from '@twa-dev/sdk';
import { doc, getDoc, _onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import connectionService from './utils/firebaseConnectionService';
import { createRequiredIndexes } from './utils/firebaseIndexCreator';
import { migrateUserStructure } from './utils/userStructureMigration';
import { setupLocalAdminRights, addAdminByTelegramId, addAdminByUID } from './utils/adminManager';
import { getTelegramUser } from './utils/telegramUtils';
import { isUserAdminByTelegramId, isUserAdminByUID } from './utils/adminManager';
import { auth } from './firebase';
import { 
    isCompactMode, 
    applyCompactModeStyles, 
    isMobileDevice,
    isIphoneWithNotch,
    updateSafeAreaVars,
    mobileKeyboardHandlers
} from './utils/telegramUtils';

// Иконки для навигации
const HomeIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

const ChatsIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <line x1="9" y1="10" x2="15" y2="10" />
    </svg>
);

const GroupsIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const ProfileIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

// Элементы навигации
const _navigationItems = [
    {
        path: '/',
        label: 'Главная',
        icon: <HomeIcon />,
        includesPaths: ['/home']
    },
    {
        path: '/chats',
        label: 'Чаты',
        icon: <ChatsIcon />,
        includesPaths: ['/chat/']
    },
    {
        path: '/groups',
        label: 'Группы',
        icon: <GroupsIcon />,
        includesPaths: ['/groups/']
    },
    {
        path: '/profile',
        label: 'Профиль',
        icon: <ProfileIcon />,
        includesPaths: ['/settings']
    }
];

// Компонент для защиты маршрутов, требующих авторизации
const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { isAuthenticated, loading, user, setUser } = useContext(UserContext);
    const navigate = useNavigate();
    const [isAdmin, setIsAdmin] = useState(false);
    const [checkedStorage, setCheckedStorage] = useState(false);
    const location = useLocation(); // Get current location
    
    // Дополнительная проверка авторизации из хранилища
    useEffect(() => {
        // Проверяем, есть ли ID пользователя в sessionStorage
        const checkStorageAuth = async () => {
            if (!isAuthenticated && !checkedStorage) {
                console.log('ProtectedRoute: Дополнительная проверка авторизации из хранилища');
                
                try {
                    const savedUserId = sessionStorage.getItem('current_user_id');
                    const savedUserData = sessionStorage.getItem('current_user');
                    
                    console.log('ProtectedRoute: userId из хранилища =', savedUserId, ', userData =', savedUserData ? 'найдено' : 'не найдено');
                    
                    if (savedUserId) {
                        // Если есть только ID пользователя, загружаем данные из Firestore
                        const userRef = doc(db, "users", savedUserId);
                        const userDoc = await getDoc(userRef);
                        
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            console.log('ProtectedRoute: Получены данные пользователя из Firestore:', userData);
                            
                            if (!userData.id) {
                                userData.id = savedUserId;
                            }
                            
                            // Сохраняем данные в контекст
                            setUser(userData);
                            console.log('ProtectedRoute: Данные пользователя установлены в контекст');
                            
                            // Обновляем сессионное хранилище
                            sessionStorage.setItem('current_user', JSON.stringify(userData));
                            sessionStorage.setItem('current_user_id', userData.id);
                        }
                    } else if (savedUserData) {
                        // Если есть полные данные пользователя в хранилище
                        try {
                            const userData = JSON.parse(savedUserData);
                            setUser(userData);
                            console.log('ProtectedRoute: Данные пользователя из хранилища установлены в контекст');
                        } catch (error) {
                            console.error('ProtectedRoute: Ошибка при парсинге данных пользователя:', error);
                        }
                    }
                } catch (error) {
                    console.error('ProtectedRoute: Ошибка при дополнительной проверке авторизации:', error);
                } finally {
                    setCheckedStorage(true);
                }
            }
        };
        
        if (!isAuthenticated && !loading && !checkedStorage) {
            checkStorageAuth();
        }
    }, [isAuthenticated, loading, setUser, checkedStorage]);
    
    useEffect(() => {
        const checkAdminAccess = async () => {
            if (adminOnly) {
                // Проверяем локальную разработку (всегда разрешено)
                const isLocalhost =
                    window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname.includes('192.168.');
                    
                if (isLocalhost) {
                    setIsAdmin(true);
                    return;
                }
                
                // Проверяем по данным пользователя
                if (user && user.isAdmin) {
                    setIsAdmin(true);
                    return;
                }
                
                // Проверяем по Telegram ID
                const telegramUser = getTelegramUser();
                if (telegramUser && telegramUser.id) {
                    // Специальный администратор
                    if (telegramUser.id.toString() === '5394381166') {
                        setIsAdmin(true);
                        return;
                    }
                    
                    // Проверяем права через adminManager
                    try {
                        const adminStatus = await isUserAdminByTelegramId(telegramUser.id.toString());
                        if (adminStatus) {
                            setIsAdmin(true);
                            return;
                        }
                    } catch (error) {
                        console.error('Ошибка при проверке прав администратора:', error);
                    }
                }
                
                // Дополнительно проверяем по Firebase UID
                if (auth.currentUser) {
                    try {
                        const adminStatus = await isUserAdminByUID(auth.currentUser.uid);
                        setIsAdmin(adminStatus);
                    } catch (error) {
                        console.error('Ошибка при проверке админ-прав по UID:', error);
                        setIsAdmin(false);
                    }
                }
            }
        };
        
        if (isAuthenticated && adminOnly) {
            checkAdminAccess();
        }
    }, [isAuthenticated, adminOnly, user]);
    
    useEffect(() => {
        // Только перенаправляем на /register, если не находимся уже на странице регистрации
        // и проверили все возможные источники авторизации
        if (!loading && !isAuthenticated && checkedStorage && 
            location.pathname !== '/register' && location.pathname !== '/onboarding') {
            console.log('ProtectedRoute: Редирект на /register, isAuthenticated =', isAuthenticated, 
                      ', loading =', loading, ', checkedStorage =', checkedStorage, 
                      ', currentPath =', location.pathname);
            navigate('/register', { replace: true });
        }
        
        if (adminOnly && !loading && isAuthenticated && !isAdmin) {
            // Если проверка админ-прав завершена и пользователь не админ - редирект
            navigate('/home', { replace: true });
        }
    }, [isAuthenticated, loading, navigate, adminOnly, isAdmin, checkedStorage, location.pathname]);
    
    if (loading || (!isAuthenticated && !checkedStorage)) {
        return <div className="loading-screen">Загрузка...</div>;
    }
    
    if (adminOnly && !isAdmin) {
        return <div className="loading-screen">Проверка прав доступа...</div>;
    }
    
    return isAuthenticated ? children : null;
};

function App() {
    const [isConnected, setIsConnected] = useState(true);
    const [connectionError, setConnectionError] = useState(null);
    const [_telegramInitialized, setTelegramInitialized] = useState(false);
    const [error, setError] = useState(null);
    const [initializeAttempts, setInitializeAttempts] = useState(0);

    console.log('App компонент инициализирован');
    
    // Проверка запуска приложения
    useEffect(() => {
        try {
            const status = checkAppStatus();
            console.log('Статус приложения:', status);
        } catch (err) {
            console.error('Ошибка при проверке запуска:', err);
        }
    }, []);

    // Инициализация и настройка Telegram WebApp
    useEffect(() => {
        const initTelegram = async () => {
            try {
                console.log('Попытка инициализации Telegram WebApp:', initializeAttempts);
                
                // Проверяем существование WebApp в глобальном объекте Telegram
                if (window.Telegram && window.Telegram.WebApp) {
                    console.log('Telegram WebApp обнаружен, инициализация...');
                    
                    // Устанавливаем обработчик ошибок WebApp
                    const originalPostEvent = window.Telegram.WebApp.postEvent;
                    if (originalPostEvent) {
                        window.Telegram.WebApp.postEvent = function() {
                            try {
                                return originalPostEvent.apply(this, arguments);
                            } catch (err) {
                                console.error('Ошибка в Telegram.WebApp.postEvent:', err);
                                return null;
                            }
                        };
                    }
                    
                    // Расширяем WebApp для лучшего пользовательского опыта
                    if (window.Telegram.WebApp.expand) {
                        try {
                            window.Telegram.WebApp.expand();
                        } catch (err) {
                            console.warn('Ошибка при расширении WebApp:', err);
                        }
                    }
                    
                    // Сообщаем Telegram, что приложение готово к работе
                    if (window.Telegram.WebApp.ready) {
                        try {
                            window.Telegram.WebApp.ready();
                        } catch (err) {
                            console.warn('Ошибка при вызове WebApp.ready():', err);
                        }
                    }
                    
                    // Отключаем запрос подтверждения при закрытии
                    if (window.Telegram.WebApp.disableClosingConfirmation) {
                        try {
                            window.Telegram.WebApp.disableClosingConfirmation();
                        } catch (err) {
                            console.warn('Ошибка при отключении запроса подтверждения закрытия:', err);
                        }
                    }
                    
                    // Получаем данные пользователя, если доступны
                    const userData = window.Telegram.WebApp.initDataUnsafe?.user;
                    if (userData) {
                        console.log('Получены данные пользователя Telegram:', userData);
                        
                        // Сохраняем в хранилища для надежности восстановления
                        try {
                            sessionStorage.setItem('telegram_last_user', JSON.stringify(userData));
                            sessionStorage.setItem('telegramUser', JSON.stringify(userData));
                        } catch (e) {
                            console.warn('Не удалось сохранить данные Telegram пользователя:', e);
                        }
                    }
                    
                    // Сохраняем информацию о том, что мы в Telegram мини-приложении
                    try {
                        sessionStorage.setItem('is_telegram_webapp', 'true');
                        document.body.classList.add('in-telegram');
                    } catch (e) {
                        console.warn('Не удалось сохранить маркер Telegram WebApp:', e);
                    }
                    
                    setTelegramInitialized(true);
                } else if (typeof WebApp !== 'undefined') {
                    console.log('Найден объект WebApp, но не в Telegram.WebApp');
                    
                    // Попытка использовать внешний WebApp если доступен
                    try {
                        if (WebApp.expand) WebApp.expand();
                        if (WebApp.ready) WebApp.ready();
                        if (WebApp.disableClosingConfirmation) WebApp.disableClosingConfirmation();
                        
                        // Получаем данные пользователя
                        const userData = WebApp.initDataUnsafe?.user;
                        if (userData) {
                            console.log('Получены данные Telegram из @twa-dev/sdk:', userData);
                            sessionStorage.setItem('telegram_last_user', JSON.stringify(userData));
                            sessionStorage.setItem('telegramUser', JSON.stringify(userData));
                        }
                        
                        sessionStorage.setItem('is_telegram_webapp', 'true');
                        document.body.classList.add('in-telegram');
                    } catch (err) {
                        console.warn('Ошибка при инициализации внешнего WebApp:', err);
                    }
                    
                    setTelegramInitialized(true);
                } else {
                    console.log('Telegram WebApp не обнаружен, работаем как обычное веб-приложение');
                    sessionStorage.removeItem('is_telegram_webapp');
                    
                    // Проверяем, возможно мы на мобильном устройстве с Telegram
                    const isMobileTelegram = /Telegram/i.test(navigator.userAgent) || 
                                           document.referrer.includes('t.me') || 
                                           window.location.href.includes('tg://');
                    
                    if (isMobileTelegram) {
                        console.log('Обнаружен мобильный Telegram, но WebApp не доступен');
                        document.body.classList.add('in-telegram-mobile');
                        
                        // Если это первая попытка, пробуем еще раз через небольшую задержку
                        if (initializeAttempts < 2) {
                            console.log(`Повторная попытка инициализации (#${initializeAttempts + 1})...`);
                            setTimeout(() => {
                                setInitializeAttempts(prev => prev + 1);
                            }, 800);
                            return;
                        }
                    }
                }
                
                // Восстановление сессии из предыдущего визита
                const isTelegramApp = sessionStorage.getItem('is_telegram_webapp') === 'true';
                                    
                if (isTelegramApp) {
                    // Проверяем, если мы в Telegram, но потеряли состояние аутентификации
                    const hasUserData = sessionStorage.getItem('current_user') || 
                                      sessionStorage.getItem('current_user_id');
                                      
                    if (!hasUserData) {
                        console.log('Обнаружена потеря состояния авторизации в Telegram WebApp, пытаемся восстановить');
                        // Попытка восстановить данные из сохраненных
                        const cachedTelegramUser = sessionStorage.getItem('telegram_last_user') || 
                                                 sessionStorage.getItem('telegramUser');
                                                 
                        if (cachedTelegramUser) {
                            try {
                                const parsedData = JSON.parse(cachedTelegramUser);
                                console.log('Восстанавливаем данные пользователя из кеша:', parsedData);
                                
                                // Сохраняем в sessionStorage
                                sessionStorage.setItem('telegram_last_user', cachedTelegramUser);
                                sessionStorage.setItem('telegramUser', cachedTelegramUser);
                                
                                // Создаем временный ID для быстрой авторизации
                                const telegramId = parsedData.id ? parsedData.id.toString() : '';
                                if (telegramId) {
                                    const userId = `tg_${telegramId}`;
                                    sessionStorage.setItem('current_user_id', userId);
                                }
                            } catch (err) {
                                console.error('Ошибка при восстановлении кешированных данных:', err);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Ошибка при инициализации Telegram WebApp:', error);
            }
        };
        
        initTelegram();
    }, [initializeAttempts]);

    // Инициализация Firebase и проверка соединения
    useEffect(() => {
        console.log('App: useEffect для проверки соединения запущен');
        const checkConnection = async () => {
            try {
                // Проверка соединения с Firebase
                console.log("Проверка соединения с Firebase...");
                const isConnected = await connectionService.checkConnection();

                if (!isConnected) {
                    console.error("Соединение с Firebase отсутствует, пробуем переподключиться...");
                }
            } catch (error) {
                console.error("Ошибка при проверке соединения:", error);
            }
        };

        // Добавляем слушатель изменения состояния соединения
        connectionService.addConnectionListener((status) => {
            setIsConnected(status.connected);
            setConnectionError(status.error);

            if (status.connected) {
                console.log("Соединение с Firebase восстановлено!");
            } else {
                console.error(`Соединение с Firebase потеряно: ${status.error || 'Неизвестная ошибка'}`);
            }
        });

        // Проверяем соединение при загрузке приложения
        checkConnection();

        // Очистка при размонтировании
        return () => {
            // Вызываем метод stopConnectionCheck, который мы добавили
            connectionService.stopConnectionCheck();
        };
    }, []);

    useEffect(() => {
        const initialize = async () => {
            try {
                // Создаем необходимые индексы для Firestore
                try {
                    await createRequiredIndexes();
                    console.log('Индексы Firebase проверены/созданы');
                } catch (indexError) {
                    console.warn('Не удалось автоматически создать индексы Firebase:', indexError);
                }
                
                // Запустить миграцию структуры пользователей
                await migrateUserStructure().catch(error => {
                    console.warn('Ошибка при миграции структуры пользователей:', error);
                });
                
                // Настройка прав администратора для локальной разработки
                try {
                    // Установить права администратора для указанного Telegram ID
                    const targetTelegramId = '5394381166';
                    
                    // Настройка локальных прав администратора
                    await setupLocalAdminRights(targetTelegramId);
                    
                    // Добавить указанный Telegram ID как администратора в любом случае
                    await addAdminByTelegramId(targetTelegramId);
                    
                    // Добавляем конкретного пользователя по UID как администратора
                    const specificUserUID = 'hSv7Bj222hMe13UlsvkQX0Phyaj2';
                    await addAdminByUID(specificUserUID);
                    
                    console.log(`Права администратора установлены для пользователя с UID: ${specificUserUID}`);
                } catch (adminError) {
                    console.warn('Ошибка при настройке прав администратора:', adminError);
                }
            } catch (error) {
                console.error('Ошибка при инициализации приложения:', error);
            }
        };

        initialize();
    }, []);

    // Обработка неперехваченных ошибок
    useEffect(() => {
        const handleError = (event) => {
            console.error('Неперехваченная ошибка:', event.error);
            setError(event.error);
        };

        window.addEventListener('error', handleError);
        
        return () => {
            window.removeEventListener('error', handleError);
        };
    }, []);

    // Обработка компактного режима в Telegram Mini-app
    useEffect(() => {
        // Определяем, находимся ли мы в компактном режиме
        const compact = isCompactMode();
        
        // Добавляем классы для компактного режима
        if (compact) {
            document.documentElement.classList.add('tg-compact-mode');
            document.body.classList.add('tg-compact-mode');
        } else {
            document.documentElement.classList.remove('tg-compact-mode');
            document.body.classList.remove('tg-compact-mode');
        }
        
        // Применяем стили компактного режима
        applyCompactModeStyles();
        
        // Обработчики изменения размера окна
        const handleResize = () => {
            applyCompactModeStyles();
        };
        
        // Слушаем изменения размера окна
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
        
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, []);

    useEffect(() => {
        // Initialize mobile-specific utilities and handlers
        const initializeMobile = () => {
            // Update safe area variables for notched devices
            updateSafeAreaVars();
            
            // Setup keyboard handlers for mobile
            if (isMobileDevice()) {
                const { addListeners, removeListeners } = mobileKeyboardHandlers();
                addListeners();
                
                // Set data attribute on body for mobile-specific styling
                document.body.setAttribute('data-is-mobile', 'true');
                
                // Set viewport height variable for mobile browsers
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
                
                // Add special class for iPhone with notch
                if (isIphoneWithNotch()) {
                    document.body.classList.add('iphone-with-notch');
                }
                
                return () => {
                    removeListeners();
                    document.body.removeAttribute('data-is-mobile');
                    document.body.classList.remove('iphone-with-notch');
                };
            }
        };
        
        const mobileCleanup = initializeMobile();
        
        // Cleanup function
        return () => {
            if (mobileCleanup) mobileCleanup();
        };
    }, []);
    
    useEffect(() => {
        const handleResize = () => {
            // Check compact mode and apply styles
            if (isCompactMode()) {
                applyCompactModeStyles();
            }
            
            // Update safe area variables on resize
            updateSafeAreaVars();
            
            // Set viewport height CSS variable for mobile devices
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
            
            // For mobile devices, adjust when keyboard shows/hides
            if (isMobileDevice() && window.visualViewport) {
                const viewportHeight = window.visualViewport.height;
                document.documentElement.style.setProperty('--viewport-height', `${viewportHeight}px`);
            }
        };
        
        // Initialize resize handler
        handleResize();
        window.addEventListener('resize', handleResize);
        
        // Add viewport event listener for iOS devices
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
            window.visualViewport.addEventListener('scroll', handleResize);
        }
        
        return () => {
            window.removeEventListener('resize', handleResize);
            
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleResize);
                window.visualViewport.removeEventListener('scroll', handleResize);
            }
        };
    }, []);

    return (
        <ToastProvider>
            <NotificationProvider>
                <div className={`app-container ${!isConnected ? 'offline-mode' : ''}`}>
                    {/* Connection status indicator */}
                    {!isConnected && (
                        <div className="connection-status offline">
                            <span className="status-icon">⚠️</span>
                            <span className="status-text">Оффлайн режим. {connectionError && `Ошибка: ${connectionError}`}</span>
                        </div>
                    )}

                    {error ? (
                        <div className="error-fallback">
                            <h2>Произошла ошибка</h2>
                            <p>{error.toString()}</p>
                            <button onClick={() => window.location.reload()}>
                                Перезагрузить приложение
                            </button>
                            {process.env.NODE_ENV === 'development' && (
                                <pre className="error-stack">
                                    {error.stack}
                                </pre>
                            )}
                        </div>
                    ) : (
                        <>
                            <Routes>
                                <Route path="/register" element={<RegistrationForm />} />
                                <Route path="/onboarding" element={<OnboardingTutorial />} />
                                <Route path="/" element={<Navigate to="/home" replace />} />
                                <Route path="/index.html" element={<Navigate to="/home" replace />} />
                                
                                {/* Routes requiring authentication */}
                                <Route path="/home" element={
                                    <ProtectedRoute>
                                        <AppLayout>
                                            <Home />
                                        </AppLayout>
                                    </ProtectedRoute>
                                } />
                                
                                <Route path="/chats" element={
                                    <ProtectedRoute>
                                        <AppLayout>
                                            <ChatsList />
                                        </AppLayout>
                                    </ProtectedRoute>
                                } />
                                
                                <Route path="/chat/:chatId" element={
                                    <ProtectedRoute>
                                        <AppLayout hideNavigation>
                                            <Chat />
                                        </AppLayout>
                                    </ProtectedRoute>
                                } />
                                
                                <Route path="/random-chat" element={
                                    <ProtectedRoute>
                                        <AppLayout>
                                            <RandomChat />
                                        </AppLayout>
                                    </ProtectedRoute>
                                } />
                                
                                <Route path="/profile" element={
                                    <ProtectedRoute>
                                        <AppLayout>
                                            <Profile />
                                        </AppLayout>
                                    </ProtectedRoute>
                                } />
                                
                                <Route path="/groups" element={
                                    <ProtectedRoute>
                                        <AppLayout>
                                            <Groups />
                                        </AppLayout>
                                    </ProtectedRoute>
                                } />
                                
                                <Route path="/groups/:groupId" element={
                                    <ProtectedRoute>
                                        <AppLayout hideNavigation>
                                            <GroupDetail />
                                        </AppLayout>
                                    </ProtectedRoute>
                                } />
                                
                                <Route path="/groups/create" element={
                                    <ProtectedRoute>
                                        <AppLayout hideNavigation>
                                            <GroupCreate />
                                        </AppLayout>
                                    </ProtectedRoute>
                                } />
                                
                                <Route path="/groups/:groupId/edit" element={
                                    <ProtectedRoute>
                                        <AppLayout hideNavigation>
                                            <GroupEdit />
                                        </AppLayout>
                                    </ProtectedRoute>
                                } />
                                
                                <Route path="/guide" element={
                                    <ProtectedRoute>
                                        <AppLayout>
                                            <BeginnerGuide />
                                        </AppLayout>
                                    </ProtectedRoute>
                                } />
                                
                                <Route path="/admin" element={
                                    <ProtectedRoute adminOnly={true}>
                                        <AppLayout>
                                            <Admin />
                                        </AppLayout>
                                    </ProtectedRoute>
                                } />
                                
                                <Route path="/admin/dashboard" element={
                                    <ProtectedRoute adminOnly={true}>
                                        <AppLayout>
                                            <AdminDashboard />
                                        </AppLayout>
                                    </ProtectedRoute>
                                } />
                                
                                <Route path="/admin/support" element={
                                    <ProtectedRoute adminOnly={true}>
                                        <AppLayout hideNavigation>
                                            <AdminSupport />
                                        </AppLayout>
                                    </ProtectedRoute>
                                } />
                                
                                <Route path="/admin/support/:chatId" element={
                                    <ProtectedRoute adminOnly={true}>
                                        <AppLayout hideNavigation>
                                            <AdminSupport />
                                        </AppLayout>
                                    </ProtectedRoute>
                                } />
                                
                                <Route path="/support/diagnostics" element={
                                    <ProtectedRoute>
                                        <AppLayout>
                                            <SupportDiagnostics />
                                        </AppLayout>
                                    </ProtectedRoute>
                                } />
                                
                                <Route path="/friends" element={
                                    <ProtectedRoute>
                                        <AppLayout>
                                            <Friends />
                                        </AppLayout>
                                    </ProtectedRoute>
                                } />
                                
                                <Route path="/admin/config" element={
                                    <ProtectedRoute adminOnly={true}>
                                        <AppLayout>
                                            <AdminConfig />
                                        </AppLayout>
                                    </ProtectedRoute>
                                } />
                                
                                <Route path="/admin-utility" element={<AdminUtility />} />
                                
                                <Route path="/admin/reports" element={
                                    <ProtectedRoute adminOnly={true}>
                                        <AppLayout>
                                            <AdminReports />
                                        </AppLayout>
                                    </ProtectedRoute>
                                } />
                                
                                <Route path="/admin/stats" element={
                                    <ProtectedRoute adminOnly={true}>
                                        <AppLayout>
                                            <AdminStats />
                                        </AppLayout>
                                    </ProtectedRoute>
                                } />
                                
                                <Route path="/admin/users" element={
                                    <ProtectedRoute adminOnly={true}>
                                        <AppLayout>
                                            <AdminUsers />
                                        </AppLayout>
                                    </ProtectedRoute>
                                } />
                                
                                <Route path="*" element={<NotFoundPage />} />
                            </Routes>
                            
                            {/* Компонент для автоматической загрузки индексов */}
                            <IndexLoader />
                        </>
                    )}
                </div>
            </NotificationProvider>
        </ToastProvider>
    );
}

// Обновленный компонент Root для обработки корневого маршрута
const Root = () => {
    const { isAuthenticated, loading, _user } = useContext(UserContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [redirectAttempts, setRedirectAttempts] = useState(0);
    
    console.log('Root компонент загружен. Текущий путь:', location.pathname);
    console.log('Root: isAuthenticated =', isAuthenticated, 'loading =', loading);
    
    // Добавляем безопасный механизм перенаправления с защитой от зацикливания
    useEffect(() => {
        console.log('Root: useEffect для перенаправления запущен');
        
        // Если еще загружается, ждем
        if (loading) {
            console.log('Root: Загрузка еще не завершена, ожидаем...');
            return;
        }

        // Если слишком много попыток перенаправления, значит что-то не так
        if (redirectAttempts > 5) {
            console.error('Root: Слишком много попыток перенаправления. Возможно, есть проблема с маршрутизацией.');
            return;
        }

        // Увеличиваем счетчик попыток
        setRedirectAttempts(prev => prev + 1);

        // Проверяем, находимся ли мы на странице регистрации или onboarding
        const isRegisterPath = location.pathname === '/register' || location.pathname === '/onboarding';
        
        // Используем setTimeout, чтобы дать приложению время на обработку состояния
        const redirectTimer = setTimeout(() => {
            // Перенаправление на соответствующую страницу
            try {
                if (isAuthenticated && isRegisterPath) {
                    // Если пользователь авторизован, но находится на странице регистрации,
                    // перенаправляем его на домашнюю страницу
                    console.log('Пользователь аутентифицирован, но находится на странице регистрации. Перенаправление на /home');
                    navigate('/home', { replace: true });
                } else if (isAuthenticated && location.pathname === '/') {
                    // Если пользователь авторизован и находится на корневой странице
                    console.log('Пользователь аутентифицирован, перенаправление на /home');
                    navigate('/home', { replace: true });
                } else if (!isAuthenticated && !isRegisterPath && location.pathname !== '/') {
                    // Если пользователь не авторизован и не находится на странице регистрации
                    console.log('Пользователь не аутентифицирован, перенаправление на /register');
                    navigate('/register', { replace: true });
                }
            } catch (error) {
                console.error('Root: Ошибка при перенаправлении:', error);
            }
        }, 300);

        return () => {
            clearTimeout(redirectTimer);
        };
    }, [isAuthenticated, loading, navigate, redirectAttempts, location.pathname]);
    
    // Показываем загрузку во время проверки аутентификации
    return (
        <div className="loading-screen">
            <div className="loading-spinner"></div>
            <p>Загрузка приложения...</p>
            {redirectAttempts > 3 && (
                <p className="loading-warning">
                    Загрузка занимает больше времени, чем обычно...
                </p>
            )}
        </div>
    );
};

export { Root };
export default App;
