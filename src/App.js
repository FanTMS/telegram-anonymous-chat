import React, { useState, useEffect, useContext } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { UserContext } from './contexts/UserContext';
import { ToastProvider } from './components/Toast';
import { NotificationProvider } from './contexts/NotificationContext';
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
import Admin from './pages/Admin';
import AdminDashboard from './pages/AdminDashboard';
import AdminConfig from './pages/AdminConfig';
import AdminUtility from './pages/AdminUtility';
import Friends from './pages/Friends';
import AdminReports from './pages/AdminReports';
import AdminStats from './pages/AdminStats';
import AdminUsers from './pages/AdminUsers';

import './styles/BeginnerGuide.css';
import './App.css';

import { testFirebaseConnection, ensureRequiredCollectionsExist } from './utils/firebaseUtils';
import { isBrowser } from './utils/browserUtils';
import WebApp from '@twa-dev/sdk';
import { getFirestore, collection, doc, setDoc, query, where, getDocs, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { saveUserSession, getUserSession, getUserById } from './utils/authService';
import { initializeApp } from './utils/databaseInitializer';
import connectionService from './utils/firebaseConnectionService';
import { createRequiredIndexes } from './utils/firebaseIndexCreator';
import { migrateUserStructure } from './utils/userStructureMigration';
import { setupLocalAdminRights, addAdminByTelegramId, addAdminByUID } from './utils/adminManager';
import { getTelegramUser } from './utils/telegramUtils';
import { isUserAdminByTelegramId, isUserAdminByUID } from './utils/adminManager';
import { auth } from './firebase';

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
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { isAuthenticated, setIsAuthenticated, user, setUser } = useContext(UserContext);
    const location = useLocation();
    const navigate = useNavigate();

    // Initialize Telegram WebApp
    useEffect(() => {
        const initTelegram = async () => {
            try {
                if (isBrowser()) {
                    WebApp.ready();
                    WebApp.expand();
                    
                    // Set viewport height for mobile browsers
                    const setVH = () => {
                        const vh = window.innerHeight * 0.01;
                        document.documentElement.style.setProperty('--vh', `${vh}px`);
                    };
                    
                    setVH();
                    window.addEventListener('resize', setVH);
                    
                    // Enable closing confirmation
                    WebApp.enableClosingConfirmation();
                        
                    // Set header color
                    WebApp.setHeaderColor('#3390ec');
                    
                    // Set background color
                    WebApp.setBackgroundColor('#ffffff');
                    
                    // Set viewport settings for compact mode
                    document.documentElement.style.setProperty('--tg-viewport-height', `${window.innerHeight}px`);
                }
            } catch (error) {
                console.error('Error initializing Telegram WebApp:', error);
            }
        };
        
        initTelegram();
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
            setIsLoading(status.connected);
            setError(status.error);

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

    return (
        <div className="app-container">
        <ToastProvider>
            <NotificationProvider>
                    <PageTransition>
                            <Routes>
                                <Route path="/register" element={<RegistrationForm />} />
                                <Route path="/onboarding" element={<OnboardingTutorial />} />
                                
                            <Route path="/" element={
                                    <ProtectedRoute>
                                        <AppLayout>
                                            <Home />
                                        </AppLayout>
                                    </ProtectedRoute>
                                } />
                                
                                <Route path="/home" element={
                                    <Navigate to="/" replace />
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
                                    <AppLayout>
                                            <Chat />
                                        </AppLayout>
                                    </ProtectedRoute>
                                } />
                                
                            <Route path="/random" element={
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
                                
                            <Route path="/groups/create" element={
                                    <ProtectedRoute>
                                    <AppLayout>
                                        <GroupCreate />
                                        </AppLayout>
                                    </ProtectedRoute>
                                } />
                                
                            <Route path="/groups/:groupId" element={
                                    <ProtectedRoute>
                                    <AppLayout>
                                        <GroupDetail />
                                        </AppLayout>
                                    </ProtectedRoute>
                                } />
                                
                                <Route path="/groups/:groupId/edit" element={
                                    <ProtectedRoute>
                                    <AppLayout>
                                            <GroupEdit />
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
                                
                                <Route path="/guide" element={
                                    <ProtectedRoute>
                                        <AppLayout>
                                            <BeginnerGuide />
                                        </AppLayout>
                                    </ProtectedRoute>
                                } />
                                
                            <Route path="/support" element={
                                <ProtectedRoute>
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
                                
                            <Route path="/admin" element={
                                <ProtectedRoute adminOnly>
                                    <AppLayout>
                                        <Admin />
                                    </AppLayout>
                                </ProtectedRoute>
                            } />
                            
                            <Route path="/admin/dashboard" element={
                                <ProtectedRoute adminOnly>
                                        <AppLayout>
                                        <AdminDashboard />
                                        </AppLayout>
                                    </ProtectedRoute>
                                } />
                                
                                <Route path="/admin/config" element={
                                <ProtectedRoute adminOnly>
                                        <AppLayout>
                                            <AdminConfig />
                                        </AppLayout>
                                    </ProtectedRoute>
                                } />
                                
                            <Route path="/admin/utility" element={
                                <ProtectedRoute adminOnly>
                                    <AppLayout>
                                        <AdminUtility />
                                    </AppLayout>
                                </ProtectedRoute>
                            } />
                                
                                <Route path="/admin/reports" element={
                                <ProtectedRoute adminOnly>
                                        <AppLayout>
                                            <AdminReports />
                                        </AppLayout>
                                    </ProtectedRoute>
                                } />
                                
                                <Route path="/admin/stats" element={
                                <ProtectedRoute adminOnly>
                                        <AppLayout>
                                            <AdminStats />
                                        </AppLayout>
                                    </ProtectedRoute>
                                } />
                                
                                <Route path="/admin/users" element={
                                <ProtectedRoute adminOnly>
                                        <AppLayout>
                                            <AdminUsers />
                                        </AppLayout>
                                    </ProtectedRoute>
                                } />
                                
                                <Route path="*" element={<NotFoundPage />} />
                            </Routes>
                    </PageTransition>
            </NotificationProvider>
        </ToastProvider>
        </div>
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
    
    useEffect(() => {
        console.log('Root: useEffect для перенаправления запущен');
        
        if (loading) {
            console.log('Root: Загрузка еще не завершена, ожидаем...');
            return;
        }

        if (redirectAttempts > 5) {
            console.error('Root: Слишком много попыток перенаправления. Возможно, есть проблема с маршрутизацией.');
            return;
        }

        setRedirectAttempts(prev => prev + 1);

        const isRegisterPath = location.pathname === '/register' || location.pathname === '/onboarding';
        
        const redirectTimer = setTimeout(() => {
            try {
                if (isAuthenticated && isRegisterPath) {
                    console.log('Пользователь аутентифицирован, но находится на странице регистрации. Перенаправление на /');
                    navigate('/', { replace: true });
                } else if (!isAuthenticated && !isRegisterPath && location.pathname !== '/') {
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
    }, [isAuthenticated, loading, location.pathname, navigate, redirectAttempts]);
    
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
