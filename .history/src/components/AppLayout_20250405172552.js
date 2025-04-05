import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';
import PageTransition from './PageTransition';
import { AnimatePresence } from 'framer-motion';
import WebApp from '@twa-dev/sdk';
import '../styles/AppLayout.css';

const AppLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    
    // Проверяем, выполнен ли вход пользователя
    const registeredUser = localStorage.getItem('registeredUser');
    const isAuthenticated = !!registeredUser;

    // Вспомогательная функция для проверки поддержки методов WebApp
    const isWebAppMethodSupported = (methodName) => {
        return WebApp && typeof WebApp[methodName] === 'function';
    };

    // Устанавливаем тему в зависимости от темы Telegram
    useEffect(() => {
        try {
            const isDarkMode = WebApp.colorScheme === 'dark';
            document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');

            // Адаптируем цвета под тему Telegram
            document.documentElement.style.setProperty('--tg-theme-bg-color', WebApp.backgroundColor);
            document.documentElement.style.setProperty('--tg-theme-text-color', WebApp.textColor);
            document.documentElement.style.setProperty('--tg-theme-hint-color', WebApp.subtitleColor || '#999999');
            document.documentElement.style.setProperty('--tg-theme-button-color', WebApp.buttonColor);
            document.documentElement.style.setProperty('--tg-theme-button-text-color', WebApp.buttonTextColor);
            document.documentElement.style.setProperty('--tg-theme-secondary-bg-color', WebApp.secondaryBackgroundColor);

            // Расширяем до полного экрана если возможно
            if (isWebAppMethodSupported('isExpanded') && !WebApp.isExpanded && isWebAppMethodSupported('expand')) {
                WebApp.expand();
            }
        } catch (error) {
            console.warn('Ошибка при настройке темы Telegram:', error);
        }
    }, []);

    // Устанавливаем заголовок страницы в зависимости от текущего пути
    useEffect(() => {
        let pageTitle = 'Анонимный чат';

        if (location.pathname === '/' || location.pathname === '/home') {
            pageTitle = 'Главная';
        } else if (location.pathname === '/chats') {
            pageTitle = 'Мои чаты';
        } else if (location.pathname.startsWith('/chat/')) {
            pageTitle = 'Чат';
        } else if (location.pathname === '/random-chat') {
            pageTitle = 'Случайный собеседник';
        } else if (location.pathname === '/profile') {
            pageTitle = 'Профиль';
        } else if (location.pathname === '/settings') {
            pageTitle = 'Настройки';
        } else if (location.pathname === '/guide') {
            pageTitle = 'Руководство';
        }

        // Устанавливаем заголовок в Telegram WebApp
        if (isWebAppMethodSupported('setHeaderColor')) {
            WebApp.setHeaderColor('secondary_bg_color');
        }
        if (isWebAppMethodSupported('setBackgroundColor')) {
            WebApp.setBackgroundColor('secondary_bg_color');
        }
        if (isWebAppMethodSupported('setTitle')) {
            WebApp.setTitle(pageTitle);
        }
        
        // Устанавливаем обычный заголовок страницы
        document.title = pageTitle;
    }, [location]);
    
    // Обработка отображения клавиатуры
    useEffect(() => {
        const handleKeyboardVisibility = () => {
            // Проверяем, изменился ли размер окна из-за клавиатуры
            const isKeyboard = window.innerHeight < window.outerHeight * 0.75;
            setIsKeyboardVisible(isKeyboard);
        };
        
        window.addEventListener('resize', handleKeyboardVisibility);
        return () => window.removeEventListener('resize', handleKeyboardVisibility);
    }, []);

    // Проверяем перенаправление с руководства
    useEffect(() => {
        if (location.pathname === '/guide') {
            console.log('Загрузка страницы руководства...');
            // Запрашиваем обновление контента
            // Это заставит React перерисовать компонент
        }
    }, [location.pathname]);

    // Перенаправляем неаутентифицированных пользователей на страницу регистрации
    if (!isAuthenticated && location.pathname !== '/register') {
        console.log('Пользователь не аутентифицирован. Перенаправление на регистрацию.');
        return <Navigate to="/register" replace />;
    }

    return (
        <div className={`app-container ${isKeyboardVisible ? 'keyboard-visible' : ''}`}>
            <AnimatePresence mode="wait">
                <PageTransition key={location.pathname}>
                    <main className="page-content">
                        <Outlet />
                    </main>
                </PageTransition>
            </AnimatePresence>
            
            <BottomNavigation />
        </div>
    );
};

export default AppLayout;
