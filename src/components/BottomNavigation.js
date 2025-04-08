import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useNotifications } from '../contexts/NotificationContext';

// Контейнер для навигации с безопасной зоной
const NavigationContainer = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  width: 100%;
  height: var(--app-footer-height);
  background-color: var(--tg-theme-bg-color, #fff);
  border-top: 1px solid var(--tg-theme-secondary-bg-color);
  z-index: 1000;
  padding-bottom: env(safe-area-inset-bottom, 0);
`;

const NavItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  flex: 1;
  cursor: pointer;
  transition: all 0.2s ease;
  color: ${props => props.$active ? 'var(--tg-theme-button-color, #2481cc)' : 'var(--tg-theme-hint-color, #999)'};
  position: relative;
  padding: var(--app-spacing-xs) 0;
  
  &:active {
    opacity: 0.7;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 2px;
    width: 3px;
    height: 3px;
    border-radius: 2px;
    background-color: var(--tg-theme-button-color, #2481cc);
    opacity: ${props => props.$active ? 1 : 0};
    transform: scale(${props => props.$active ? 1 : 0});
    transition: all 0.2s ease;
  }
`;

const IconContainer = styled.div`
  font-size: 18px;
  margin-bottom: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Label = styled.div`
  font-size: var(--app-font-size-sm);
  font-weight: ${props => props.$active ? '600' : '400'};
`;

// Эффект волны при нажатии
const Ripple = styled.span`
  position: absolute;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.05);
  width: 150%;
  height: 150%;
  transform: translate(-50%, -50%) scale(0);
  animation: ripple 0.6s linear forwards;
  pointer-events: none;
  
  @keyframes ripple {
    to {
      transform: translate(-50%, -50%) scale(1);
      opacity: 0;
    }
  }
`;

// Добавляем компонент BadgeIndicator для уведомлений
const BadgeIndicator = styled.div`
  position: absolute;
  top: -2px;
  right: calc(50% - 10px);
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background-color: var(--tg-theme-destructive-text-color, #ff3b30);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  color: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  z-index: 5;
`;

// Компонент для рендеринга иконок
const IconRenderer = ({ icon }) => {
  // Если icon это React элемент, возвращаем его напрямую
  if (React.isValidElement(icon)) {
    return icon;
  }
  
  // Если icon это строка, возвращаем соответствующую иконку из Font Awesome
  if (typeof icon === 'string') {
    const iconMap = {
      'home': <i className="fas fa-home"></i>,
      'chat': <i className="fas fa-comment-alt"></i>,
      'group': <i className="fas fa-users"></i>,
      'person': <i className="fas fa-user"></i>,
      'user-friends': <i className="fas fa-user-friends"></i>,
      // Добавляем другие иконки по необходимости
    };
    
    return iconMap[icon] || <i className={`fas fa-${icon}`}></i>;
  }
  
  // Если ничего не подошло, возвращаем пустой div
  return <div></div>;
};

// Главный компонент
const BottomNavigation = ({ items = [] }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [ripple, setRipple] = useState({ visible: false, x: 0, y: 0, itemId: null });
    const notifications = useNotifications();
    
    const unreadChatsCount = notifications?.unreadChatsCount || 0;
    const unreadChats = notifications?.unreadChats || [];

    console.log("BottomNavigation: unreadChatsCount =", unreadChatsCount, "unreadChats =", unreadChats);

    const currentPath = location.pathname;

    // Определение, активен ли пункт меню
    const isItemActive = (item) => {
        if (currentPath === item.path) return true;
        if (item.includesPaths && item.includesPaths.some(p => currentPath.startsWith(p))) return true;
        if (item.path === '/' && currentPath === '/home') return true;
        return false;
    };

    // Обработчик нажатия на пункт меню с эффектом волны
    const handleNavClick = (path) => {
        try {
            if (window.TelegramWebApp?.HapticFeedback?.impactOccurred) {
                window.TelegramWebApp.HapticFeedback.impactOccurred('light');
            }
        } catch (e) {
            console.warn('Haptic feedback not available');
        }

        navigate(path);
    };

    // Если нет элементов, не рендерим меню
    if (!items || items.length === 0) {
        return null;
    }

    return (
        <NavigationContainer>
            {items.map((item) => {
                const active = isItemActive(item);
                
                // Show badge for Chats tab when there are unread messages
                const showBadge = item.path === '/chats' && unreadChatsCount > 0;
                
                console.log(`Menu item ${item.path}: showBadge=${showBadge}, unreadCount=${unreadChatsCount}`);
                
                return (
                    <NavItem
                        key={item.path}
                        $active={active}
                        onClick={() => handleNavClick(item.path)}
                    >
                        <IconContainer>
                            <IconRenderer icon={item.icon} />
                            {showBadge && (
                                <BadgeIndicator>
                                    {unreadChatsCount > 99 ? '99+' : unreadChatsCount}
                                </BadgeIndicator>
                            )}
                        </IconContainer>
                        <Label $active={active}>{item.label}</Label>
                    </NavItem>
                );
            })}
        </NavigationContainer>
    );
};

export default BottomNavigation;
