import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { safeHapticFeedback } from '../utils/telegramWebAppUtils';
import '../styles/MainMenu.css';

const MainMenu = () => {
    const location = useLocation();

    // Улучшенная проверка активного пути с поддержкой вложенных путей
    const isActive = (path) => {
        if (path === '/home' && location.pathname === '/') {
            return true;
        }

        if (path === '/chats' && location.pathname.startsWith('/chat/')) {
            return true;
        }

        return location.pathname === path ||
            (path !== '/' && location.pathname.startsWith(`${path}/`));
    };

    // Обработка нажатия на пункт меню с улучшенной тактильной обратной связью
    const handleMenuClick = (isAlreadyActive) => {
        // Если нажат уже активный пункт - одна вибрация, если новый - другая
        if (isAlreadyActive) {
            safeHapticFeedback('impact', 'light');
        } else {
            safeHapticFeedback('selection');
        }
    };

    return (
        <div className="main-menu">
            <div className="main-menu-content">
                <Link
                    to="/home"
                    className={`menu-item ${isActive('/home') ? 'active' : ''}`}
                    onClick={() => handleMenuClick(isActive('/home'))}
                >
                    <div className="menu-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor">
                            <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M9 22V12H15V22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span className="menu-text">Главная</span>
                </Link>

                <Link
                    to="/chats"
                    className={`menu-item ${isActive('/chats') ? 'active' : ''}`}
                    onClick={() => handleMenuClick(isActive('/chats'))}
                >
                    <div className="menu-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor">
                            <path d="M3 5H21V19H6L3 22V5З" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M8 10H16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M8 14H13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span className="menu-text">Чаты</span>
                </Link>

                <Link
                    to="/random-chat"
                    className={`menu-item ${isActive('/random-chat') ? 'active' : ''}`}
                    onClick={() => handleMenuClick(isActive('/random-chat'))}
                >
                    <div className="menu-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor">
                            <path d="M18 4L6 12L18 20V4З" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span className="menu-text">Поиск</span>
                </Link>

                <Link
                    to="/profile"
                    className={`menu-item ${isActive('/profile') ? 'active' : ''}`}
                    onClick={() => handleMenuClick(isActive('/profile'))}
                >
                    <div className="menu-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor">
                            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span className="menu-text">Профиль</span>
                </Link>
            </div>
        </div>
    );
};

export default MainMenu;
