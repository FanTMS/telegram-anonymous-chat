import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import PageTransition from './PageTransition';
import '../styles/AppLayout.css';

const AppLayout = () => {
    const location = useLocation();

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
            if (WebApp.isExpanded !== undefined && !WebApp.isExpanded) {
                WebApp.expand();
            }
        } catch (error) {
            console.warn('Ошибка при настройке темы Telegram:', error);
        }
    }, []);

    // Устанавливаем заголовок страницы в зависимости от текущего пути
    useEffect(() => {
        let pageTitle = 'Анонимный чат';

        if (location.pathname === '/home') {
            pageTitle = 'Главная';
        } else if (location.pathname.startsWith('/chat/')) {
            pageTitle = 'Чат';
        } else if (location.pathname === '/random-chat') {
            pageTitle = 'Поиск собеседника';
        } else if (location.pathname === '/chats') {
            pageTitle = 'Мои чаты';
        } else if (location.pathname === '/profile') {
            pageTitle = 'Мой профиль';
        } else if (location.pathname === '/guide') {
            pageTitle = 'Руководство';
        }

        // Устанавливаем заголовок в Telegram WebApp
        try {
            if (WebApp && WebApp.setHeaderColor) {
                WebApp.setHeaderColor(WebApp.colorScheme === 'dark' ? '#282e33' : '#ffffff');
            }

            if (WebApp && WebApp.setTitle) {
                WebApp.setTitle(pageTitle);
            }
        } catch (error) {
            console.warn('Ошибка при настройке заголовка Telegram:', error);
        }

        document.title = pageTitle;
    }, [location.pathname]);

    return (
        <div className="app-layout">
            <PageTransition>
                <main className="app-content" key={location.pathname}>
                    <Outlet />
                </main>
            </PageTransition>
        </div>
    );
};

export default AppLayout;
