import React from 'react';

/**
 * Компонент для отображения индикаторов шагов многоэтапной формы
 * @param {Object} props - Свойства компонента
 * @param {number} props.totalSteps - Общее количество шагов
 * @param {number} props.currentStep - Текущий шаг
 * @returns {JSX.Element} Индикаторы шагов
 */
const StepIndicator = ({ totalSteps, currentStep }) => {
    return (
        <div className="form-steps">
            {[...Array(totalSteps)].map((_, index) => (
                <div
                    key={index}
                    className={`step-indicator ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
                    data-step={index + 1}
                />
            ))}
        </div>
    );
};

export default StepIndicator;
