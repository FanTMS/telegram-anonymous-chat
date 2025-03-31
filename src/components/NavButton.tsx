import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface NavButtonProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  hasNotification?: boolean;
}

// Стили в CSS отвечают за адаптацию на разных устройствах
export const NavButton: React.FC<NavButtonProps> = ({
  to,
  icon,
  label,
  isActive = false,
  hasNotification = false
}) => {
  return (
    <Link to={to} className="relative flex-1">
      <motion.div
        className={`flex flex-col items-center justify-center px-2 py-1 rounded-lg transition-colors ${isActive
            ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/40'
          }`}
        whileTap={{ scale: 0.95 }}
      >
        <div className="text-xl mb-1">{icon}</div>
        <span className="text-xs font-medium">{label}</span>

        {hasNotification && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 flex items-center justify-center shadow-md"
          />
        )}
      </motion.div>
    </Link>
  );
};
