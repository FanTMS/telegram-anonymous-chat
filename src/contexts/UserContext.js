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
                console.log('UserContext: Проверка авторизации в localStorage');
                
                // Проверяем и current_user_id, и current_user
                const savedUserId = localStorage.getItem('current_user_id');
                const savedUserData = localStorage.getItem('current_user');
                
                if (savedUserData) {
                    // Если есть полные данные пользователя
                    const userData = JSON.parse(savedUserData);
                    console.log('UserContext: Найдены данные пользователя в current_user');
                    setUser(userData);
                } else if (savedUserId) {
                    // Если находим только ID, пытаемся получить полные данные из sessionStorage
                    console.log('UserContext: Найден ID пользователя в current_user_id');
                    const sessionData = sessionStorage.getItem('userData');

                    if (sessionData) {
                        setUser(JSON.parse(sessionData));
                    } else {
                        // В противном случае ставим минимальную информацию
                        setUser({ id: savedUserId, telegramId: savedUserId });
                    }
                } else {
                    console.log('UserContext: Пользователь не найден в localStorage');
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
