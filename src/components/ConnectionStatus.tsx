import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConnectionStatus } from '../hooks/useConnectionStatus';

interface ConnectionStatusProps {
    showOfflineOnly?: boolean;
    position?: 'top' | 'bottom';
    duration?: number;
}

/**
 * Компонент для отображения уведомлений о статусе подключения
 */
export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
    showOfflineOnly = false,
    position = 'top',
    duration = 5000
}) => {
    const connectionStatus = useConnectionStatus();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout | null = null;

        // Показываем при изменении статуса подключения
        if (connectionStatus.backOnline || (!connectionStatus.online && !showOfflineOnly)) {
            setVisible(true);

            // Автоматически скрываем через указанное время
            timeoutId = setTimeout(() => {
                setVisible(false);
            }, duration);
        }

        // Очистка при размонтировании
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [connectionStatus.backOnline, connectionStatus.online, duration, showOfflineOnly]);

    // Стили в зависимости от позиции
    const positionClasses = position === 'top'
        ? 'top-0 pt-safe-top'
        : 'bottom-0 pb-safe-bottom';

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className={`fixed left-0 right-0 ${positionClasses} z-50 flex justify-center pointer-events-none`}
                    initial={{ opacity: 0, y: position === 'top' ? -50 : 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                    <div className="max-w-md w-full px-4">
                        <div
                            className={`${connectionStatus.backOnline
                                    ? 'bg-green-500 dark:bg-green-600'
                                    : 'bg-red-500 dark:bg-red-600'
                                } text-white rounded-lg shadow-lg p-3 flex items-center justify-center`}
                        >
                            <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-full ${connectionStatus.backOnline
                                        ? 'bg-green-300 dark:bg-green-300'
                                        : 'bg-red-300 dark:bg-red-300'
                                    } animate-pulse mr-2`}></div>
                                <span className="text-sm font-medium">
                                    {connectionStatus.backOnline
                                        ? 'Подключение восстановлено'
                                        : 'Нет подключения к интернету'}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ConnectionStatus;
