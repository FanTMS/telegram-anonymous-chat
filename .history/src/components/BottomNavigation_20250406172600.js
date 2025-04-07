import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './BottomNavigation.css'; // Добавим CSS-файл

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
    <div className="navigation-container">
      {items.map((item) => (
        <div 
          key={item.path} 
          className={`nav-item ${currentPath === item.path ? 'active' : ''}`}
          onClick={() => handleNavClick(item.path)}
        >
          <div className="icon-container">{item.icon}</div>
          <div className={`label ${currentPath === item.path ? 'active' : ''}`}>{item.label}</div>
        </div>
      ))}
    </div>
  );
};

export default BottomNavigation;
