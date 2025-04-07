import React, { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';
import PageTransition from './PageTransition';
import { AnimatePresence } from 'framer-motion';
import WebApp from '@twa-dev/sdk';
import useTelegram from '../hooks/useTelegram'; // Добавляем импорт хука
import '../styles/AppLayout.css';

const AppLayout = () => {
    const location = useLocation();
    const { isTelegramApp } = useTelegram(); // Используем созданный хук
    const { WebApp } = window.Telegram || { WebApp: null };
    const { isTelegramTheme, adaptToTelegramTheme } = useTelegram();

    // Добавляем префикс "_" к неиспользуемой переменной
    const _navigate = useNavigate();

    // Вспомогательная функция для проверки поддержки методов WebApp
    const isWebAppMethodSupported = (methodName) => {
        return WebApp && typeof WebApp[methodName] === 'function';
    };

    // Функция для проверки поддержки метода в текущей версии WebApp
    const supportsWebAppMethod = (methodName) => {
        if (!window.Telegram || !window.Telegram.WebApp) return false;

        const webApp = window.Telegram.WebApp;
        const version = webApp.version || '6.0';
        const versionNumber = parseFloat(version);

        // Карта версий, в которых методы были добавлены
        const methodVersionMap = {
            'setHeaderColor': 6.2,
            'setBackgroundColor': 6.2
        };

        return versionNumber >= (methodVersionMap[methodName] || 0);
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

    // Использование Telegram WebApp для установки цветов
    useEffect(() => {
        const setupTelegramWebApp = () => {
            if (!window.Telegram || !window.Telegram.WebApp) return;

            const WebApp = window.Telegram.WebApp;

            // Для безопасной инициализации
            if (typeof WebApp.ready === 'function') {
                WebApp.ready();
            }

            // Установка цветов только если поддерживается версией
            if (supportsWebAppMethod('setHeaderColor')) {
                try {
                    WebApp.setHeaderColor('bg_color');
                } catch (e) {
                    console.warn('Ошибка при установке цвета заголовка:', e);
                }
            }

            if (supportsWebAppMethod('setBackgroundColor')) {
                try {
                    WebApp.setBackgroundColor('bg_color');
                } catch (e) {
                    console.warn('Ошибка при установке цвета фона:', e);
                }
            }
        };

        setupTelegramWebApp();
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

    return (
        <div className="app-container">
            <AnimatePresence mode="wait">
                <PageTransition key={location.pathname}>
                    <main className="page-content">
                        <Outlet />
                    </main>
                </PageTransition>
            </AnimatePresence>

            {/* Используем только один компонент нижней навигации */}
            <BottomNavigation />
        </div>
    );
};

export default AppLayout;
