import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastProps {
    message: string;
    type?: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
    onClose?: () => void;
    position?: 'top' | 'bottom';
}

export const Toast: React.FC<ToastProps> = ({
    message,
    type = 'info',
    duration = 3000,
    onClose,
    position = 'top'
}) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    const handleAnimationComplete = () => {
        if (!visible && onClose) {
            onClose();
        }
    };

    // Определяем цвета в зависимости от типа
    const getColors = () => {
        switch (type) {
            case 'success':
                return 'bg-green-500 dark:bg-green-600';
            case 'error':
                return 'bg-red-500 dark:bg-red-600';
            case 'warning':
                return 'bg-yellow-500 dark:bg-yellow-600';
            case 'info':
            default:
                return 'bg-blue-500 dark:bg-blue-600';
        }
    };

    // Определяем иконку
    const getIcon = () => {
        switch (type) {
            case 'success':
                return '✓';
            case 'error':
                return '✗';
            case 'warning':
                return '⚠';
            case 'info':
            default:
                return 'ℹ';
        }
    };

    // Определяем позицию
    const positionClass = position === 'top' ? 'top-4' : 'bottom-4';

    // Определяем безопасную зону внизу экрана
    const safeArea = position === 'bottom' ? 'pb-safe-bottom' : '';

    return (
        <AnimatePresence mode="wait">
            {visible && (
                <motion.div
                    className={`fixed ${positionClass} left-1/2 transform -translate-x-1/2 z-50 px-4 max-w-md w-full ${safeArea}`}
                    initial={{ opacity: 0, y: position === 'top' ? -20 : 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: position === 'top' ? -20 : 20 }}
                    transition={{ duration: 0.3 }}
                    onAnimationComplete={handleAnimationComplete}
                >
                    <div
                        className={`${getColors()} text-white px-4 py-3 rounded-lg shadow-lg flex items-center`}
                    >
                        <div className="w-6 h-6 rounded-full bg-white bg-opacity-20 flex items-center justify-center mr-3 flex-shrink-0">
                            <span className="text-white text-sm">{getIcon()}</span>
                        </div>
                        <p className="text-sm font-medium text-white">{message}</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Toast;
