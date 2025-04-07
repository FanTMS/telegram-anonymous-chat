import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';

// Стилизованные компоненты
const NavigationContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: var(--tg-theme-bg-color, #ffffff);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 56px;
  padding-bottom: env(safe-area-inset-bottom, 0);
  z-index: 1000;
`;

const NavItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
  width: 100%;
  cursor: pointer;
  color: ${props => props.active 
    ? 'var(--tg-theme-button-color, #2481cc)' 
    : 'var(--tg-theme-hint-color, #999999)'};
  transition: color 0.3s;

  &:hover {
    color: var(--tg-theme-button-color, #2481cc);
  }
`;

const IconContainer = styled.div`
  font-size: 24px;
  margin-bottom: 4px;
`;

const Label = styled.div`
  font-size: 12px;
  font-weight: ${props => props.active ? 'bold' : 'normal'};
`;

// Главный компонент
const BottomNavigation = ({ items = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  // Обработчик нажатия на пункт меню
  const handleNavClick = (path) => {
    navigate(path);
  };

  // Если нет элементов, не рендерим меню
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <NavigationContainer>
      {items.map((item) => (
        <NavItem 
          key={item.path} 
          active={currentPath === item.path}
          onClick={() => handleNavClick(item.path)}
        >
          <IconContainer>{item.icon}</IconContainer>
          <Label active={currentPath === item.path}>{item.label}</Label>
        </NavItem>
      ))}
    </NavigationContainer>
  );
};

export default BottomNavigation;
