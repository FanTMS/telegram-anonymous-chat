import React from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import MainMenu from './MainMenu';
import '../styles/AppLayout.css';
import useAuth from '../hooks/useAuth';

const AppLayout = () => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

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
