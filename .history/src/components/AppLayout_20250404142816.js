import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { isWebAppMethodSupported } from '../utils/telegramWebAppUtils';
import { updateTelegramThemeVars, addThemeChangeListener } from '../utils/telegramThemeUtils';

/**
 * Компонент макета приложения
 * Настраивает тему Telegram, заголовки и кнопки
 */
const AppLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Настройка темы Telegram при монтировании
    useEffect(() => {
        // Инициализация темы
        updateTelegramThemeVars();

        // Добавление слушателя изменений темы
        addThemeChangeListener();

        // Расширяем до полного экрана если возможно
        if (typeof WebApp.isExpanded !== 'undefined' && !WebApp.isExpanded && typeof WebApp.expand === 'function') {
            WebApp.expand();
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
            if (isWebAppMethodSupported('setHeaderColor')) {
                WebApp.setHeaderColor(WebApp.colorScheme === 'dark' ? '#282e33' : '#ffffff');
            }

            if (isWebAppMethodSupported('setTitle')) {
                WebApp.setTitle(pageTitle);
            }

            // Устанавливаем кнопку "Назад" для некоторых страниц
            if (location.pathname === '/random-chat') {
                if (WebApp.BackButton && typeof WebApp.BackButton.show === 'function') {
                    WebApp.BackButton.show();
                    const handleBackClick = () => {
                        navigate('/home');
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

    // Фикс для правильного редиректа с /random-chat
    useEffect(() => {
        // Если страница открыта напрямую без флага redirectedFromChats, переадресуем
        if (location.pathname === '/random-chat' && !sessionStorage.getItem('redirectedFromChats')) {
            // Сначала устанавливаем флаг, чтобы избежать бесконечного цикла
            sessionStorage.setItem('redirectedFromChats', 'true');

            // Используем setTimeout, чтобы дать время другим эффектам выполниться
            setTimeout(() => navigate('/home'), 100);
        }
    }, [location.pathname, navigate]);

    return <Outlet />;
};

export default AppLayout;
