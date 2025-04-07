import React, { useState, useEffect, useRef } from 'react';
import OnboardingTutorial from '../components/OnboardingTutorial';
import { initTelegramApp, isTelegramApp, triggerHapticFeedback } from '../utils/telegramUtils';
import '../styles/BeginnerGuide.css';

const BeginnerGuide = () => {
    const [tutorialCompleted, setTutorialCompleted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isTelegram, setIsTelegram] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [darkMode, setDarkMode] = useState(false);
    const progressBarRef = useRef(null);

    // Инициализация для Telegram
    useEffect(() => {
        // Проверяем, запущено ли приложение в Telegram
        const telegramApp = isTelegramApp();
        setIsTelegram(telegramApp);

        // Если запущено в Telegram, инициализируем
        if (telegramApp) {
            initTelegramApp();
            
            // Проверяем цветовую схему Telegram
            if (window.Telegram?.WebApp) {
                setDarkMode(window.Telegram.WebApp.colorScheme === 'dark');
            }
        } else {
            // Проверка темной темы системы для веб-версии
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setDarkMode(prefersDark);
        }

        // Проверяем, проходил ли пользователь руководство ранее
        const completed = localStorage.getItem('tutorial_completed') === 'true';
        setTutorialCompleted(completed);

        // Плавная загрузка
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 600);

        return () => clearTimeout(timer);
    }, []);

    // Анимация прогресс-бара при загрузке
    useEffect(() => {
        if (!isLoading && progressBarRef.current) {
            progressBarRef.current.style.width = '100%';
        }
    }, [isLoading]);

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
            triggerHapticFeedback('medium');
        }

        setTutorialCompleted(true);
        localStorage.setItem('tutorial_completed', 'true');

        // Анимация с задержкой для плавного перехода
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRestartTutorial = () => {
        // Хаптическая обратная связь для Telegram
        if (isTelegram) {
            triggerHapticFeedback('light');
        }
        
        // Плавно скрыть завершающий экран
        const completionMessage = document.querySelector('.completion-message');
        completionMessage.classList.add('slide-out');

        setTimeout(() => {
            setTutorialCompleted(false);
            // Прокрутка страницы вверх
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 300);
    };
    
    const handleFindChatClick = () => {
        if (isTelegram) {
            triggerHapticFeedback('medium');
        }
        window.location.href = '/random-chat';
    };

    const handleContinueClick = () => {
        if (isTelegram) {
            triggerHapticFeedback('medium');
        }
        window.location.href = '/home';
    };

    // Определяем классы для контейнера в зависимости от платформы и темы
    const containerClasses = `tg-guide-container ${isTelegram ? 'in-telegram' : ''} ${darkMode ? 'dark-theme' : 'light-theme'}`;

    if (isLoading) {
        return (
            <div className={containerClasses}>
                <div className="tg-loading">
                    <div className="tg-progress-bar">
                        <div className="tg-progress-value" ref={progressBarRef}></div>
                    </div>
                    <div className="tg-loader">
                        <div className="tg-loader-spinner"></div>
                    </div>
                    <p className="tg-loader-text">Загрузка руководства</p>
                </div>
            </div>
        );
    }

    return (
        <div className={containerClasses}>
            <div className="tg-guide-header">
                <h1>Руководство по общению в анонимном чате</h1>
                <div className="tg-header-line"></div>
            </div>

            {!tutorialCompleted ? (
                <div className="tg-tutorial-wrapper">
                    <OnboardingTutorial onComplete={handleTutorialComplete} />
                </div>
            ) : (
                <div className="completion-message">
                    {showConfetti && (
                        <div className="tg-confetti">
                            {[...Array(30)].map((_, i) => (
                                <div 
                                    key={i} 
                                    className="tg-confetti-piece" 
                                    style={{
                                        left: `${Math.random() * 100}%`,
                                        animationDelay: `${Math.random() * 3}s`,
                                        backgroundColor: `hsl(${Math.random() * 360}, 80%, 60%)`
                                    }}
                                ></div>
                            ))}
                        </div>
                    )}
                    
                    <div className="tg-completion-card">
                        <div className="tg-completion-badge">
                            <span>✓</span>
                        </div>
                        
                        <h2>Поздравляем!</h2>
                        <p className="tg-completion-subtitle">Вы успешно завершили руководство</p>
                        
                        <div className="tg-principles">
                            <h3>Основные принципы общения:</h3>
                            <div className="tg-principles-grid">
                                <div className="tg-principle-item">
                                    <div className="tg-principle-icon respect">👤</div>
                                    <p>Уважение к собеседнику</p>
                                </div>
                                <div className="tg-principle-item">
                                    <div className="tg-principle-icon questions">❓</div>
                                    <p>Открытые вопросы</p>
                                </div>
                                <div className="tg-principle-item">
                                    <div className="tg-principle-icon interest">👂</div>
                                    <p>Искренний интерес</p>
                                </div>
                                <div className="tg-principle-item">
                                    <div className="tg-principle-icon positivity">😊</div>
                                    <p>Позитивный настрой</p>
                                </div>
                            </div>
                        </div>
                        
                        <p className="tg-completion-message">
                            Теперь вы готовы к приятному общению и новым интересным знакомствам!
                        </p>
                    </div>
                    
                    <div className="tg-action-buttons">
                        <button
                            className="tg-button tg-button-secondary"
                            onClick={handleRestartTutorial}
                        >
                            <span className="tg-button-icon">↺</span>
                            Пройти снова
                        </button>
                        <button
                            className="tg-button tg-button-primary"
                            onClick={handleContinueClick}
                        >
                            <span className="tg-button-icon">→</span>
                            Перейти к чату
                        </button>
                    </div>
                    
                    <div className="tg-find-chat">
                        <button 
                            className="tg-find-chat-button"
                            onClick={handleFindChatClick}
                        >
                            <span className="tg-find-icon">🔍</span>
                            Найти собеседника
                        </button>
                    </div>
                </div>
            )}

            {/* SafeArea для устройств с "челками" и закругленными углами */}
            <div className="tg-safe-area-bottom"></div>
        </div>
    );
};

export default BeginnerGuide;
