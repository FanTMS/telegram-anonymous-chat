import React, { useState, useEffect, useContext } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { UserContext } from './contexts/UserContext';
import { ToastProvider } from './components/Toast';
import './styles/global.css';

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
import PageTransition from './components/PageTransition';
import OnboardingTutorial from './components/OnboardingTutorial';
import BottomNavigation from './components/BottomNavigation';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import GroupCreate from './pages/GroupCreate';
import GroupEdit from './pages/GroupEdit';
import IndexLoader from './components/IndexLoader';

import './styles/BeginnerGuide.css';
import './App.css';

import { testFirebaseConnection, ensureRequiredCollectionsExist } from './utils/firebaseUtils';
import { isBrowser } from './utils/browserUtils';
import WebApp from '@twa-dev/sdk';
import { getFirestore, collection, doc, setDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { saveUserSession, getUserSession, getUserById } from './utils/authService';
import { initializeApp } from './utils/databaseInitializer';
import connectionService from './utils/firebaseConnectionService';
import { createRequiredIndexes } from './utils/firebaseIndexCreator';

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
const navigationItems = [
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
    const { isAuthenticated, loading, user } = useContext(UserContext);
    const navigate = useNavigate();
    
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            // Перенаправление на регистрацию, если пользователь не авторизован
            navigate('/register', { replace: true });
        }
        
        if (adminOnly && !loading && isAuthenticated && (!user || !user.isAdmin)) {
            // Перенаправление на главную, если пользователь не администратор
            navigate('/home', { replace: true });
        }
    }, [isAuthenticated, loading, navigate, adminOnly, user]);
    
    if (loading) {
        return <div className="loading-screen">Загрузка...</div>;
    }
    
    return isAuthenticated ? children : null;
};

function App() {
    const [isConnected, setIsConnected] = useState(true);
    const [connectionError, setConnectionError] = useState(null);
    const [telegramInitialized, setTelegramInitialized] = useState(false);
    const [error, setError] = useState(null);

    console.log('App компонент инициализирован');

    // Инициализация и настройка Telegram WebApp
    useEffect(() => {
        try {
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
                
                // Сохраняем информацию о том, что мы в Telegram мини-приложении
                localStorage.setItem('is_telegram_webapp', 'true');
                
                setTelegramInitialized(true);
            } else if (typeof WebApp !== 'undefined') {
                console.log('Найден объект WebApp, но не в Telegram.WebApp');
                
                // Попытка использовать внешний WebApp если доступен
                try {
                    if (WebApp.expand) WebApp.expand();
                    if (WebApp.ready) WebApp.ready();
                    localStorage.setItem('is_telegram_webapp', 'true');
                } catch (err) {
                    console.warn('Ошибка при инициализации внешнего WebApp:', err);
                }
                
                setTelegramInitialized(true);
            } else {
                console.log('Telegram WebApp не обнаружен, работаем как обычное веб-приложение');
                localStorage.removeItem('is_telegram_webapp');
            }
            
            // Восстановление сессии из предыдущего визита
            const isTelegramApp = localStorage.getItem('is_telegram_webapp') === 'true';
            if (isTelegramApp) {
                // Проверяем, если мы в Telegram, но потеряли состояние аутентификации
                const hasUserData = localStorage.getItem('current_user') || localStorage.getItem('current_user_id');
                if (!hasUserData) {
                    console.log('Обнаружена потеря состояния авторизации в Telegram WebApp, пытаемся восстановить.');
                    // Попытка восстановить данные из сохраненных
                    const cachedTelegramUser = localStorage.getItem('telegram_last_user') || 
                                              localStorage.getItem('telegram_mobile_user');
                    if (cachedTelegramUser) {
                        try {
                            console.log('Восстанавливаем данные пользователя из кеша.');
                            // Дальнейшая обработка будет в UserContext
                        } catch (err) {
                            console.error('Ошибка при восстановлении кешированных данных:', err);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Ошибка при инициализации Telegram WebApp:', error);
        }
    }, []);

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

    return (
        <ToastProvider>
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
                            
                            <Route path="/admin/support" element={
                                <ProtectedRoute adminOnly={true}>
                                    <AppLayout>
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
                            
                            <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                        
                        {/* Компонент для автоматической загрузки индексов */}
                        <IndexLoader />
                    </>
                )}
            </div>
        </ToastProvider>
    );
}

// Обновленный компонент Root для обработки корневого маршрута
const Root = () => {
    const { isAuthenticated, loading, user } = useContext(UserContext);
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

        // Используем setTimeout, чтобы дать приложению время на обработку состояния
        const redirectTimer = setTimeout(() => {
            // Перенаправление на соответствующую страницу
            try {
                if (isAuthenticated) {
                    console.log('Пользователь аутентифицирован, перенаправление на /home');
                    navigate('/home', { replace: true });
                } else {
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
    }, [isAuthenticated, loading, navigate, redirectAttempts]);
    
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

export default App;
