import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import InterestsPage from './pages/InterestsPage';
import { auth } from './firebase';
import { User } from 'firebase/auth';
import { ChakraProvider } from '@chakra-ui/react';
import HomePage from './pages/HomePage';
import ChatsPage from './pages/ChatsPage';
import ChatPage from './pages/ChatPage';

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Защищенный маршрут
    const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
        if (loading) return <div>Загрузка...</div>;

        if (!user) {
            return <Navigate to="/login" />;
        }

        return <>{children}</>;
    };

    if (loading) {
        return <div>Загрузка...</div>;
    }

    return (
        <ChakraProvider>
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
                <Route path="*" element={<Navigate to={user ? "/home" : "/login"} />} />
            </Routes>
        </ChakraProvider>
    );
};

export default App;
