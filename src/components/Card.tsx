import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  animation?: boolean | 'fade' | 'scale' | 'slide';
  onClick?: () => void;
}

/**
 * Универсальный компонент Card для отображения контейнеров с содержимым
 */
export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  animation = false,
  onClick
}) => {
  const baseClasses = 'bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden';

  // Добавляем обработку нажатия, если передан обработчик
  const clickableClass = onClick ? 'cursor-pointer transition-shadow hover:shadow-md' : '';

  // Определяем анимацию при рендере
  const getAnimationProps = () => {
    if (!animation) return {};

    switch (animation) {
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.3 }
        };
      case 'scale':
        return {
          initial: { opacity: 0, scale: 0.95 },
          animate: { opacity: 1, scale: 1 },
          transition: { type: 'spring', stiffness: 300, damping: 30 }
        };
      case 'slide':
        return {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.3, ease: 'easeOut' }
        };
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.3 }
        };
    }
  };

  // Если анимация отключена, возвращаем обычный div
  if (!animation) {
    return (
      <div
        className={`${baseClasses} ${clickableClass} ${className}`}
        onClick={onClick}
      >
        {children}
      </div>
    );
  }

  // Иначе возвращаем анимированный компонент
  return (
    <motion.div
      className={`${baseClasses} ${clickableClass} ${className}`}
      onClick={onClick}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      {...getAnimationProps()}
    >
      {children}
    </motion.div>
  );
};

export default Card;
