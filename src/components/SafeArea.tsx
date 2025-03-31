import React from 'react';

interface SafeAreaProps {
    position?: 'top' | 'bottom' | 'both';
    className?: string;
    style?: React.CSSProperties;
}

/**
 * Компонент для добавления безопасных отступов для устройств с вырезами (notch)
 * Специально для iOS устройств с "челкой" или нижней панелью навигации
 */
export const SafeArea: React.FC<SafeAreaProps> = ({
    position = 'bottom',
    className = '',
    style = {}
}) => {
    // Определяем CSS классы в зависимости от position
    let safeAreaClass = '';

    if (position === 'top') {
        safeAreaClass = 'h-safe-top';
    } else if (position === 'bottom') {
        safeAreaClass = 'h-safe-bottom';
    } else if (position === 'both') {
        safeAreaClass = 'h-safe-top mb-safe-bottom';
    }

    return (
        <div
            className={`${safeAreaClass} ${className}`}
            style={style}
            aria-hidden="true"
        />
    );
};

export default SafeArea;
