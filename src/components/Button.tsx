import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  className = '',
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  type = 'button',
  icon
}) => {
  // Базовые стили для всех кнопок
  let baseClasses = 'inline-flex items-center justify-center rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50';

  // Стили в зависимости от размера
  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2',
    large: 'px-6 py-3 text-lg font-medium'
  };

  // Стили в зависимости от варианта
  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white focus:ring-blue-300',
    secondary: 'bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800 focus:ring-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white',
    outline: 'border border-gray-300 hover:bg-gray-100 active:bg-gray-200 text-gray-700 focus:ring-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-200 dark:active:bg-gray-600',
    ghost: 'hover:bg-gray-100 active:bg-gray-200 text-gray-700 focus:ring-gray-300 dark:hover:bg-gray-800 dark:text-gray-300 dark:active:bg-gray-700'
  };

  // Полная ширина
  const widthClass = fullWidth ? 'w-full' : '';

  // Состояние отключено
  const disabledClass = disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer';

  // Объединяем все классы
  const allClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${disabledClass} ${className}`;

  console.log(`[Button] Рендер кнопки: ${variant} ${size} ${disabled ? 'disabled' : 'enabled'}`);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log('[Button] Клик по кнопке');
    if (!disabled && onClick) {
      onClick(e);
    }
  };

  return (
    <motion.button
      type={type}
      className={allClasses}
      onClick={handleClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </motion.button>
  );
};

export default Button;
