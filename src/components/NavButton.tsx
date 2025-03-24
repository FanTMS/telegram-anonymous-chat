import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import WebApp from '@twa-dev/sdk';

interface NavButtonProps {
  to: string;
  icon: string | React.ReactNode;
  label: string;
  isActive?: boolean;
  hasNotification?: boolean;
}

export const NavButton: React.FC<NavButtonProps> = ({
  to,
  icon,
  label,
  isActive,
  hasNotification = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Если isActive не передан, определяем активность по текущему пути
  const active = isActive !== undefined
    ? isActive
    : location.pathname === to || (to === '/' && location.pathname === '/home');

  const handleClick = () => {
    // Добавляем тактильный отклик через Telegram SDK
    if (WebApp.isExpanded) {
      WebApp.HapticFeedback.impactOccurred('light');
    }
    navigate(to);
  }

  return (
    <motion.button
      className="relative flex flex-col items-center justify-center px-2 py-1 w-full"
      onClick={handleClick}
      whileTap={{ scale: 0.92 }}
      transition={{ duration: 0.15 }}
    >
      {/* Индикатор активной вкладки */}
      {active && (
        <motion.div
          className="nav-indicator"
          layoutId="nav-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}

    {/* Иконка */}
    <motion.div
      className={`relative text-xl mb-1 ${active ? 'nav-icon-active' : ''}`}
      animate={{
        scale: active ? 1.1 : 1,
        y: active ? -2 : 0,
      }}
      transition={{ duration: 0.2 }}
    >
      <span className={active ? 'text-tg-theme-button-color' : 'text-tg-theme-hint-color'}>
        {icon}
      </span>
    </motion.div>

    {/* Индикатор уведомления */}
    {hasNotification && (
      <motion.div
        className="nav-notification-badge"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
      />
    )}

    {/* Текст */}
    <span
      className={`text-xs transition-all ${
        active ? 'text-tg-theme-button-color font-medium' : 'text-tg-theme-hint-color'
      }`}
    >
      {label}
    </span>
  </motion.button>
  );
};
