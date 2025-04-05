import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import '../styles/MainMenu.css';

const MainMenu = () => {
    const location = useLocation();
    const [newMessages, setNewMessages] = useState(0);

    // Оптимизация для избежания перерисовки
    const isActive = (path) => location.pathname === path;

    // Добавляем эффект волны (ripple) при клике
    const createRipple = (event) => {
        const button = event.currentTarget;
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;

        const ripple = document.createElement('span');
        ripple.style.width = ripple.style.height = `${diameter}px`;
        ripple.style.left = `${event.clientX - (button.getBoundingClientRect().left + radius)}px`;
        ripple.style.top = `${event.clientY - (button.getBoundingClientRect().top + radius)}px`;
        ripple.className = 'ripple';

        const existingRipple = button.querySelector('.ripple');
        if (existingRipple) {
            existingRipple.remove();
        }

        button.appendChild(ripple);

        // Тактильная обратная связь
        if (WebApp && WebApp.HapticFeedback) {
            WebApp.HapticFeedback.impactOccurred('light');
        }

        setTimeout(() => {
            ripple.remove();
        }, 600);
    };

    // Имитируем получение новых сообщений для демонстрации бейджа
    useEffect(() => {
        // Здесь будет логика проверки новых сообщений
        const checkNewMessages = async () => {
            // Это заглушка - в реальном приложении здесь будет API-запрос
            const randomCount = Math.floor(Math.random() * 5);
            setNewMessages(randomCount);
        };

        checkNewMessages();
        const interval = setInterval(checkNewMessages, 60000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="menu-container">
            <div className="menu-wrapper">
                <Link
                    to="/home"
                    className={`menu-item ${isActive('/home') ? 'active' : ''}`}
                    onClick={createRipple}
                >
                    <div className="menu-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M9 22V12H15V22" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span className="menu-text">Главная</span>
                </Link>

                <Link
                    to="/chats"
                    className={`menu-item ${isActive('/chats') ? 'active' : ''}`}
                    onClick={createRipple}
                >
                    <div className="menu-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M21 11.5C21.0034 12.8199 20.6951 14.1219 20.1 15.3C19.3944 16.7118 18.3098 17.8992 16.9674 18.7293C15.6251 19.5594 14.0782 19.9994 12.5 20C11.1801 20.0035 9.87812 19.6951 8.7 19.1L3 21L4.9 15.3C4.30493 14.1219 3.99656 12.8199 4 11.5C4.00061 9.92179 4.44061 8.37488 5.27072 7.03258C6.10083 5.69028 7.28825 4.6056 8.7 3.90003C9.87812 3.30496 11.1801 2.99659 12.5 3.00003H13C15.0843 3.11502 17.053 3.99479 18.5291 5.47089C20.0052 6.94699 20.885 8.91568 21 11V11.5Z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span className="menu-text">Чаты</span>
                    {newMessages > 0 && <span className="menu-badge">{newMessages}</span>}
                </Link>

                <Link
                    to="/random-chat"
                    className={`menu-item ${isActive('/random-chat') ? 'active' : ''}`}
                    onClick={createRipple}
                >
                    <div className="menu-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 4L21 7L18 10" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M21 7H11C8.79086 7 7 8.79086 7 11V11" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M6 20L3 17L6 14" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M3 17H13C15.2091 17 17 15.2091 17 13V13" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span className="menu-text">Найти</span>
                </Link>

                <Link
                    to="/profile"
                    className={`menu-item ${isActive('/profile') ? 'active' : ''}`}
                    onClick={createRipple}
                >
                    <div className="menu-icon">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span className="menu-text">Профиль</span>
                </Link>
            </div>
        </div>
    );
};

export default MainMenu;
