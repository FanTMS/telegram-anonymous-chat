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
import BottomNavigation from './components/BottomNavigation';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import GroupCreate from './pages/GroupCreate';
import GroupEdit from './pages/GroupEdit';

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

function App() {
    const [isConnected, setIsConnected] = useState(true);
    const [connectionError, setConnectionError] = useState(null);

    // Инициализация Firebase и проверка соединения
    useEffect(() => {
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

    return (
        <Router>
            <UserProvider>
                <ToastProvider>
                    <div className="app">
                        {/* Показываем сообщение о статусе соединения при необходимости */}
                        {!isConnected && (
                            <div style={{
                                position: 'fixed',
                                top: '0',
                                left: '0',
                                right: '0',
                                padding: '10px',
                                background: 'rgba(255, 59, 48, 0.9)',
                                color: 'white',
                                textAlign: 'center',
                                zIndex: 9999
                            }}>
                                Соединение с базой данных потеряно. Пытаемся восстановить...
                            </div>
                        )}

                        <Routes>
                            {/* Авторизация/регистрация */}
                            <Route path="/register" element={<RegistrationForm />} />
                            <Route path="/onboarding" element={<OnboardingTutorial />} />

                            {/* Основные маршруты внутри AppLayout */}
                            <Route path="/" element={<AppLayout />}>
                                <Route path="/" element={<Navigate to="/home" replace />} />
                                <Route path="/index.html" element={<Navigate to="/home" replace />} />
                                <Route path="/home" element={
                                    <PageTransition>
                                        <Home />
                                    </PageTransition>
                                } />
                                <Route path="/chats" element={
                                    <PageTransition>
                                        <ChatsList />
                                    </PageTransition>
                                } />
                                <Route path="/chat/:chatId" element={
                                    <PageTransition>
                                        <Chat />
                                    </PageTransition>
                                } />
                                <Route path="/random-chat" element={
                                    <PageTransition>
                                        <RandomChat />
                                    </PageTransition>
                                } />
                                <Route path="/profile" element={
                                    <PageTransition>
                                        <Profile />
                                    </PageTransition>
                                } />
                                <Route path="/guide" element={
                                    <PageTransition>
                                        <BeginnerGuide />
                                    </PageTransition>
                                } />
                                <Route path="/admin/support" element={<AdminSupport />} />
                                <Route path="/groups" element={<Groups />} />
                                <Route path="/groups/:groupId" element={<GroupDetail />} />
                                <Route path="/groups/create" element={<GroupCreate />} />
                                <Route path="/groups/:groupId/edit" element={<GroupEdit />} />
                                <Route path="*" element={<NotFoundPage />} />
                            </Route>
                            <Route path="/diagnostics" element={<SupportDiagnostics />} />
                        </Routes>

                        {/* Навигация должна быть внутри div с классом app, но за пределами Routes */}
                        <BottomNavigation items={navigationItems} />
                    </div>
                </ToastProvider>
            </UserProvider>
        </Router>
    );
}

export default App;
