import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../utils/user';
import { userStorage } from '../utils/userStorage';
import WebApp from '@twa-dev/sdk';

interface RequireAuthProps {
    children: React.ReactNode;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
    const location = useLocation();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Инициализируем хранилище для пользователя Telegram если доступно
                if (WebApp && WebApp.initDataUnsafe && WebApp.initDataUnsafe.user) {
                    userStorage.initialize(WebApp.initDataUnsafe.user.id);
                }

                const user = getCurrentUser();
                setIsAuthenticated(!!user);
            } catch (error) {
                console.error('Ошибка при проверке авторизации:', error);
                setIsAuthenticated(false);
            }
        };

        checkAuth();
    }, []);

    // Пока проверяем авторизацию, отображаем загрузку
    if (isAuthenticated === null) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Если не авторизован, перенаправляем на регистрацию
    if (!isAuthenticated) {
        return <Navigate to="/registration" state={{ from: location }} replace />;
    }

    // Если авторизован, показываем защищенный контент
    return <>{children}</>;
};
