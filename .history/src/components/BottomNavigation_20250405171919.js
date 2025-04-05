import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/BottomNavigation.css';

const BottomNavigation = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [rippleEffect, setRippleEffect] = useState({ id: '', x: 0, y: 0, animate: false });

    // Определение активного пути
    const isActive = (path) => {
        return location.pathname === path ||
            (path === '/home' && location.pathname === '/') ||
            (path !== '/home' && location.pathname.startsWith(path));
    };

    // Обработчик нажатия с эффектом ripple
    const handleNavClick = (path, e) => {
        // Создаем ripple эффект
        const button = e.currentTarget;
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        setRippleEffect({
            id: path,
            x,
            y,
            animate: true
        });
        
        // Задержка для анимации
        setTimeout(() => {
            navigate(path);
            
            // Сбрасываем ripple-эффект
            setTimeout(() => {
                setRippleEffect({ id: '', x: 0, y: 0, animate: false });
            }, 300);
        }, 150);
        
        // Запускаем тактильный отклик если доступен
        try {
            if (window.TelegramWebApp && window.TelegramWebApp.HapticFeedback) {
                window.TelegramWebApp.HapticFeedback.impactOccurred('light');
            }
        } catch (e) {
            console.warn('Haptic feedback not available', e);
        }
    };

    return (
        <div className="bottom-navigation">
            <div
                className={`nav-item ${isActive('/home') ? 'active' : ''}`}
                onClick={(e) => handleNavClick('/home', e)}
            >
                <div className="nav-icon-container">
                    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" 
                            strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="9 22 9 12 15 12 15 22" 
                            strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {rippleEffect.id === '/home' && rippleEffect.animate && (
                        <span 
                            className="ripple" 
                            style={{ 
                                left: rippleEffect.x + 'px', 
                                top: rippleEffect.y + 'px'
                            }}
                        />
                    )}
                </div>
                <span className="nav-label">Главная</span>
            </div>

            <div
                className={`nav-item ${isActive('/chats') ? 'active' : ''}`}
                onClick={(e) => handleNavClick('/chats', e)}
            >
                <div className="nav-icon-container">
                    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1-2-2h14a2 2 0 0 1-2 2z" 
                            strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="9" y1="10" x2="15" y2="10" 
                            strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {rippleEffect.id === '/chats' && rippleEffect.animate && (
                        <span 
                            className="ripple" 
                            style={{ 
                                left: rippleEffect.x + 'px', 
                                top: rippleEffect.y + 'px'
                            }}
                        />
                    )}
                </div>
                <span className="nav-label">Чаты</span>
            </div>

            <div
                className={`nav-item ${isActive('/random-chat') ? 'active' : ''}`}
                onClick={(e) => handleNavClick('/random-chat', e)}
            >
                <div className="nav-icon-container">
                    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 14s1.5 2 4 2 4-2 4-2" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="9" y1="9" x2="9.01" y2="9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
                        <line x1="15" y1="9" x2="15.01" y2="9" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"/>
                    </svg>
                    {rippleEffect.id === '/random-chat' && rippleEffect.animate && (
                        <span 
                            className="ripple" 
                            style={{ 
                                left: rippleEffect.x + 'px', 
                                top: rippleEffect.y + 'px'
                            }}
                        />
                    )}
                </div>
                <span className="nav-label">Поиск</span>
            </div>

            <div
                className={`nav-item ${isActive('/profile') ? 'active' : ''}`}
                onClick={(e) => handleNavClick('/profile', e)}
            >
                <div className="nav-icon-container">
                    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" 
                            strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="7" r="4" 
                            strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {rippleEffect.id === '/profile' && rippleEffect.animate && (
                        <span 
                            className="ripple" 
                            style={{ 
                                left: rippleEffect.x + 'px', 
                                top: rippleEffect.y + 'px'
                            }}
                        />
                    )}
                </div>
                <span className="nav-label">Профиль</span>
            </div>
        </div>
    );
};

export default BottomNavigation;
