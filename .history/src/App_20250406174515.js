import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
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
import BottomNavigation from './components/BottomNavigation'; // Добавляем импорт BottomNavigation
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import GroupCreate from './pages/GroupCreate';
import GroupEdit from './pages/GroupEdit';

import './styles/BeginnerGuide.css'; // Добавляем импорт для гарантии загрузки стилей
import './App.css';

import { testFirebaseConnection, ensureRequiredCollectionsExist } from './utils/firebaseUtils';
import { isBrowser } from './utils/browserUtils';
import WebApp from '@twa-dev/sdk';
import { getFirestore, collection, doc, setDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { saveUserSession, getUserSession, getUserById } from './utils/authService';
import { initializeApp } from './utils/databaseInitializer';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showTutorial, setShowTutorial] = useState(false);

    // Инициализация приложения при запуске
    useEffect(() => {
        const initialize = async () => {
            try {
                // Инициализируем приложение (коллекции и т.д.)
                const initResult = await initializeApp();
                console.log('Инициализация приложения:', initResult ? 'успешно' : 'с ошибками');
            } catch (error) {
                console.error('Ошибка при инициализации приложения:', error);
            }
        };

        initialize();
    }, []);

    // Загрузка пользователя из сессии при запуске
    useEffect(() => {
        const checkAuth = async () => {
            try {
                console.log("Запуск проверки авторизации...");

                // Проверяем соединение с Firebase
                try {
                    const isConnected = await testFirebaseConnection();
                    if (!isConnected) {
                        console.error("Не удалось подключиться к Firebase");
                        setLoading(false);
                        return;
                    }
                    console.log("Соединение с Firebase установлено успешно");

                    // Проверяем и создаем необходимые коллекции
                    try {
                        console.log("Проверка необходимых коллекций...");
                        const collectionsStatus = await ensureRequiredCollectionsExist();
                        console.log("Статус коллекций:", collectionsStatus);
                    } catch (collectionError) {
                        console.warn("Ошибка при создании коллекций:", collectionError);
                        // Продолжаем выполнение даже при ошибке создания коллекций
                    }

                    // Проверяем наличие сохраненной сессии
                    const savedUserId = getUserSession();
                    if (savedUserId) {
                        console.log("Найдена сохраненная сессия, загрузка пользователя...");
                        // Получаем данные пользователя по ID
                        const userData = await getUserById(savedUserId);

                        if (userData) {
                            console.log("Пользователь восстановлен из сессии:", userData);
                            setUser(userData);
                            setLoading(false);
                            return;
                        } else {
                            console.log("Сессия найдена, но данные пользователя не обнаружены");
                        }
                    }

                    // Если нет сохраненной сессии или данные не найдены
                    setLoading(false);
                } catch (error) {
                    console.error("Ошибка при проверке аутентификации:", error);
                    setLoading(false);
                }
            } catch (error) {
                console.error("Общая ошибка при проверке авторизации:", error);
                setLoading(false);
            }
        };

        checkAuth();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleRegistration = async (userData) => {
        try {
            console.log("Начало процесса регистрации пользователя...");

            const telegramUser = WebApp.initDataUnsafe?.user;
            let telegramId = telegramUser?.id?.toString();

            // В режиме разработки используем тестовый ID
            if (process.env.NODE_ENV === 'development' && !telegramId) {
                telegramId = "test_user_" + Math.floor(Math.random() * 10000);
                console.warn("Режим разработки: используется тестовый Telegram ID:", telegramId);
            }

            if (!telegramId) {
                throw new Error("Не удалось получить Telegram ID");
            }

            // Проверяем существование пользователя
            console.log("Проверка существования пользователя с Telegram ID:", telegramId);
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("telegramId", "==", telegramId));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Пользователь уже существует
                const existingUser = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
                console.log("Пользователь уже существует:", existingUser);
                setUser(existingUser);

                // Сохраняем ID пользователя в localStorage
                localStorage.setItem('current_user_id', existingUser.id);
                localStorage.removeItem('registration_in_progress');

                // Успешная вибрация
                if (WebApp.HapticFeedback) {
                    WebApp.HapticFeedback.notificationOccurred('success');
                }

                return existingUser;
            }

            // Создаем нового пользователя
            const timestamp = new Date().toISOString();

            // Обогащаем данные пользователя
            const enrichedUserData = {
                ...userData,
                telegramId: telegramId,
                createdAt: timestamp,
                updatedAt: timestamp,
                username: telegramUser?.username || null,
                firstName: telegramUser?.first_name || userData.name || null,
                lastName: telegramUser?.last_name || null,
                isActive: true,
                lastActivity: timestamp,
                settings: {
                    notifications: true,
                    theme: "auto",
                    privacy: "normal"
                }
            };

            console.log("Создание нового пользователя:", enrichedUserData);
            const newUserRef = doc(collection(db, "users"));
            await setDoc(newUserRef, enrichedUserData);

            // Получаем созданного пользователя с ID
            const newUser = {
                id: newUserRef.id,
                ...enrichedUserData
            };

            console.log("Пользователь успешно создан:", newUser);
            setUser(newUser);

            // Сохраняем ID пользователя в localStorage
            localStorage.setItem('current_user_id', newUser.id);
            localStorage.removeItem('registration_in_progress');

            // Сохраняем сессию пользователя
            saveUserSession(newUser.id);

            // Успешная вибрация
            if (WebApp.HapticFeedback) {
                WebApp.HapticFeedback.notificationOccurred('success');
            }

            return newUser;
        } catch (error) {
            console.error("Ошибка при регистрации пользователя:", error);
            localStorage.removeItem('registration_in_progress');

            // Вибрация при ошибке
            if (WebApp.HapticFeedback) {
                WebApp.HapticFeedback.notificationOccurred('error');
            }

            throw error;
        }
    };

    const _handleLogout = () => {
        setUser(null);
        localStorage.removeItem('current_user');
        localStorage.removeItem('current_user_id');
        // Можно добавить редирект на страницу регистрации
    };

    const handleProfileUpdate = () => {
        // Replace with actual profile update handler
    };

    const _handleShowTutorial = () => {
        setShowTutorial(true);
    };

    const handleTutorialComplete = () => {
        setShowTutorial(false);
        localStorage.setItem('tutorial_completed', 'true');
    };

    // Определение элементов навигации
    const navigationItems = [
        {
            path: '/',
            label: 'Главная',
            icon: '🏠'
        },
        {
            path: '/chats',
            label: 'Чаты',
            icon: '💬'
        },
        {
            path: '/groups',
            label: 'Группы',
            icon: '👥',
            includesPaths: ['/groups/']
        },
        {
            path: '/profile',
            label: 'Профиль',
            icon: '👤'
        }
    ];

    return (
        <ToastProvider>
            <UserProvider>
                <Router>
                    <div className="App">
                        {loading ? (
                            <div>Loading...</div>
                        ) : (
                            <>
                                {showTutorial && (
                                    <OnboardingTutorial onComplete={handleTutorialComplete} />
                                )}
                                <Routes>
                                    {!user && (
                                        <Route
                                            path="*"
                                            element={<RegistrationForm onSubmit={handleRegistration} telegramUser={null} isDevelopment={false} />}
                                        />
                                    )}

                                    {user && (
                                        <Route element={<AppLayout />}>
                                            <Route path="/" element={<Navigate to="/home" replace />} />
                                            <Route path="/index.html" element={<Navigate to="/home" replace />} />
                                            <Route path="/home" element={
                                                <PageTransition>
                                                    <Home user={user} />
                                                </PageTransition>
                                            } />
                                            <Route path="/chats" element={
                                                <PageTransition>
                                                    <ChatsList user={user} />
                                                </PageTransition>
                                            } />
                                            <Route path="/chat/:chatId" element={
                                                <PageTransition>
                                                    <Chat user={user} />
                                                </PageTransition>
                                            } />
                                            <Route path="/random-chat" element={
                                                <PageTransition>
                                                    <RandomChat user={user} />
                                                </PageTransition>
                                            } />
                                            <Route path="/profile" element={
                                                <PageTransition>
                                                    <Profile user={user} onUpdate={handleProfileUpdate} />
                                                </PageTransition>
                                            } />
                                            <Route path="/guide" element={
                                                <PageTransition>
                                                    <BeginnerGuide />
                                                </PageTransition>
                                            } />
                                            <Route path="/admin/support" element={<AdminSupport />} />
                                            <Route path="/groups" element={<Groups user={user} />} />
                                            <Route path="/groups/:groupId" element={<GroupDetail user={user} />} />
                                            <Route path="/groups/create" element={<GroupCreate user={user} />} />
                                            <Route path="/groups/:groupId/edit" element={<GroupEdit user={user} />} />
                                            <Route path="*" element={<NotFoundPage />} />
                                        </Route>
                                    )}
                                    <Route path="/diagnostics" element={<SupportDiagnostics />} />
                                </Routes>
                                {user && !loading && (
                                    <BottomNavigation items={navigationItems} />
                                )}
                            </>
                        )}
                    </div>
                </Router>
            </UserProvider>
        </ToastProvider>
    );
}

export default App;
