import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/BottomNavigation.css';

const BottomNavigation = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path ||
            (path === '/home' && location.pathname === '/') ||
            (path !== '/home' && location.pathname.startsWith(path));
    };

    return (
        <div className="bottom-navigation">
            <div
                className={`nav-item ${isActive('/home') ? 'active' : ''}`}
                onClick={() => navigate('/home')}
            >
                <span className="nav-icon">🏠</span>
                <span className="nav-label">Главная</span>
            </div>

            <div
                className={`nav-item ${isActive('/chats') ? 'active' : ''}`}
                onClick={() => navigate('/chats')}
            >
                <span className="nav-icon">💬</span>
                <span className="nav-label">Чаты</span>
            </div>

            <div
                className={`nav-item ${isActive('/random-chat') ? 'active' : ''}`}
                onClick={() => navigate('/random-chat')}
            >
                <span className="nav-icon">🎲</span>
                <span className="nav-label">Случайный</span>
            </div>

            <div
                className={`nav-item ${isActive('/profile') ? 'active' : ''}`}
                onClick={() => navigate('/profile')}
            >
                <span className="nav-icon">👤</span>
                <span className="nav-label">Профиль</span>
            </div>
        </div>
    );
};

export default BottomNavigation;
