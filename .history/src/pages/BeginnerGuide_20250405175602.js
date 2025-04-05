import React, { useState, useEffect } from 'react';
import OnboardingTutorial from '../components/OnboardingTutorial';
import { initTelegramApp, isTelegramApp, triggerHapticFeedback } from '../utils/telegramUtils';
import '../styles/BeginnerGuide.css';

const BeginnerGuide = () => {
    const [tutorialCompleted, setTutorialCompleted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isTelegram, setIsTelegram] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    // Инициализация для Telegram
    useEffect(() => {
        // Проверяем, запущено ли приложение в Telegram
        const telegramApp = isTelegramApp();
        setIsTelegram(telegramApp);

        // Если запущено в Telegram, инициализируем
        if (telegramApp) {
            initTelegramApp();
        }

        // Проверяем, проходил ли пользователь руководство ранее
        const completed = localStorage.getItem('tutorial_completed') === 'true';
        setTutorialCompleted(completed);

        // Симулируем небольшую задержку для плавной загрузки
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    // Показываем конфетти при первом завершении руководства
    useEffect(() => {
        if (tutorialCompleted && !localStorage.getItem('confetti_shown')) {
            setShowConfetti(true);
            localStorage.setItem('confetti_shown', 'true');

            // Скрываем конфетти через 5 секунд
            const timer = setTimeout(() => {
                setShowConfetti(false);
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [tutorialCompleted]);

    const handleTutorialComplete = () => {
        // Хаптическая обратная связь для Telegram
        if (isTelegram) {
            triggerHapticFeedback('notification');
        }

        setTutorialCompleted(true);
        localStorage.setItem('tutorial_completed', 'true');

        // Анимация с задержкой для плавного перехода
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRestartTutorial = () => {
        // Плавно скрыть завершающий экран
        const completionMessage = document.querySelector('.completion-message');
        completionMessage.classList.add('fade-out');

        setTimeout(() => {
            setTutorialCompleted(false);
            // Прокрутка страницы вверх
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 300);
    };

    // Определяем классы для контейнера в зависимости от платформы
    const containerClasses = `beginner-guide-container ${isTelegram ? 'telegram-app-container' : ''}`;

    if (isLoading) {
        return (
            <div className={containerClasses}>
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Загрузка руководства...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={containerClasses}>
            <h1>Руководство для начинающих</h1>

            {!tutorialCompleted ? (
                <OnboardingTutorial onComplete={handleTutorialComplete} />
            ) : (
                <div className="completion-message">
                    {showConfetti && <div className="confetti-container"></div>}
                    <h2>Поздравляем с прохождением руководства!</h2>
                    <div className="completion-badge">
                        <span>✓</span>
                    </div>
                    <p>Теперь вы знаете основы эффективного общения в анонимном чате.</p>
                    <p>Помните о главных принципах:</p>
                    <ul>
                        <li>Уважайте своего собеседника</li>
                        <li>Начинайте с открытых вопросов</li>
                        <li>Проявляйте искренний интерес</li>
                        <li>Будьте позитивны и доброжелательны</li>
                    </ul>
                    <p>Приятного общения и новых интересных знакомств!</p>
                    <div className="action-buttons">
                        <button
                            className={`restart-button ${isTelegram ? 'tg-haptic-btn' : ''}`}
                            onClick={handleRestartTutorial}
                        >
                            Пройти руководство снова
                        </button>
                        <button
                            className="continue-button"
                            onClick={() => window.location.href = '/home'}
                        >
                            Перейти к чату
                        </button>
                    </div>
                </div>
            )}

            {/* SafeArea для устройств с "челками" и закругленными углами */}
            <div className="safe-area-bottom"></div>
        </div>
    );
};

export default BeginnerGuide;
