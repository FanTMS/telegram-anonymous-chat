import React, { useEffect } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import MainMenu from './MainMenu';
import '../styles/AppLayout.css';
import useAuth from '../hooks/useAuth';

const AppLayout = () => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    // Устанавливаем правильную высоту viewport для мобильных устройств
    useEffect(() => {
        const setViewportHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
            document.documentElement.style.setProperty('--tg-viewport-height', `${window.innerHeight}px`);
        };

        // Устанавливаем начальную высоту
        setViewportHeight();

        // Подписываемся на события изменения размера и ориентации
        window.addEventListener('resize', setViewportHeight);
        window.addEventListener('orientationchange', setViewportHeight);

        // Дополнительные события для лучшей поддержки iOS
        window.addEventListener('focusin', setViewportHeight);
        window.addEventListener('focusout', setViewportHeight);

        return () => {
            window.removeEventListener('resize', setViewportHeight);
            window.removeEventListener('orientationchange', setViewportHeight);
            window.removeEventListener('focusin', setViewportHeight);
            window.removeEventListener('focusout', setViewportHeight);
        };
    }, []);

    // Убедимся, что мы не в процессе загрузки
    if (loading) {
        return <div className="app-loading">Загрузка...</div>;
    }

    // Перенаправляем неаутентифицированных пользователей на страницу регистрации
    if (!isAuthenticated && location.pathname !== '/register') {
        return <Navigate to="/register" />;
    }

    // Отображение для публичного доступа или для аутентифицированных пользователей
    return (
        <div className="app-container">
            <div className="app-content">
                <Outlet />
            </div>
            <MainMenu />
        </div>
    );
};

export default AppLayout;
