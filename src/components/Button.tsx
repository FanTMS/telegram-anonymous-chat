import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  disabled = false,
  fullWidth = false,
  className = '',
  variant = 'primary',
  size = 'medium'
}) => {
  // Базовые классы для всех кнопок
  let buttonClasses = 'focus:outline-none transition-all ease-in-out rounded-lg font-medium shadow-sm';

  // Добавляем классы в зависимости от размера кнопки
  if (size === 'small') {
    buttonClasses += ' px-3 py-1.5 text-sm';
  } else if (size === 'medium') {
    buttonClasses += ' px-4 py-2';
  } else if (size === 'large') {
    buttonClasses += ' px-5 py-3 text-lg';
  }

  // Добавляем классы в зависимости от варианта
  if (variant === 'primary') {
    buttonClasses += ' bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white hover:shadow-md';
  } else if (variant === 'secondary') {
    buttonClasses += ' bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:active:bg-gray-500 dark:text-gray-200';
  } else if (variant === 'outline') {
    buttonClasses += ' bg-transparent border border-gray-300 hover:bg-gray-100 active:bg-gray-200 text-gray-700 dark:border-gray-600 dark:hover:bg-gray-800 dark:active:bg-gray-700 dark:text-gray-300';
  } else if (variant === 'text') {
    buttonClasses += ' bg-transparent text-blue-500 hover:text-blue-600 active:text-blue-700 underline';
  }

  // Добавляем класс для кнопки на всю ширину
  if (fullWidth) {
    buttonClasses += ' w-full';
  }

  // Добавляем класс для отключенной кнопки
  if (disabled) {
    buttonClasses += ' opacity-50 cursor-not-allowed';
  }

  // Добавляем пользовательские классы
  buttonClasses += ` ${className}`;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={buttonClasses}
    >
      {children}
    </button>
  );
};

export default Button;
