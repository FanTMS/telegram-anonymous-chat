import React, { useState, useEffect } from 'react';
import '../styles/OnboardingTutorial.css';
// Добавляем импорт хука useTelegram
import { useTelegram } from '../hooks/useTelegram';
// Добавляем импорт необходимых функций для работы с Telegram
import { setupMainButton, hideMainButton, triggerHapticFeedback } from '../utils/telegramUtils';
// Добавляем импорт функции для работы с чатами
import { findRandomChat } from '../utils/chatService';

// Примеры начала общения
const chatExamples = [
    {
        title: 'Нейтральное начало',
        icon: '👋',
        messages: [
            "Привет! Рад(а) познакомиться. Как твои дела сегодня?",
            "Привет! Чем обычно занимаешься в свободное время?"
        ]
    },
    {
        title: 'Начало с общих интересов',
        icon: '🎭',
        messages: [
            "Привет! Заметил(а), что тебе нравится музыка. Какие группы слушаешь в последнее время?",
            "Привет! Вижу, ты интересуешься кино. Какой фильм порекомендуешь посмотреть?"
        ]
    },
    {
        title: 'Начало с открытого вопроса',
        icon: '💭',
        messages: [
            "Привет! Что-нибудь интересное случилось с тобой на этой неделе?",
            "Привет! Если бы ты мог(ла) отправиться сейчас в любую точку мира, куда бы поехал(а)?"
        ]
    }
];

// Примеры успешных диалогов
const successfulDialogues = [
    {
        title: 'Разговор о путешествиях',
        icon: '✈️',
        dialogue: [
            { sender: 'Пользователь 1', message: 'Привет! Ты когда-нибудь путешествовал(а) за границу?' },
            { sender: 'Пользователь 2', message: 'Привет! Да, был(а) в нескольких странах Европы. А ты?' },
            { sender: 'Пользователь 1', message: 'Пока только мечтаю. Какая страна тебе понравилась больше всего?' },
            { sender: 'Пользователь 2', message: 'Италия! Невероятная атмосфера, вкусная еда и столько интересных мест!' },
            { sender: 'Пользователь 1', message: 'Круто! А что именно посмотреть там советуешь?' },
            { sender: 'Пользователь 2', message: 'Определенно Рим, Флоренцию и Венецию. В каждом городе своя атмосфера и история.' }
        ]
    },
    {
        title: 'Обсуждение книг',
        icon: '📚',
        dialogue: [
            { sender: 'Пользователь 1', message: 'Привет! Любишь читать? Какую книгу сейчас читаешь?' },
            { sender: 'Пользователь 2', message: 'Привет! Да, обожаю! Сейчас читаю "Мастер и Маргарита". А ты?' },
            { sender: 'Пользователь 1', message: 'О, классика! Я недавно закончил(а) "1984" Оруэлла. Впечатляет, но немного мрачно.' },
            { sender: 'Пользователь 2', message: 'Соглашусь, сильная книга. Какой жанр литературы тебе больше всего нравится?' },
            { sender: 'Пользователь 1', message: 'Фантастика и научная фантастика. А ещё иногда детективы.' },
            { sender: 'Пользователь 2', message: 'У нас похожие вкусы! Могу порекомендовать серию "Пространство" - отличная научная фантастика.' }
        ]
    }
];

