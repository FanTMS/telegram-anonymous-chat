import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import MainMenu from './MainMenu';
import '../styles/AppLayout.css';
import useAuth from '../hooks/useAuth';

const AppLayout = () => {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    // Устанавливаем правильную высоту viewport для мобильных устройств
    useEffect(() => {
        const setViewportHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
            document.documentElement.style.setProperty('--tg-viewport-height', `${window.innerHeight}px`);
        };

        // Обработчик для клавиатуры
        const handleInputFocus = () => {
            setIsKeyboardVisible(true);
            document.body.classList.add('keyboard-visible');
        };

        const handleInputBlur = () => {
            setIsKeyboardVisible(false);
            document.body.classList.remove('keyboard-visible');
        };

        // Устанавливаем начальную высоту
        setViewportHeight();

        // Подписываемся на события изменения размера и ориентации
        window.addEventListener('resize', setViewportHeight);
        window.addEventListener('orientationchange', setViewportHeight);

        // Слушаем события фокуса и блюра на всех полях ввода
        const inputFields = document.querySelectorAll('input, textarea');
        inputFields.forEach(input => {
            input.addEventListener('focus', handleInputFocus);
            input.addEventListener('blur', handleInputBlur);
        });

        // Дополнительные события для лучшей поддержки iOS
        window.addEventListener('focusin', () => {
            setViewportHeight();
            // На iOS focusin часто означает, что клавиатура появилась
            if (navigator.userAgent.match(/(iPad|iPhone|iPod)/g)) {
                setTimeout(() => {
                    setIsKeyboardVisible(true);
                    document.body.classList.add('keyboard-visible');
                }, 100);
            }
        });

        window.addEventListener('focusout', () => {
            setViewportHeight();
            // Проверяем, что фокус действительно потерян (не на другом поле ввода)
            setTimeout(() => {
                if (document.activeElement.tagName !== 'INPUT' &&
                    document.activeElement.tagName !== 'TEXTAREA') {
                    setIsKeyboardVisible(false);
                    document.body.classList.remove('keyboard-visible');
                }
            }, 100);
        });

        return () => {
            window.removeEventListener('resize', setViewportHeight);
            window.removeEventListener('orientationchange', setViewportHeight);
            window.removeEventListener('focusin', setViewportHeight);
            window.removeEventListener('focusout', setViewportHeight);

            inputFields.forEach(input => {
                input.removeEventListener('focus', handleInputFocus);
                input.removeEventListener('blur', handleInputBlur);
            });
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
        <div className={`app-container ${isKeyboardVisible ? 'keyboard-visible' : ''}`}>
            <div className="app-content">
                <Outlet />
            </div>
            <MainMenu />
        </div>
    );
};

export default AppLayout;
