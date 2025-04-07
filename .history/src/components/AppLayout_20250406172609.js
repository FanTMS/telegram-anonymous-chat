import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';
import './AppLayout.css';
import { useUser } from '../contexts/UserContext';

const AppLayout = () => {
  const { user } = useUser();

  // Определение элементов навигации
  const navigationItems = [
    {
      path: '/',
      label: 'Главная',
      icon: '🏠'
    },
    {
      path: '/chats',
      label: 'Чаты',
      icon: '💬'
    },
    {
      path: '/profile',
      label: 'Профиль',
      icon: '👤'
    },
    {
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
