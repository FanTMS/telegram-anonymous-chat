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
  const activeClasses = isActive
    ? 'text-blue-500 dark:text-blue-400'
    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200';

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`nav-button ${activeClasses}`}
    >
      <div className="relative">
        <div className="nav-button-icon">{icon}</div>
        {hasNotification && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"
          />
        )}
      </div>
      <span className="text-xs">{label}</span>
      {isActive && (
        <motion.div
          layoutId="navbar-indicator"
          className="absolute top-0 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-blue-500 dark:bg-blue-400 rounded-b"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </Link>
  );
};
