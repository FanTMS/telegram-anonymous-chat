import React from 'react';
import { ButtonProps } from './types';

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'default',
    size = 'medium',
    fullWidth = false,
    leftIcon,
    rightIcon,
    isLoading = false,
    className = '',
    ...props
}) => {
    const baseClasses = 'inline-flex items-center justify-center rounded font-medium focus:outline-none transition-colors';

    // Классы размера кнопки
    const sizeClasses = {
        small: 'px-2 py-1 text-xs',
        medium: 'px-4 py-2 text-sm',
        large: 'px-6 py-3 text-base'
    };

    // Классы варианта кнопки
    const variantClasses = {
        default: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
        primary: 'bg-blue-600 hover:bg-blue-700 text-white',
        outline: 'border border-current bg-transparent hover:bg-gray-100',
        text: 'bg-transparent hover:bg-gray-100'
    };

    // Формируем классы для кнопки
    const classes = [
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        fullWidth ? 'w-full' : '',
        className
    ].join(' ');

    return (
        <button
            className={classes}
            disabled={props.disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Загрузка...
                </>
            ) : (
                <>
                    {leftIcon && <span className="mr-2">{leftIcon}</span>}
                    {children}
                    {rightIcon && <span className="ml-2">{rightIcon}</span>}
                </>
            )}
        </button>
    );
};

// Чтобы обеспечить работу с isLoading без ошибок типизации,
// явно экспортируем тип ButtonProps
export type { ButtonProps } from './types';
