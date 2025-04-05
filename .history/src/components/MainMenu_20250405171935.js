// DEPRECATED: Этот компонент больше не используется, вместо него используется BottomNavigation.js
// Заглушка для обратной совместимости
import React from 'react';
import BottomNavigation from './BottomNavigation';

const MainMenu = () => {
    console.warn('MainMenu is deprecated. Please use BottomNavigation component instead.');
    return <BottomNavigation />;
};

export default MainMenu;
