import React, { createContext, useState, useEffect } from 'react';

// Создаем контекст с дефолтными значениями
export const UserContext = createContext({
    user: null,
    setUser: () => { },
    isAuthenticated: false,
    loading: true
});

// Провайдер контекста, который будет оборачивать приложение
export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Проверка авторизации при загрузке
    useEffect(() => {
        // Пытаемся получить данные пользователя из localStorage
        const loadUser = () => {
            try {
                const savedUserId = localStorage.getItem('current_user_id');
                if (savedUserId) {
                    // Если находим ID, пытаемся получить полные данные из sessionStorage
                    const userData = sessionStorage.getItem('userData');

                    if (userData) {
                        setUser(JSON.parse(userData));
                    } else {
                        // В противном случае ставим минимальную информацию
                        setUser({ id: savedUserId, telegramId: savedUserId });
                    }
                }
            } catch (error) {
                console.error('Ошибка при загрузке данных пользователя:', error);
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    // Определяем, авторизован ли пользователь
    const isAuthenticated = !!user;

    // Значение контекста
    const contextValue = {
        user,
        setUser,
        isAuthenticated,
        loading
    };

    return (
        <UserContext.Provider value={contextValue}>
            {children}
        </UserContext.Provider>
    );
};
