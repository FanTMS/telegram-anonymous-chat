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
        // Если мы на главной странице ("/"), то активным должен быть раздел "chats"
        if (location.pathname === "/" && path === "/chats") {
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
        <>
            {/* Подложка при открытом меню */}
            {isExpanded && <div className="menu-backdrop" onClick={() => setIsExpanded(false)} />}

            {/* Меню */}
            <div className={`main-menu-container ${isExpanded ? 'expanded' : ''}`}>
                <div className="main-menu-toggle" onClick={() => setIsExpanded(!isExpanded)}>
                    <div className={`menu-icon ${isExpanded ? 'active' : ''}`}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>

                <div className="main-menu-items">
                    <div
                        className={`menu-item ${isActive('/chats') ? 'active' : ''}`}
                        onClick={() => handleNavigate('/chats')}
                    >
                        <div className="menu-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M8 9H16M8 13H12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                                <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.18 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.18 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

                    <div
                        className={`menu-item ${isActive('/guide') ? 'active' : ''}`}
                        onClick={() => handleNavigate('/guide')}
                    >
                        <div className="menu-icon">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M12 8V12M12 16H12.01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span className="menu-text">Руководство</span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MainMenu;
