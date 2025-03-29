import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
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
  isLoading = false,
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
    ghost: 'hover:bg-gray-100 active:bg-gray-200 text-gray-700 focus:ring-gray-300 dark:hover:bg-gray-800 dark:text-gray-300 dark:active:bg-gray-700',
    danger: 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white focus:ring-red-300'
  };

  // Полная ширина
  const widthClass = fullWidth ? 'w-full' : '';

  // Состояние отключено или загрузка
  const isDisabled = disabled || isLoading;
  const disabledClass = isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer';

  // Объединяем все классы
  const allClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${disabledClass} ${className}`;

  console.log(`[Button] Рендер кнопки: ${variant} ${size} ${isDisabled ? 'disabled' : 'enabled'}`);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log('[Button] Клик по кнопке');
    if (!isDisabled && onClick) {
      onClick(e);
    }
  };

  return (
    <motion.button
      type={type}
      className={allClasses}
      onClick={handleClick}
      disabled={isDisabled}
      whileHover={isDisabled ? {} : { scale: 1.02 }}
      whileTap={isDisabled ? {} : { scale: 0.98 }}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Загрузка...
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </motion.button>
  );
};

export default Button;
