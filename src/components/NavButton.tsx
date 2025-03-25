import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  FriendsIcon,
  GroupsIcon,
  ChatsIcon,
  StoreIcon,
  ProfileIcon,
  AdminIcon
} from './NavIcons';

interface NavButtonProps {
  to: string;
  label: string;
  icon: string; // Теперь это строковый идентификатор иконки
  isActive?: boolean;
  hasNotification?: boolean;
  onClick?: () => void;
}

// Функция для получения компонента иконки по идентификатору
const getIconComponent = (iconName: string, isActive: boolean) => {
  const iconClass = `w-6 h-6 ${isActive ? 'nav-icon-active' : ''}`;

  switch (iconName) {
    case '🏠':
      return <HomeIcon className={iconClass} />;
    case '👥':
      return <FriendsIcon className={iconClass} />;
    case '👨‍👩‍👧‍👦':
      return <GroupsIcon className={iconClass} />;
    case '💬':
      return <ChatsIcon className={iconClass} />;
    case '🛒':
      return <StoreIcon className={iconClass} />;
    case '👤':
      return <ProfileIcon className={iconClass} />;
    case '⚙️':
      return <AdminIcon className={iconClass} />;
    default:
      // Возвращаем исходную эмодзи-иконку если не нашли соответствия
      return <span className="text-2xl">{iconName}</span>;
  }
};

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
        <div className="nav-button-icon">
          {getIconComponent(icon, isActive)}
        </div>
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
