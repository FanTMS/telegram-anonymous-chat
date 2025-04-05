import React, { useState, useEffect } from 'react';
import OnboardingTutorial from '../components/OnboardingTutorial';
import '../styles/BeginnerGuide.css';

const BeginnerGuide = () => {
    const [tutorialCompleted, setTutorialCompleted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Симулируем небольшую задержку для плавной загрузки
        const timer = setTimeout(() => {
            // Проверяем, проходил ли пользователь руководство ранее
            const completed = localStorage.getItem('tutorial_completed') === 'true';
            setTutorialCompleted(completed);
            setIsLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    const handleTutorialComplete = () => {
        setTutorialCompleted(true);
        localStorage.setItem('tutorial_completed', 'true');

        // Анимация с задержкой для плавного перехода
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (isLoading) {
        return (
            <div className="beginner-guide-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Загрузка руководства...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="beginner-guide-container">
            <h1>Руководство для начинающих</h1>

            {!tutorialCompleted ? (
                <OnboardingTutorial onComplete={handleTutorialComplete} />
            ) : (
                <div className="completion-message">
                    <h2>Поздравляем с прохождением руководства!</h2>
                    <p>Теперь вы знаете основы эффективного общения в анонимном чате.</p>
                    <p>Помните о главных принципах:</p>
                    <ul>
                        <li>Уважайте своего собеседника</li>
                        <li>Начинайте с открытых вопросов</li>
                        <li>Проявляйте искренний интерес</li>
                        <li>Будьте позитивны и доброжелательны</li>
                    </ul>
                    <p>Приятного общения и новых интересных знакомств!</p>
                    <button
                        className="restart-button"
                        onClick={() => setTutorialCompleted(false)}
                    >
                        Пройти руководство снова
                    </button>
                </div>
            )}
        </div>
    );
};

export default BeginnerGuide;
