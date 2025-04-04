import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import '../styles/MainMenu.css';

const MainMenu = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isExpanded, setIsExpanded] = useState(false);

    // Определение активного раздела
    const isActive = (path) => {
        // Если мы на главной странице ("/"), то активным должен быть раздел "home"
        if (location.pathname === "/" && path === "/home") {
            return true;
        }
        return location.pathname === path;
    };

    // Обработка навигационных событий
    const handleNavigate = (path) => {
        // Тактильный отклик при нажатии
        if (WebApp.HapticFeedback) {
            WebApp.HapticFeedback.impactOccurred('light');
        }
        
        navigate(path);
        setIsExpanded(false);
    };

    // Закрытие меню при клике вне его области
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isExpanded && !event.target.closest('.main-menu-container')) {
                setIsExpanded(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isExpanded]);

    return (
        <div className="bottom-menu-container">
            <div className="bottom-menu">
                <div 
                    className={`menu-item ${isActive('/home') ? 'active' : ''}`}
                    onClick={() => handleNavigate('/home')}
                >
                    <div className="menu-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M9 22V12H15V22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span className="menu-text">Главная</span>
                </div>

                <div 
                    className={`menu-item ${isActive('/chats') ? 'active' : ''}`}
                    onClick={() => handleNavigate('/chats')}
                >
                    <div className="menu-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 5H21V19H6L3 22V5Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M8 10H16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M8 14H13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span className="menu-text">Чаты</span>
                </div>

                <div
                    className={`menu-item ${isActive('/random-chat') ? 'active' : ''}`}
                    onClick={() => handleNavigate('/random-chat')}
                >
                    <div className="menu-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M7 8C7 8 9.5 6 12 6C14.5 6 17 8 17 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12 14C10.5955 14 9.42905 14.5276 8.61681 15.1256" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M17 18H12L14 15H12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span className="menu-text">Поиск собеседника</span>
                </div>

                <div
                    className={`menu-item ${isActive('/profile') ? 'active' : ''}`}
                    onClick={() => handleNavigate('/profile')}
                >
                    <div className="menu-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span className="menu-text">Профиль</span>
                </div>
            </div>
        </div>
    );
};

export default MainMenu;
