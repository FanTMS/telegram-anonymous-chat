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
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Инициализируем хранилище для пользователя Telegram если доступно
                if (WebApp && WebApp.initDataUnsafe && WebApp.initDataUnsafe.user) {
                    userStorage.initialize(WebApp.initDataUnsafe.user.id);
                }

                const user = getCurrentUser();

                // Вводим более строгую проверку - пользователь должен существовать
                // и у него должно быть имя, возраст и хотя бы один интерес
                const isValid = user &&
                    user.name &&
                    user.age &&
                    user.interests &&
                    user.interests.length > 0;

                setIsAuthenticated(!!isValid);
            } catch (error) {
                console.error('Ошибка при проверке авторизации:', error);
                setIsAuthenticated(false);
            } finally {
                setIsChecking(false);
            }
        };

        checkAuth();
    }, []);

    // Пока проверяем авторизацию, отображаем загрузку
    if (isChecking) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Если не авторизован, перенаправляем на регистрацию
    if (!isAuthenticated) {
        // Всегда принудительно перенаправляем - без исключений
        return <Navigate to="/registration" state={{ from: location }} replace />;
    }

    // Если авторизован, показываем защищенный контент
    return <>{children}</>;
};
