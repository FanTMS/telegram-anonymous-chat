import React from 'react';

/**
 * Улучшенный компонент для отображения индикаторов шагов с анимациями
 * @param {Object} props - Свойства компонента
 * @param {number} props.totalSteps - Общее количество шагов
 * @param {number} props.currentStep - Текущий шаг
 * @param {string[]} props.labels - Названия шагов (опционально)
 * @returns {JSX.Element} Индикаторы шагов
 */
const StepIndicator = ({ totalSteps, currentStep, labels = [] }) => {
    return (
        <div className="form-steps">
            {[...Array(totalSteps)].map((_, index) => {
                // Определяем статус шага
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                const className = `step-indicator ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`;
                
                return (
                    <div key={index} className="step-indicator-container">
                        <div className={className} data-step={index + 1}>
                            {isCompleted && <span className="step-check">✓</span>}
                            {!isCompleted && <span className="step-number">{index + 1}</span>}
                        </div>
                        {labels[index] && <div className="step-label">{labels[index]}</div>}
                    </div>
                );
            })}
        </div>
    );
};

export default StepIndicator;
