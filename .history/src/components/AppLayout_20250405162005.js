import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';
import PageTransition from './PageTransition';
import { AnimatePresence } from 'framer-motion';
import WebApp from '@twa-dev/sdk';
import '../styles/AppLayout.css';

const AppLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();

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
            if (typeof WebApp.isExpanded !== 'undefined' && !WebApp.isExpanded && typeof WebApp.expand === 'function') {
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
        } else if (location.pathname.startsWith('/chat/')) {
            pageTitle = 'Чат';
        } else if (location.pathname === '/chats') {
            pageTitle = 'Мои чаты';
        } else if (location.pathname === '/random-chat') {
            pageTitle = 'Случайный чат';
        } else if (location.pathname === '/profile') {
            pageTitle = 'Мой профиль';
        } else if (location.pathname === '/guide') {
            pageTitle = 'Руководство';
        }

        // Устанавливаем заголовок главного окна
        document.title = pageTitle;

        // Если поддерживается Telegram WebApp, устанавливаем заголовок и цвет
        try {
            if (isWebAppMethodSupported('setHeaderColor')) {
                WebApp.setHeaderColor('#3390EC');
            }
            
            if (isWebAppMethodSupported('setBackgroundColor')) {
                WebApp.setBackgroundColor('#FFFFFF');
            }
            
            if (isWebAppMethodSupported('setTitle')) {
                WebApp.setTitle(pageTitle);
            }
        } catch (error) {
            console.warn('Ошибка при установке заголовка Telegram WebApp:', error);
        }
    }, [location.pathname]);

    return (
        <div className="app-layout">
            <AnimatePresence mode="wait">
                <PageTransition>
                    <main className="app-main-content">
                        <Outlet />
                    </main>
                </PageTransition>
            </AnimatePresence>
            <BottomNavigation />
        </div>
    );
};

export default AppLayout;
