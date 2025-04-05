import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { motion } from 'framer-motion';
import PageTransition from './PageTransition';
import { isWebAppMethodSupported } from '../utils/telegramWebAppUtils';
import '../styles/AppLayout.css';

const AppLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();

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
            if (isWebAppMethodSupported('setHeaderColor')) {
                WebApp.setHeaderColor(WebApp.colorScheme === 'dark' ? '#282e33' : '#ffffff');
            }
            
            if (isWebAppMethodSupported('setTitle')) {
                WebApp.setTitle(pageTitle);
            }
            
            // Устанавливаем кнопку "Назад" для некоторых страниц
            if (location.pathname === '/random-chat' || 
                location.pathname.startsWith('/chat/') || 
                location.pathname === '/guide' || 
                location.pathname === '/profile') {
                
                if (WebApp.BackButton && typeof WebApp.BackButton.show === 'function') {
                    WebApp.BackButton.show();
                    const handleBackClick = () => {
                        navigate(-1);
                    };
                    
                    if (typeof WebApp.BackButton.onClick === 'function') {
                        WebApp.BackButton.onClick(handleBackClick);
                        return () => {
                            if (typeof WebApp.BackButton.offClick === 'function') {
                                WebApp.BackButton.offClick(handleBackClick);
                            }
                            if (typeof WebApp.BackButton.hide === 'function') {
                                WebApp.BackButton.hide();
                            }
                        };
                    }
                }
            } else {
                if (WebApp.BackButton && typeof WebApp.BackButton.isVisible !== 'undefined' &&
                    WebApp.BackButton.isVisible && typeof WebApp.BackButton.hide === 'function') {
                    WebApp.BackButton.hide();
                }
            }
        } catch (error) {
            console.warn('Ошибка при настройке заголовка Telegram:', error);
        }
        
        document.title = pageTitle;
    }, [location.pathname, navigate]);

    return (
        <div className="app-layout">
            {/* Убираем AnimatePresence и используем только PageTransition */}
            <PageTransition>
                <main className="app-content">
                    <Outlet />
                </main>
            </PageTransition>
        </div>
    );
};

export default AppLayout;
