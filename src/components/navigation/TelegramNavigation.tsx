import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';

interface NavigationItem {
    name: string;
    path: string;
    icon: string;
    badge?: number;
}

interface TelegramNavigationProps {
    className?: string;
}

export const TelegramNavigation: React.FC<TelegramNavigationProps> = ({ className = '' }) => {
    const location = useLocation();
    const [colorScheme, setColorScheme] = useState<'light' | 'dark'>(
        WebApp.colorScheme === 'dark' ? 'dark' : 'light'
    );

    // Обновляем цветовую схему при изменении темы Telegram
    useEffect(() => {
        const handleThemeChange = () => {
            setColorScheme(WebApp.colorScheme === 'dark' ? 'dark' : 'light');
        };

        // Устанавливаем обработчик события изменения темы (если бы такое событие существовало)
        // В реальном приложении могут быть другие способы отслеживания изменения темы

        return () => {
            // Очистка обработчика при размонтировании компонента
        };
    }, []);

    // Основные пункты навигации
    const navigationItems: NavigationItem[] = [
        { name: 'Чаты', path: '/chats', icon: '💬' },
        { name: 'Контакты', path: '/contacts', icon: '👥' },
        { name: 'Поиск', path: '/search', icon: '🔍' },
        { name: 'Профиль', path: '/profile', icon: '👤' },
        { name: 'Бот', path: '/bot-chat', icon: '🤖' },
    ];

    return (
        <nav className={`telegram-navigation ${colorScheme} ${className}`}>
            <div className="navigation-container">
                {navigationItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                        >
                            <div className="nav-icon">{item.icon}</div>
                            <div className="nav-label">{item.name}</div>
                            {item.badge && item.badge > 0 && (
                                <div className="nav-badge">{item.badge}</div>
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};
