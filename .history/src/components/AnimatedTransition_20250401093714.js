import React from 'react';

/**
 * Компонент для создания плавных анимированных переходов между контентом
 * @param {Object} props - Свойства компонента
 * @param {boolean} props.show - Флаг видимости содержимого
 * @param {string} props.animation - Тип анимации (fadeIn, slideUp, slideIn)
 * @param {number} props.duration - Продолжительность анимации в миллисекундах
 * @param {number} props.delay - Задержка перед началом анимации в миллисекундах
 * @param {React.ReactNode} props.children - Дочерние элементы
 */
const AnimatedTransition = ({ 
    show = true, 
    animation = 'fadeIn', 
    duration = 300, 
    delay = 0, 
    children 
}) => {
    // Определение стилей для различных типов анимации
    const getAnimationStyle = () => {
        const baseStyle = {
            opacity: show ? 1 : 0,
            transition: `all ${duration}ms ease ${delay}ms`
        };

        switch (animation) {
            case 'fadeIn':
                return baseStyle;
            case 'slideUp':
                return {
                    ...baseStyle,
                    transform: show ? 'translateY(0)' : 'translateY(20px)'
                };
            case 'slideIn':
                return {
                    ...baseStyle,
                    transform: show ? 'translateX(0)' : 'translateX(20px)'
                };
            case 'scaleIn':
                return {
                    ...baseStyle,
                    transform: show ? 'scale(1)' : 'scale(0.95)'
                };
            default:
                return baseStyle;
        }
    };

    return (
        <div style={getAnimationStyle()}>
            {children}
        </div>
    );
};

export default AnimatedTransition;
