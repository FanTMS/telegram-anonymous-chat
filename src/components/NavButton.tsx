import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface NavButtonProps {
  to: string;
  label: string;
  icon: React.ReactNode;
  isActive?: boolean;
  hasNotification?: boolean;
  onClick?: () => void;
}

export const NavButton: React.FC<NavButtonProps> = ({
  to,
  label,
  icon,
  isActive = false,
  hasNotification = false,
  onClick
}) => {
  // Используем единый стиль кнопок для всех устройств
  const activeClasses = isActive
    ? 'text-blue-500 dark:text-blue-400'
    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200';

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`nav-button ${activeClasses}`}
      aria-label={label}
    >
      <div className="relative">
        <div className="nav-button-icon">{icon}</div>
        {hasNotification && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="nav-notification-badge"
          />
        )}
      </div>
      <span>{label}</span>
      {isActive && (
        <motion.div
          layoutId="navbar-indicator"
          className="nav-indicator"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </Link>
  );
};
