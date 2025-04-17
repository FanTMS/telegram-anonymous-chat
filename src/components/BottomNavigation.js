import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useNotifications } from '../contexts/NotificationContext';

// Контейнер для навигации с безопасной зоной
const NavigationContainer = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  height: 60px;
  background-color: var(--tg-theme-bg-color, #fff);
  box-shadow: 0 -1px 10px rgba(0, 0, 0, 0.06);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  z-index: 1000;
  padding-bottom: var(--safe-area-bottom, env(safe-area-inset-bottom, 0));
  transition: transform 0.3s ease;
  
  &.tg-compact-mode {
    height: var(--compact-nav-height, 50px);
    box-shadow: 0 -1px 5px rgba(0, 0, 0, 0.05);
    padding-bottom: var(--safe-area-bottom, env(safe-area-inset-bottom, 0));
    padding-left: var(--safe-area-left, env(safe-area-inset-left, 0));
    padding-right: var(--safe-area-right, env(safe-area-inset-right, 0));
  }
  
  @media (min-width: 481px) {
    width: 480px;
    left: 50%;
    transform: ${props => props.$hidden ? 'translate(-50%, 100%)' : 'translate(-50%, 0)'};
    border-left: 1px solid rgba(0, 0, 0, 0.05);
    border-right: 1px solid rgba(0, 0, 0, 0.05);
    
    &.tg-compact-mode {
      width: 100%;
      border-left: none;
      border-right: none;
    }
  }
  
  @media (max-width: 480px) {
    transform: ${props => props.$hidden ? 'translateY(100%)' : 'translateY(0)'};
    width: 100%;
    max-width: 100%;
  }
  
  /* Дополнительные стили для iPhone с вырезами */
  @supports (padding-bottom: constant(safe-area-inset-bottom)) {
    padding-bottom: constant(safe-area-inset-bottom);
    
    &.tg-compact-mode {
      padding-bottom: constant(safe-area-inset-bottom);
    }
  }
`;

const NavItemContainer = styled.div`
  display: flex;
  justify-content: space-around;
  width: 100%;
  height: 100%;
  padding: 0;
  
  &.tg-compact-mode {
    padding-left: var(--safe-area-left, env(safe-area-inset-left, 0));
    padding-right: var(--safe-area-right, env(safe-area-inset-right, 0));
  }
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
  
  .tg-compact-mode & {
    padding: 4px 0;
  }
  
  &:hover {
    color: var(--tg-theme-button-color, #2481cc);
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 5px;
    width: 4px;
    height: 4px;
    border-radius: 2px;
    background-color: var(--tg-theme-button-color, #2481cc);
    opacity: ${props => props.$active ? 1 : 0};
    transform: scale(${props => props.$active ? 1 : 0});
    transition: all 0.2s ease;
    
    .tg-compact-mode & {
      bottom: 2px;
    }
  }
`;

const IconContainer = styled.div`
  font-size: 20px;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .tg-compact-mode & {
    font-size: 18px;
    margin-bottom: 2px;
  }
`;

const Label = styled.div`
  font-size: 12px;
  font-weight: ${props => props.$active ? '600' : '400'};
  
  .tg-compact-mode & {
    font-size: 10px;
  }
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
  top: -5px;
  right: calc(50% - 12px);
  width: 18px;
  height: 18px;
  background-color: var(--tg-theme-destructive-text-color, #ff3b30);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: bold;
  color: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  z-index: 5;
  transform: scale(1);
  transition: transform 0.2s ease-out;
  animation: badgePulse 1.5s infinite;
  
  .tg-compact-mode & {
    width: 16px;
    height: 16px;
    font-size: 10px;
    top: -3px;
    right: calc(50% - 10px);
  }
  
  @keyframes badgePulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
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
const BottomNavigation = ({ items = [], isCompactMode = false }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [ripple, setRipple] = useState({ visible: false, x: 0, y: 0, itemId: null });
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const notifications = useNotifications();
    
    // Safely access notification values with fallbacks
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
    const handleNavClick = (path, e, itemId) => {
        // Создаем ripple эффект
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setRipple({ visible: true, x, y, itemId });

        // Добавляем тактильный отклик, если доступен
        try {
            if (window.TelegramWebApp &&
                window.TelegramWebApp.HapticFeedback &&
                typeof window.TelegramWebApp.HapticFeedback.impactOccurred === 'function') {
                window.TelegramWebApp.HapticFeedback.impactOccurred('light');
            } else if (window.Telegram &&
                      window.Telegram.WebApp && 
                      window.Telegram.WebApp.HapticFeedback &&
                      typeof window.Telegram.WebApp.HapticFeedback.impactOccurred === 'function') {
                window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
            }
        } catch (e) {
            console.warn('Haptic feedback not available');
        }

        // Переходим на страницу после небольшой задержки для анимации
        setTimeout(() => {
            navigate(path);

            // Очищаем эффект через некоторое время
            setTimeout(() => {
                setRipple({ visible: false, x: 0, y: 0, itemId: null });
            }, 600);
        }, 150);
    };

    // Скрываем/показываем меню при скролле только для прокручиваемых страниц
    useEffect(() => {
        const handleScroll = () => {
            // Don't hide navigation on chat screens
            if (currentPath.includes('/chat/')) {
                setIsVisible(true);
                return;
            }

            const scrollY = window.scrollY;
            const scrollThreshold = 20;
            
            if (scrollY > lastScrollY + scrollThreshold && scrollY > 100) {
                // Scrolling down, hide nav
                setIsVisible(false);
            } else if (scrollY < lastScrollY - scrollThreshold || scrollY < 100) {
                // Scrolling up or near top, show nav
                setIsVisible(true);
            }
            
            setLastScrollY(scrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY, currentPath]);

    // Если нет элементов, не рендерим меню
    if (!items || items.length === 0) {
        return null;
    }

    // Создаем дополнительный класс для компактного режима
    const navClass = isCompactMode ? 'tg-compact-mode' : '';

    return (
        <NavigationContainer $hidden={!isVisible} className={navClass}>
            <NavItemContainer className={navClass}>
                {items.map((item) => {
                    const active = isItemActive(item);
                    
                    // Show badge for Chats tab when there are unread messages
                    const showBadge = item.path === '/chats' && unreadChatsCount > 0;
                    
                    return (
                        <NavItem
                            key={item.path}
                            $active={active}
                            onClick={(e) => handleNavClick(item.path, e, item.path)}
                        >
                            {showBadge && (
                                <BadgeIndicator>
                                    {unreadChatsCount > 99 ? '99+' : unreadChatsCount}
                                </BadgeIndicator>
                            )}
                            
                            <IconContainer>
                                <IconRenderer icon={item.icon} />
                            </IconContainer>
                            
                            <Label $active={active}>
                                {item.label}
                            </Label>
                            
                            {ripple.visible && ripple.itemId === item.path && (
                                <Ripple style={{ left: ripple.x, top: ripple.y }} />
                            )}
                        </NavItem>
                    );
                })}
            </NavItemContainer>
        </NavigationContainer>
    );
};

export default BottomNavigation;
