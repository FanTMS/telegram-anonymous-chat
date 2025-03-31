import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface InterestSelectorProps {
    selectedInterests: string[];
    // Поддерживаем оба варианта пропсов для обратной совместимости
    onSelectInterest?: (interests: string[]) => void;
    onChange?: (interests: string[]) => void;
    maxSelections?: number;
}

export const InterestSelector: React.FC<InterestSelectorProps> = ({
    selectedInterests = [],
    onSelectInterest,
    onChange,
    maxSelections = 10
}) => {
    // Список доступных интересов с иконками
    const availableInterests = [
        { icon: '🎵', name: 'Музыка' },
        { icon: '🎬', name: 'Кино' },
        { icon: '📚', name: 'Книги' },
        { icon: '⚽', name: 'Спорт' },
        { icon: '✈️', name: 'Путешествия' },
        { icon: '🍕', name: 'Кулинария' },
        { icon: '🐶', name: 'Животные' },
        { icon: '🎮', name: 'Игры' },
        { icon: '💻', name: 'Технологии' },
        { icon: '🎨', name: 'Искусство' },
        { icon: '🔬', name: 'Наука' },
        { icon: '🌿', name: 'Природа' },
        { icon: '👗', name: 'Мода' },
        { icon: '💪', name: 'Фитнес' },
        { icon: '📷', name: 'Фотография' }
    ];

    // Локальное состояние для отслеживания выбранных интересов
    const [selected, setSelected] = useState<string[]>(selectedInterests);

    // Обновляем локальное состояние при изменении входных пропов
    useEffect(() => {
        setSelected(selectedInterests);
    }, [selectedInterests]);

    // Обработчик выбора интереса
    const handleToggleInterest = (interest: string) => {
        let newSelected: string[];

        if (selected.includes(interest)) {
            // Удаляем интерес, если он уже выбран
            newSelected = selected.filter(item => item !== interest);
        } else {
            // Добавляем интерес, если он не выбран и не достигнут максимум
            if (selected.length < maxSelections) {
                newSelected = [...selected, interest];
            } else {
                // Если достигнут максимум, не добавляем новый интерес
                console.log(`Достигнут максимум выбора интересов: ${maxSelections}`);
                return;
            }
        }

        // Обновляем локальное состояние
        setSelected(newSelected);

        // Вызываем функции обратного вызова
        if (onSelectInterest) onSelectInterest(newSelected);
        if (onChange) onChange(newSelected);
    };

    return (
        <div className="flex flex-wrap gap-2">
            {availableInterests.map(({ icon, name }) => {
                const isSelected = selected.includes(name);

                return (
                    <motion.div
                        key={name}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleToggleInterest(name)}
                        className={`cursor-pointer flex flex-col items-center p-2 rounded-lg transition-colors ${isSelected
                            ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 dark:border-gray-600'
                            } border shadow-sm`}
                    >
                        <div className="text-xl mb-1">{icon}</div>
                        <div className="text-xs font-medium text-center">{name}</div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default InterestSelector;
