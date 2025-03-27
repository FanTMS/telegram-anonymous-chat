import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSearchingUsers } from '../utils/matchmaking';

interface ActiveSearchCounterProps {
    refreshIntervalMs?: number;
    showText?: boolean;
    className?: string;
    animateChange?: boolean;
}

export const ActiveSearchCounter: React.FC<ActiveSearchCounterProps> = ({
    refreshIntervalMs = 5000,
    showText = true,
    className = '',
    animateChange = true
}) => {
    const [count, setCount] = useState<number>(0);
    const [isIncreasing, setIsIncreasing] = useState<boolean | null>(null);
    const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

    useEffect(() => {
        // Функция для получения актуального количества ищущих пользователей
        const updateCount = () => {
            try {
                const searchingUsers = getSearchingUsers();

                // Добавим некоторое "искусственное" увеличение для лучшего UX
                // В реальном приложении с большим количеством пользователей это не понадобится
                const visualCount = Math.max(
                    searchingUsers.length,
                    // Минимальное отображаемое число - 2 пользователя
                    Math.floor(Math.random() * 3) + 2
                );

                // Определяем, увеличился ли счетчик
                if (visualCount > count) {
                    setIsIncreasing(true);
                } else if (visualCount < count) {
                    setIsIncreasing(false);
                } else {
                    setIsIncreasing(null); // Счетчик не изменился
                }

                setCount(visualCount);
                setLastUpdate(Date.now());
            } catch (error) {
                console.error('[ActiveSearchCounter] Ошибка при обновлении счетчика:', error);
            }
        };

        // Обновляем счетчик при монтировании компонента
        updateCount();

        // Настраиваем интервал обновления
        const intervalId = setInterval(updateCount, refreshIntervalMs);

        // Очистка при размонтировании
        return () => clearInterval(intervalId);
    }, [refreshIntervalMs, count]);

    // Рандомизируем интервал изменения счетчика для более естественного поведения
    useEffect(() => {
        // Если прошло более 10 секунд с последнего обновления, эмулируем активность
        const updateTimeout = setTimeout(() => {
            if (Date.now() - lastUpdate > 10000) {
                const change = Math.random() > 0.5 ? 1 : -1;
                const newCount = Math.max(2, count + change);
                setCount(newCount);
                setIsIncreasing(change > 0);
                setLastUpdate(Date.now());
            }
        }, Math.floor(Math.random() * 8000) + 5000);

        return () => clearTimeout(updateTimeout);
    }, [count, lastUpdate]);

    return (
        <div className={`flex items-center ${className}`}>
            <div className="relative">
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse" />

                    <AnimatePresence mode="wait">
                        <motion.span
                            key={count}
                            className="font-semibold"
                            initial={animateChange ? { opacity: 0, y: isIncreasing ? 10 : -10 } : {}}
                            animate={{ opacity: 1, y: 0 }}
                            exit={animateChange ? { opacity: 0, y: isIncreasing ? -10 : 10 } : {}}
                            transition={{ duration: 0.3 }}
                        >
                            {count}
                        </motion.span>
                    </AnimatePresence>

                    {showText && (
                        <span className="ml-1 text-gray-600 dark:text-gray-400">
                            {count === 1 ? 'человек' :
                                (count >= 2 && count <= 4) ? 'человека' :
                                    'человек'} в поиске
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};