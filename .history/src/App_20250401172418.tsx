import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import InterestsPage from './pages/InterestsPage';
import HomePage from './pages/HomePage';
import ChatsPage from './pages/ChatsPage';
import ChatPage from './pages/ChatPage';
import { auth } from './firebase';
import { User } from 'firebase/auth';
import { Box, Spinner, Center, Text } from '@chakra-ui/react';
import { telegramApp } from './telegram';

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Проверяем, есть ли сессия пользователя
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            setLoading(false);

            // Логирование для отладки
            console.log('Текущий маршрут:', location.pathname);
            console.log('Статус авторизации:', currentUser ? 'авторизован' : 'не авторизован');

            // Если пользователь авторизован и находится на странице логина/регистрации,
            // перенаправляем на главную
            if (currentUser && ['/login', '/register', '/'].includes(location.pathname)) {
                navigate('/home');
            }
        });

        return () => unsubscribe();
    }, [navigate, location.pathname]);

    // Расширяем WebApp для лучшего отображения
    useEffect(() => {
        if (telegramApp) {
            telegramApp.expand();
            telegramApp.ready();
        }
    }, []);

    // Защищенный маршрут
    const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
        if (loading) {
            return (
                <Center h="100vh">
                    <Box textAlign="center">
                        <Spinner size="xl" color="blue.500" mb={4} />
                        <Text>Загрузка...</Text>
                    </Box>
                </Center>
            );
        }

        if (!user) {
            return <Navigate to="/login" />;
        }

        return <>{children}</>;
    };

    if (loading) {
        return (
            <Center h="100vh">
                <Box textAlign="center">
                    <Spinner size="xl" color="blue.500" mb={4} />
                    <Text>Загрузка приложения...</Text>
                </Box>
            </Center>
        );
    }

    return (
        <Box minH="100vh" bg="var(--tg-theme-bg-color, white)">
            <Routes>
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/interests" element={
                    <ProtectedRoute>
                        <InterestsPage />
                    </ProtectedRoute>
                } />
                <Route path="/home" element={
                    <ProtectedRoute>
                        <HomePage />
                    </ProtectedRoute>
                } />
                <Route path="/chats" element={
                    <ProtectedRoute>
                        <ChatsPage />
                    </ProtectedRoute>
                } />
                <Route path="/chat/:chatId" element={
                    <ProtectedRoute>
                        <ChatPage />
                    </ProtectedRoute>
                } />
                {/* Явное перенаправление с корневого пути */}
                <Route path="/" element={<Navigate to={user ? "/home" : "/login"} />} />
                <Route path="*" element={<Navigate to={user ? "/home" : "/login"} />} />
            </Routes>
        </Box>
    );
};

export default App;