// Вопросы для мини-теста
const quizQuestions = [
    {
        question: "Какой подход лучше всего работает при начале разговора с новым человеком?",
        options: [
            "Задать личный вопрос о семье и отношениях",
            "Начать с приветствия и открытого вопроса или общей темы",
            "Сразу делиться своими проблемами, чтобы вызвать сочувствие",
            "Отправить много сообщений подряд, чтобы привлечь внимание"
        ],
        correctAnswer: 1
    },
    {
        question: "Что НЕ рекомендуется делать при начале общения?",
        options: [
            "Проявлять интерес к собеседнику",
            "Задавать открытые вопросы",
            "Писать слишком длинные сообщения с множеством личных деталей",
            "Упоминать общие интересы"
        ],
        correctAnswer: 2
    },
    {
        question: "Какой из примеров является наиболее удачным для начала разговора?",
        options: [
            "Привет, ты красивая/красивый, сколько тебе лет?",
            "Привет! Чем увлекаешься в свободное время?",
            "Привет! Почему так долго не отвечаешь?",
            "Привет, можешь скинуть свое фото?"
        ],
        correctAnswer: 1
    },
    {
        question: "Как лучше всего поддерживать диалог с собеседником?",
        options: [
            "Задавать только закрытые вопросы с ответами да/нет",
            "Переводить тему, если собеседник увлекся рассказом",
            "Показывать искренний интерес и задавать уточняющие вопросы по теме",
            "Отвечать односложно, чтобы собеседник больше рассказывал о себе"
        ],
        correctAnswer: 2
    },
    {
        question: "Что делать, если разговор зашел в тупик?",
        options: [
            "Сразу завершить беседу",
            "Продолжать настаивать на прежней теме",
            "Начать новую тему, связанную с увлечениями или интересами",
            "Молчать и ждать, пока собеседник предложит новую тему"
        ],
        correctAnswer: 2
    }
];

