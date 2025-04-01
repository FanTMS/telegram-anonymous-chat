import { useState } from 'react';

/**
 * Хук для управления многоэтапной формой
 * @param {number} stepsCount - количество этапов формы
 * @param {number} initialStep - начальный этап (по умолчанию 0)
 * @returns {Object} - методы и свойства для управления формой
 */
export const useFormSteps = (stepsCount, initialStep = 0) => {
    const [currentStep, setCurrentStep] = useState(initialStep);
    const [direction, setDirection] = useState('next');

    // Переход к следующему шагу
    const goToNextStep = () => {
        if (currentStep < stepsCount - 1) {
            setDirection('next');
            setCurrentStep(prev => prev + 1);
        }
    };

    // Переход к предыдущему шагу
    const goToPreviousStep = () => {
        if (currentStep > 0) {
            setDirection('prev');
            setCurrentStep(prev => prev - 1);
        }
    };

    // Переход к конкретному шагу
    const goToStep = (step) => {
        if (step >= 0 && step < stepsCount) {
            setDirection(step > currentStep ? 'next' : 'prev');
            setCurrentStep(step);
        }
    };

    // Определение класса для стилизации текущего шага
    const getStepClassName = (step) => {
        if (step === currentStep) return 'active';
        if (step < currentStep) return 'completed';
        return 'upcoming';
    };

    // Создание классов для анимаций текущего, предыдущих и следующих шагов
    const stepClassName = (step) => {
        if (step === currentStep) return 'form-step active';
        if (direction === 'next' && step < currentStep) return 'form-step previous';
        if (direction === 'prev' && step > currentStep) return 'form-step next';
        return 'form-step';
    };

    return {
        currentStep,
        totalSteps: stepsCount,
        goToNextStep,
        goToPreviousStep,
        goToStep,
        isFirstStep: currentStep === 0,
        isLastStep: currentStep === stepsCount - 1,
        getStepClassName,
        stepClassName,
        direction
    };
};
