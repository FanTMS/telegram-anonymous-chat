import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion'; // Добавляем импорт framer-motion

interface NavButtonProps {
  to: string;
  icon: string;
  label: string;
  isActive: boolean;
  hasNotification?: boolean;
  onClick?: () => void;
}

export const NavButton: React.FC<NavButtonProps> = ({
  to,
  icon,
  label,
  isActive,
  hasNotification = false,
  onClick
}) => {
  return (
    <Link
      to={to}
      className={`nav-button ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <motion.span
        className="icon-container"
        whileTap={{ scale: 0.9 }}
        transition={{ duration: 0.2 }}
      >
        <span className="icon">{icon}</span>
        {hasNotification && (
          <motion.span
            className="notification-dot"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </motion.span>
      <span className="label">{label}</span>
    </Link>
  );
};
