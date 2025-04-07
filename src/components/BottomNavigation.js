import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';

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
  padding-bottom: env(safe-area-inset-bottom, 0);
  transition: transform 0.3s ease;
  
  @media (min-width: 481px) {
    width: 480px;
    left: 50%;
    transform: ${props => props.$hidden ? 'translate(-50%, 100%)' : 'translate(-50%, 0)'};
    border-left: 1px solid rgba(0, 0, 0, 0.05);
    border-right: 1px solid rgba(0, 0, 0, 0.05);
  }
  
  @media (max-width: 480px) {
    transform: ${props => props.$hidden ? 'translateY(100%)' : 'translateY(0)'};
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
  }
`;

const IconContainer = styled.div`
  font-size: 20px;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Label = styled.div`
  font-size: 12px;
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
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

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

    // Скрываем/показываем меню при скролле
    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            const threshold = 20; // Минимальная разница для срабатывания

            // Показываем меню при скролле вверх или если мы в верхней части страницы
            if (scrollY < lastScrollY - threshold || scrollY < 100) {
                setIsVisible(true);
            }
            // Скрываем меню при скролле вниз
            else if (scrollY > lastScrollY + threshold) {
                setIsVisible(false);
            }

            setLastScrollY(scrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    // Если нет элементов, не рендерим меню
    if (!items || items.length === 0) {
        return null;
    }

    return (
        <NavigationContainer $hidden={!isVisible}>
            {items.map((item) => {
                const active = isItemActive(item);

                return (
                    <NavItem
                        key={item.path}
                        $active={active}
                        onClick={(e) => handleNavClick(item.path, e, item.path)}
                    >
                        <IconContainer>
                            <IconRenderer icon={item.icon} />
                        </IconContainer>
                        <Label $active={active}>{item.label}</Label>

                        {/* Эффект волны при нажатии */}
                        {ripple.visible && ripple.itemId === item.path && (
                            <Ripple
                                style={{
                                    left: ripple.x,
                                    top: ripple.y
                                }}
                            />
                        )}
                    </NavItem>
                );
            })}
        </NavigationContainer>
    );
};

export default BottomNavigation;
