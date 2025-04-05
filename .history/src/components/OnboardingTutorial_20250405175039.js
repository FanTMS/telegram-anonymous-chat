import React, { useState, useEffect, useCallback } from 'react';
import { 
    isTelegramApp, 
    triggerHapticFeedback, 
    setupMainButton, 
    hideMainButton 
} from '../utils/telegramUtils';
import '../styles/OnboardingTutorial.css';

// Примеры начала общения
const chatExamples = [
    {
        title: 'Нейтральное начало',
        messages: [
            "Привет! Рад(а) познакомиться. Как твои дела сегодня?",
            "Привет! Чем обычно занимаешься в свободное время?"
        ]
    },
    {
        title: 'Начало с общих интересов',
        messages: [
            "Привет! Заметил(а), что тебе нравится музыка. Какие группы слушаешь в последнее время?",
            "Привет! Вижу, ты интересуешься кино. Какой фильм порекомендуешь посмотреть?"
        ]
    },
    {
        title: 'Начало с открытого вопроса',
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
    }
];

const OnboardingTutorial = ({ onComplete }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [answers, setAnswers] = useState({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [quizScore, setQuizScore] = useState(0);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [selectedDialogue, setSelectedDialogue] = useState(null);
    const [animationKey, setAnimationKey] = useState(0);
    const [isTelegram, setIsTelegram] = useState(false);

    const totalSteps = 5; // Вступление, примеры, успешные диалоги, тест, результаты

    // Проверяем, запущено ли приложение в Telegram
    useEffect(() => {
        setIsTelegram(isTelegramApp());
    }, []);

    // Обработчик нажатия кнопки "Далее"
    const handleNext = useCallback(() => {
        // Хаптическая обратная связь для Telegram
        if (isTelegram) {
            triggerHapticFeedback('impact');
        }

        if (activeStep === 3 && !quizSubmitted) {
            // Проверка, ответил ли пользователь на все вопросы теста
            if (Object.keys(answers).length < quizQuestions.length) {
                setAlertMessage('Пожалуйста, ответьте на все вопросы теста');
                setShowAlert(true);
                return;
            }
            
            // Проверка ответов на тест
            let score = 0;
            quizQuestions.forEach((q, index) => {
                if (answers[index] === q.correctAnswer) {
                    score++;
                }
            });
            
            setQuizScore(score);
            setQuizSubmitted(true);
            
            // Хаптическая обратная связь для результатов
            if (isTelegram) {
                triggerHapticFeedback('notification');
            }
        }
        
        if (activeStep === totalSteps - 1) {
            // Завершение обучения
            if (onComplete) {
                onComplete();
            }
        } else {
            // Переход к следующему шагу
            setActiveStep((prevStep) => prevStep + 1);
            
            // Прокрутка страницы вверх для мобильных
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [activeStep, answers, quizSubmitted, quizQuestions, onComplete, isTelegram]);

    // Обработчик нажатия кнопки "Назад"
    const handleBack = useCallback(() => {
        // Хаптическая обратная связь для Telegram
        if (isTelegram) {
            triggerHapticFeedback('impact');
        }
        
        setActiveStep((prevStep) => prevStep - 1);
        
        // Прокрутка страницы вверх для мобильных
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [isTelegram]);

    // Настройка основной кнопки Telegram
    useEffect(() => {
        if (isTelegram) {
            const buttonText = activeStep === totalSteps - 1 ? 'Завершить' : 'Далее';
            setupMainButton(buttonText, handleNext);
            
            return () => {
                hideMainButton();
            };
        }
    }, [activeStep, totalSteps, handleNext, isTelegram]);

    // Обновление дополнительной кнопки "Назад" для Telegram
    useEffect(() => {
        const updateBackButton = () => {
            if (isTelegram && activeStep > 0) {
                // Здесь можно добавить кнопку "Назад" в интерфейс Telegram,
                // если такая функциональность будет доступна в API
            }
        };
        
        updateBackButton();
    }, [activeStep, isTelegram]);

    const handleAnswerChange = (questionIndex, optionIndex) => {
        setAnswers({
            ...answers,
            [questionIndex]: optionIndex
        });
    };

    const handleAlertClose = () => {
        setShowAlert(false);
    };

    const showFullDialogue = (index) => {
        setSelectedDialogue(index);
    };

    const closeFullDialogue = () => {
        setSelectedDialogue(null);
    };

    // Обновление data-атрибута для CSS анимаций
    useEffect(() => {
        // Добавим небольшую задержку, чтобы анимация выхода могла сработать
        const timer = setTimeout(() => {
            setAnimationKey(prevKey => prevKey + 1);
        }, 50);
        return () => clearTimeout(timer);
    }, [activeStep]);

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <div className="step-content">
                        <h2>Руководство по общению в анонимном чате</h2>
                        <p>
                            Добро пожаловать в наш анонимный чат! Это руководство поможет вам начать общение
                            и сделать его комфортным и приятным для всех участников.
                        </p>
                        <p>
                            Анонимный чат — это возможность познакомиться с новыми людьми,
                            не раскрывая личную информацию. Но даже при анонимном общении
                            важно соблюдать уважение и этикет.
                        </p>
                        <p>
                            В этом руководстве мы рассмотрим примеры удачного начала разговора,
                            примеры успешных диалогов и проверим ваши знания с помощью небольшого теста.
                        </p>
                    </div>
                );

            case 1:
                return (
                    <div className="step-content">
                        <h2>Примеры начала общения</h2>
                        <p>
                            Начало разговора часто определяет его дальнейший ход. Вот несколько примеров,
                            как можно начать общение:
                        </p>

                        <div className="examples-container">
                            {chatExamples.map((example, index) => (
                                <div className="example-card" key={index}>
                                    <h3>{example.title}</h3>
                                    {example.messages.map((message, msgIndex) => (
                                        <div className="chat-example" key={msgIndex}>
                                            <p>{message}</p>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>

                        <div className="recommendations">
                            <h3>Рекомендации:</h3>
                            <ul>
                                <li>Начинайте с приветствия и открытого вопроса</li>
                                <li>Проявляйте искренний интерес к собеседнику</li>
                                <li>Избегайте слишком личных вопросов в начале разговора</li>
                                <li>Будьте вежливы и уважительны</li>
                                <li>Дайте собеседнику время на ответ</li>
                            </ul>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="step-content">
                        <h2>Примеры успешных диалогов</h2>
                        <p>
                            Посмотрите, как могут развиваться интересные диалоги между собеседниками:
                        </p>

                        <div className="successful-dialogues">
                            {successfulDialogues.map((dialogue, index) => (
                                <div className="dialogue-card" key={index}>
                                    <h3>{dialogue.title}</h3>
                                    <div className="dialogue-preview">
                                        {dialogue.dialogue.slice(0, 2).map((msg, msgIndex) => (
                                            <div className={`message ${msg.sender === 'Пользователь 1' ? 'user1' : 'user2'}`} key={msgIndex}>
                                                <div className="sender">{msg.sender}:</div>
                                                <div className="message-text">{msg.message}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="view-btn" onClick={() => showFullDialogue(index)}>
                                        Посмотреть полный диалог
                                    </button>
                                </div>
                            ))}
                        </div>

                        {selectedDialogue !== null && (
                            <div className="dialogue-modal">
                                <div className="dialogue-content">
                                    <h3>{successfulDialogues[selectedDialogue].title}</h3>
                                    <div className="full-dialogue">
                                        {successfulDialogues[selectedDialogue].dialogue.map((msg, msgIndex) => (
                                            <div className={`message ${msg.sender === 'Пользователь 1' ? 'user1' : 'user2'}`} key={msgIndex}>
                                                <div className="sender">{msg.sender}:</div>
                                                <div className="message-text">{msg.message}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <button className="close-btn" onClick={closeFullDialogue}>Закрыть</button>
                                </div>
                            </div>
                        )}

                        <div className="dialogue-tips">
                            <h3>Что делает эти диалоги успешными:</h3>
                            <ul>
                                <li>Собеседники задают открытые вопросы</li>
                                <li>Они проявляют интерес к ответам друг друга</li>
                                <li>Делятся своим опытом и мнениями</li>
                                <li>Разговор развивается естественно, от общего к более конкретному</li>
                                <li>Оба участника вносят вклад в беседу</li>
                            </ul>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="step-content">
                        <h2>Проверьте свои знания</h2>
                        <p>
                            Пройдите небольшой тест, чтобы проверить, как хорошо вы усвоили материал:
                        </p>

                        <div className="quiz-container">
                            {quizQuestions.map((q, index) => (
                                <div className="quiz-question" key={index}>
                                    <h3>{index + 1}. {q.question}</h3>
                                    <div className="options-container">
                                        {q.options.map((option, optionIndex) => (
                                            <div className="option" key={optionIndex}>
                                                <input
                                                    type="radio"
                                                    id={`q${index}o${optionIndex}`}
                                                    name={`question${index}`}
                                                    value={optionIndex}
                                                    checked={answers[index] === optionIndex}
                                                    onChange={() => handleAnswerChange(index, optionIndex)}
                                                    disabled={quizSubmitted}
                                                />
                                                <label htmlFor={`q${index}o${optionIndex}`}>{option}</label>
                                            </div>
                                        ))}
                                    </div>
                                    {quizSubmitted && (
                                        <div className={`result ${answers[index] === q.correctAnswer ? 'correct' : 'incorrect'}`}>
                                            {answers[index] === q.correctAnswer
                                                ? '✓ Правильно!'
                                                : `✗ Неверно. Правильный ответ: ${q.options[q.correctAnswer]}`}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="step-content">
                        <h2>Результаты теста</h2>
                        <div className="results-container">
                            <div className="score-card">
                                <h3>Ваш результат: {quizScore} из {quizQuestions.length}</h3>
                                <p>
                                    {quizScore === quizQuestions.length
                                        ? 'Отлично! Вы готовы к общению в анонимном чате.'
                                        : quizScore >= quizQuestions.length / 2
                                            ? 'Хороший результат! Обратите внимание на ошибки и продолжайте практиковаться.'
                                            : 'Рекомендуем еще раз ознакомиться с материалами и повторить тест.'}
                                </p>
                            </div>
                        </div>
                        <p>
                            Теперь вы знаете, как начинать общение в анонимном чате. Желаем вам приятных и интересных бесед!
                        </p>
                        <div className="final-tips">
                            <h3>Помните о главных принципах:</h3>
                            <ul>
                                <li>Уважение к собеседнику</li>
                                <li>Интерес к разговору</li>
                                <li>Позитивный настрой</li>
                                <li>Терпение</li>
                            </ul>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    // Определяем классы для контейнера в зависимости от платформы
    const containerClasses = `tutorial-container ${isTelegram ? 'telegram-app-container' : ''}`;

    return (
        <div className={containerClasses} data-step={activeStep} key={animationKey}>
            <div className="stepper-scroll-container">
                <div className="stepper">
                    <div className={`step ${activeStep === 0 ? 'active' : ''}`}>Введение</div>
                    <div className={`step ${activeStep === 1 ? 'active' : ''}`}>Примеры</div>
                    <div className={`step ${activeStep === 2 ? 'active' : ''}`}>Диалоги</div>
                    <div className={`step ${activeStep === 3 ? 'active' : ''}`}>Тест</div>
                    <div className={`step ${activeStep === 4 ? 'active' : ''}`}>Результаты</div>
                </div>
            </div>

            {renderStepContent(activeStep)}

            {/* Кнопки навигации (отображаются только если не в Telegram) */}
            {!isTelegram && (
                <div className="button-container">
                    <button
                        className="btn back-btn"
                        disabled={activeStep === 0}
                        onClick={handleBack}
                    >
                        Назад
                    </button>
                    <button
                        className="btn next-btn"
                        onClick={handleNext}
                    >
                        {activeStep === totalSteps - 1 ? 'Завершить' : 'Далее'}
                    </button>
                </div>
            )}
            
            {/* Для Telegram показываем альтернативную кнопку "Назад" */}
            {isTelegram && activeStep > 0 && (
                <div className="telegram-back-button-container">
                    <button
                        className="btn back-btn tg-haptic-btn"
                        onClick={handleBack}
                    >
                        Назад
                    </button>
                </div>
            )}

            {/* SafeArea для устройств с "челками" и закругленными углами */}
            <div className="safe-area-bottom"></div>

            {showAlert && (
                <div className="alert">
                    <div className="alert-content">
                        <p>{alertMessage}</p>
                        <button 
                            className="tg-haptic-btn"
                            onClick={handleAlertClose}
                        >
                            ОК
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OnboardingTutorial;
