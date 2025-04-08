import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getUnreadNotificationsCount } from '../utils/notificationService';
import { getUnreadChatsCount } from '../utils/chatService';
import '../styles/Navigation.css';

const Navigation = () => {
    const location = useLocation();
    const { user } = useAuth();
    const [unreadNotifications, setUnreadNotifications] = useState(0);
    const [unreadChats, setUnreadChats] = useState(0);

    // Получаем количество непрочитанных уведомлений и чатов
    useEffect(() => {
        if (user && user.id) {
            const fetchUnreadCounts = async () => {
                try {
                    // Получаем количество непрочитанных уведомлений
                    const notificationsCount = await getUnreadNotificationsCount(user.id);
                    setUnreadNotifications(notificationsCount);
                    
                    // Получаем количество непрочитанных чатов
                    const chatsCount = await getUnreadChatsCount(user.id);
                    setUnreadChats(chatsCount);
                } catch (error) {
                    console.error('Ошибка при получении количества непрочитанных уведомлений:', error);
                }
            };

            fetchUnreadCounts();
            
            // Обновляем каждые 30 секунд
            const interval = setInterval(fetchUnreadCounts, 30000);
            
            return () => clearInterval(interval);
        }
    }, [user]);

    return (
        <nav className="app-navigation">
            <Link 
                to="/" 
                className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}
            >
                <div className="nav-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                </div>
                <span className="nav-label">Главная</span>
            </Link>
            
            <Link 
                to="/chats" 
                className={`nav-item ${location.pathname === '/chats' || location.pathname.includes('/chat/') ? 'active' : ''}`}
            >
                <div className="nav-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    </svg>
                    {unreadChats > 0 && (
                        <div className="nav-badge">{unreadChats > 9 ? '9+' : unreadChats}</div>
                    )}
                </div>
                <span className="nav-label">Чаты</span>
            </Link>
            
            <Link 
                to="/friends" 
                className={`nav-item ${location.pathname === '/friends' ? 'active' : ''}`}
            >
                <div className="nav-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                </div>
                <span className="nav-label">Друзья</span>
            </Link>
            
            <Link 
                to="/profile" 
                className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`}
            >
                <div className="nav-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    {unreadNotifications > 0 && (
                        <div className="nav-badge">{unreadNotifications > 9 ? '9+' : unreadNotifications}</div>
                    )}
                </div>
                <span className="nav-label">Профиль</span>
            </Link>
        </nav>
    );
};

export default Navigation; 