const OnboardingTutorial = ({ onComplete }) => {
    const { isTelegramApp, WebApp } = useTelegram();

    const [activeStep, setActiveStep] = useState(0);
    const [answers, setAnswers] = useState({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [quizScore, setQuizScore] = useState(0);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [selectedDialogue, setSelectedDialogue] = useState(null);
    const [darkMode, setDarkMode] = useState(false);

    const steps = [
        { title: 'Введение', icon: '📝' },
        { title: 'Примеры', icon: '💬' },
        { title: 'Диалоги', icon: '👥' },
        { title: 'Тест', icon: '✅' },
        { title: 'Результаты', icon: '🏆' }
    ];

    // Проверяем цветовую схему Telegram
    useEffect(() => {
        if (isTelegramApp && WebApp) {
            setDarkMode(WebApp.colorScheme === 'dark');
        } else {
            // Проверка темной темы системы для веб-версии
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setDarkMode(prefersDark);
        }
        
        // Слушатель изменения темы
        const handleThemeChange = () => {
            if (isTelegramApp && WebApp) {
                setDarkMode(WebApp.colorScheme === 'dark');
            }
        };
        
        if (isTelegramApp && WebApp) {
            WebApp.onEvent('themeChanged', handleThemeChange);
        }
        
        return () => {
            if (isTelegramApp && WebApp) {
                WebApp.offEvent('themeChanged', handleThemeChange);
            }
        };
    }, [isTelegramApp, WebApp]);

    const handleNext = () => {
        try {
            // Проверка ответов на тест
            if (activeStep === 3 && !quizSubmitted) {
                if (Object.keys(answers).length < quizQuestions.length) {
                    setAlertMessage('Пожалуйста, ответьте на все вопросы теста');
                    setShowAlert(true);
                    
                    if (isTelegramApp) {
                        triggerHapticFeedback('error');
                    }
                    
                    return;
                }

                // Подсчет правильных ответов
                let score = 0;
                quizQuestions.forEach((q, index) => {
                    if (answers[index] === q.correctAnswer) {
                        score++;
                    }
                });

                setQuizScore(score);
                setQuizSubmitted(true);
                
                if (isTelegramApp) {
                    triggerHapticFeedback('success');
                }
            }
            
            // Если пытаемся перейти на страницу результатов, но тест не пройден
            if (activeStep === 3 && !quizSubmitted) {
                return;
            }

            // Если последний шаг - завершаем руководство
            if (activeStep === steps.length - 1) {
                if (isTelegramApp) {
                    triggerHapticFeedback('medium');
                }
                
                if (onComplete) {
                    onComplete();
                }
            } else {
                if (isTelegramApp) {
                    triggerHapticFeedback('light');
                }
                
                setActiveStep((prevStep) => prevStep + 1);
            }
        } catch (error) {
            console.error("Ошибка при переходе к следующему шагу:", error);
        }
    };

    const handleBack = () => {
        try {
            if (isTelegramApp) {
                triggerHapticFeedback('light');
            }
            
            setActiveStep((prevStep) => prevStep - 1);
        } catch (error) {
            console.error("Ошибка при переходе к предыдущему шагу:", error);
        }
    };

    const handleAnswerChange = (questionIndex, optionIndex) => {
        if (isTelegramApp) {
            triggerHapticFeedback('selection');
        }
        
        setAnswers({
            ...answers,
            [questionIndex]: optionIndex
        });
    };

    const handleAlertClose = () => {
        setShowAlert(false);
    };

    const showFullDialogue = (index) => {
        if (isTelegramApp) {
            triggerHapticFeedback('light');
        }
        
        setSelectedDialogue(index);
    };

    const closeFullDialogue = () => {
        if (isTelegramApp) {
            triggerHapticFeedback('light');
        }
        
        setSelectedDialogue(null);
    };

    // Выбор конкретного шага руководства
    const goToStep = (stepIndex) => {
        if (isTelegramApp) {
            triggerHapticFeedback('light');
        }
        
        // Проверка доступа к вкладке "Результаты"
        if (stepIndex === 4 && !quizSubmitted) {
            setAlertMessage('Пожалуйста, сначала пройдите тест');
            setShowAlert(true);
            
            if (isTelegramApp) {
                triggerHapticFeedback('error');
            }
            return;
        }
        
        setActiveStep(stepIndex);
    };

    // Отрисовка шагов навигации
    const renderSteps = () => {
        return (
            <div className="tg-tutorial-tabs">
                {steps.map((step, index) => (
                    <div 
                        key={index}
                        className={`tg-tutorial-tab ${activeStep === index ? 'active' : ''} ${index === 4 && !quizSubmitted ? 'disabled' : ''}`}
                        onClick={() => goToStep(index)}
                    >
                        {step.title}
                    </div>
                ))}
                <div className="tg-tab-indicator" style={{ left: `${(activeStep / steps.length) * 100}%` }}></div>
            </div>
        );
    };

    // Отрисовка контента для текущего шага
    const renderStepContent = () => {
        switch (activeStep) {
            case 0: // Введение
                return (
                    <div className="tg-step-content">
                        <div className="tg-step-header">
                            <div className="tg-step-icon">{steps[activeStep].icon}</div>
                            <h2>Добро пожаловать в Анонимный чат!</h2>
                        </div>
                        
                        <p className="tg-step-description">
                            Это краткое руководство поможет вам разобраться, как начать общение и найти интересных собеседников.
                        </p>
                        
                        <div className="tg-content-card">
                            <p>
                                <strong>Анонимный чат</strong> — это сервис, который позволяет вам общаться с незнакомыми людьми по всему миру, сохраняя при этом вашу анонимность.
                            </p>
                            <p>
                                Вы можете находить собеседников по интересам, вести как короткие, так и длительные беседы без необходимости раскрывать свою личность.
                            </p>
                        </div>
                        
                        <div className="tg-content-card">
                            <p>
                                <strong>Как это работает:</strong>
                            </p>
                            <p>
                                1. Нажмите кнопку "Найти собеседника" на главном экране
                            </p>
                            <p>
                                2. Дождитесь, пока система найдет вам подходящего собеседника
                            </p>
                            <p>
                                3. Начните общение и наслаждайтесь беседой!
                            </p>
                        </div>
                        
                        <div className="tg-tip-block">
                            <div className="tg-tip-icon">💡</div>
                            <p>Используйте навигационные кнопки внизу для перехода между этапами руководства.</p>
                        </div>
                    </div>
                );

            case 1: // Примеры
                return (
                    <div className="tg-step-content">
                        <div className="tg-step-header">
                            <div className="tg-step-icon">{steps[activeStep].icon}</div>
                            <h2>Примеры начала общения</h2>
                        </div>
                        
                        <p className="tg-step-description">
                            Начать разговор иногда бывает сложно. Вот несколько примеров, которые помогут вам начать интересный диалог:
                        </p>
                        
                        <div className="tg-examples-grid">
                            {chatExamples.map((example, index) => (
                                <div className="tg-example-card" key={index}>
                                    <div className="tg-example-header">
                                        <div className="tg-example-icon">{example.icon}</div>
                                        <h3>{example.title}</h3>
                                    </div>
                                    <div className="tg-example-content">
                                        {example.messages.map((message, msgIndex) => (
                                            <div className="tg-example-message" key={msgIndex}>
                                                <div className="tg-message-bubble">{message}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="tg-tip-block">
                            <div className="tg-tip-icon">💡</div>
                            <p>Задавайте открытые вопросы, которые требуют развернутого ответа, а не просто "да" или "нет".</p>
                        </div>
                    </div>
                );

            case 2: // Диалоги
                return (
                    <div className="tg-step-content">
                        <div className="tg-step-header">
                            <div className="tg-step-icon">{steps[activeStep].icon}</div>
                            <h2>Примеры успешных диалогов</h2>
                        </div>
                        
                        <p className="tg-step-description">
                            Посмотрите, как могут развиваться интересные беседы. Нажмите на любой пример, чтобы увидеть полный диалог:
                        </p>
                        
                        <div className="tg-dialogues-list">
                            {successfulDialogues.map((dialogue, index) => (
                                <div 
                                    className="tg-dialogue-card" 
                                    key={index}
                                    onClick={() => showFullDialogue(index)}
                                >
                                    <div className="tg-dialogue-icon">{dialogue.icon}</div>
                                    <div className="tg-dialogue-info">
                                        <h3>{dialogue.title}</h3>
                                        <p>{dialogue.dialogue.length} сообщений · Нажмите, чтобы просмотреть</p>
                                    </div>
                                    <div className="tg-dialogue-arrow">→</div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="tg-tip-block">
                            <div className="tg-tip-icon">💡</div>
                            <p>Хорошая беседа — это обмен мнениями и вопросами. Старайтесь поддерживать баланс между рассказом о себе и проявлением интереса к собеседнику.</p>
                        </div>
                    </div>
                );

            case 3: // Тест
                return (
                    <div className="tg-step-content">
                        <div className="tg-step-header">
                            <div className="tg-step-icon">{steps[activeStep].icon}</div>
                            <h2>Проверьте свои знания</h2>
                        </div>
                        
                        <p className="tg-step-description">
                            Ответьте на несколько вопросов, чтобы проверить, как хорошо вы усвоили материал:
                        </p>
                        
                        <div className="tg-quiz-container">
                            {quizQuestions.map((question, qIndex) => (
                                <div className="tg-quiz-question" key={qIndex}>
                                    <div className="tg-question-text">
                                        <span className="tg-question-number">{qIndex + 1}.</span> {question.question}
                                    </div>
                                    <div className="tg-options-list">
                                        {question.options.map((option, oIndex) => (
                                            <div 
                                                className={`tg-option ${answers[qIndex] === oIndex ? 'selected' : ''} ${
                                                    quizSubmitted 
                                                        ? (oIndex === question.correctAnswer ? 'correct' : answers[qIndex] === oIndex ? 'incorrect' : '') 
                                                        : ''
                                                }`}
                                                key={oIndex}
                                                onClick={() => !quizSubmitted && handleAnswerChange(qIndex, oIndex)}
                                            >
                                                <div className="tg-option-marker">
                                                    {quizSubmitted && oIndex === question.correctAnswer && '✓'}
                                                    {quizSubmitted && answers[qIndex] === oIndex && oIndex !== question.correctAnswer && '✗'}
                                                </div>
                                                <div className="tg-option-text">{option}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {quizSubmitted && (
                            <div className={`tg-quiz-result ${quizScore === quizQuestions.length ? 'perfect' : ''}`}>
                                <div className="tg-quiz-score-icon">
                                    {quizScore === quizQuestions.length ? '🏆' : '📝'}
                                </div>
                                <div className="tg-quiz-score">
                                    <h3>Ваш результат:</h3>
                                    <div className="tg-score-text">{quizScore} из {quizQuestions.length}</div>
                                    <p className="tg-score-message">
                                        {quizScore === quizQuestions.length 
                                            ? 'Отлично! Вы полностью усвоили материал.' 
                                            : quizScore > quizQuestions.length / 2 
                                                ? 'Хороший результат. Обратите внимание на вопросы с ошибками.' 
                                                : 'Рекомендуем повторить материал и попробовать снова.'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                );

            case 4: // Результаты
                return (
                    <div className="tg-step-content">
                        <div className="tg-step-header">
                            <div className="tg-step-icon">{steps[activeStep].icon}</div>
                            <h2>Готовы к общению!</h2>
                        </div>
                        
                        <div className="tg-completion-content">
                            <div className="tg-completion-icon">🎉</div>
                            
                            <p>
                                Поздравляем! Вы прошли руководство по использованию Анонимного чата.
                                Теперь вы знаете основы, которые помогут вам находить интересных собеседников и вести увлекательные беседы.
                            </p>
                            
                            <div className="tg-quiz-result-summary">
                                <h3>Результат теста:</h3>
                                <div className="tg-score-text">{quizScore} из {quizQuestions.length} ({Math.round(quizScore / quizQuestions.length * 100)}%)</div>
                                <p className="tg-score-message">
                                    {quizScore === quizQuestions.length 
                                        ? 'Отлично! Вы полностью усвоили материал.' 
                                        : quizScore > quizQuestions.length / 2 
                                            ? 'Хороший результат. Возможно, стоит повторить некоторые темы.' 
                                            : 'Рекомендуем повторить материал и попробовать тест снова.'}
                                </p>
                            </div>
                            
                            <div className="tg-key-points">
                                <h3>Ключевые моменты:</h3>
                                <ul>
                                    <li>
                                        <div className="tg-point-icon">👤</div>
                                        Уважайте собеседника
                                    </li>
                                    <li>
                                        <div className="tg-point-icon">❓</div>
                                        Задавайте открытые вопросы
                                    </li>
                                    <li>
                                        <div className="tg-point-icon">👂</div>
                                        Проявляйте искренний интерес
                                    </li>
                                </ul>
                            </div>
                            
                            <p className="tg-final-message">
                                Желаем вам приятных и интересных бесед!
                            </p>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    // Определение классов для контейнера
    const containerClasses = `tg-tutorial-container ${darkMode ? 'dark-mode' : 'light-mode'}`;

    return (
        <div className={containerClasses}>
            {/* Навигационные табы */}
            {renderSteps()}
            
            {/* Содержимое текущего шага */}
            <div className="tg-step-container">
                {renderStepContent()}
            </div>
            
            {/* Модальное окно с предупреждением */}
            {showAlert && (
                <div className="tg-alert">
                    <div className="tg-alert-content">
                        <div className="tg-alert-icon">⚠️</div>
                        <div className="tg-alert-message">{alertMessage}</div>
                        <button className="tg-alert-close" onClick={handleAlertClose}>
                            OK
                        </button>
                    </div>
                </div>
            )}
            
            {/* Модальное окно с диалогом */}
            {selectedDialogue !== null && (
                <div className="tg-dialogue-modal">
                    <div className="tg-dialogue-modal-content">
                        <div className="tg-dialogue-modal-header">
                            <h3>{successfulDialogues[selectedDialogue].title}</h3>
                            <button className="tg-dialogue-close-btn" onClick={closeFullDialogue}>✕</button>
                        </div>
                        <div className="tg-dialogue-messages">
                            {successfulDialogues[selectedDialogue].dialogue.map((msg, i) => (
                                <div key={i} className={`tg-dialogue-message ${i % 2 === 0 ? 'user1' : 'user2'}`}>
                                    <div className="tg-message-sender">{msg.sender}</div>
                                    <div className="tg-message-bubble">{msg.message}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Кнопки навигации */}
            <div className="tg-navigation-buttons">
                <button
                    className="tg-nav-button tg-back-button"
                    onClick={handleBack}
                    disabled={activeStep === 0}
                >
                    Назад
                </button>
                
                <div className="tg-progress-dots">
                    {steps.map((_, index) => (
                        <div 
                            key={index}
                            className={`tg-progress-dot ${activeStep === index ? 'active' : ''}`}
                            onClick={() => goToStep(index)}
                        ></div>
                    ))}
                </div>
                
                <button
                    className="tg-nav-button tg-next-button"
                    onClick={handleNext}
                >
                    {activeStep === steps.length - 1 ? 'Завершить' : 'Далее'}
                </button>
            </div>
        </div>
    );
};

export default OnboardingTutorial;
