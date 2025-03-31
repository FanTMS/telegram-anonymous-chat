import React from 'react';
import { motion } from 'framer-motion';

export interface StepIconProps {
    step: number;
    currentStep: number;
    iconType?: 'emoji' | 'number';
}

/**
 * Компонент, который отображает иконку шага регистрации
 * с соответствующим состоянием и анимацией
 */
export const StepIcon: React.FC<StepIconProps> = ({
    step,
    currentStep,
    iconType = 'emoji'
}) => {
    const icons = ['👋', '📝', '🌟']; // Эмодзи для каждого шага
    const isActive = step === currentStep;
    const isCompleted = step < currentStep;

    const getIconContent = () => {
        if (isCompleted) return '✓';
        return iconType === 'emoji' ? icons[step - 1] : step;
    };

    return (
        <motion.div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all 
      ${isActive
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                    : isCompleted
                        ? 'bg-gradient-to-r from-green-500 to-teal-600 text-white'
                        : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}
            animate={{
                scale: isActive ? [1, 1.1, 1] : 1,
            }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
        >
            {getIconContent()}
        </motion.div>
    );
};

/**
 * Компонент-индикатор прогресса с визуализацией всех шагов
 */
export const StepIndicator: React.FC<{
    currentStep: number;
    totalSteps: number;
    iconType?: 'emoji' | 'number';
}> = ({ currentStep, totalSteps, iconType = 'emoji' }) => {
    return (
        <div className="flex justify-center mb-8 relative">
            <div className="absolute top-6 left-10 right-10 h-1 bg-gray-200 dark:bg-gray-700 rounded">
                <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 rounded"
                    initial={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
                    animate={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                />
            </div>

            <div className="flex justify-between w-full px-6 z-10">
                {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
                    <div key={s} className="flex flex-col items-center">
                        <StepIcon step={s} currentStep={currentStep} iconType={iconType} />
                        <div className="text-sm mt-2 text-center font-medium text-gray-600 dark:text-gray-400">
                            {s === 1 ? 'Знакомство' : s === 2 ? 'О вас' : 'Интересы'}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
