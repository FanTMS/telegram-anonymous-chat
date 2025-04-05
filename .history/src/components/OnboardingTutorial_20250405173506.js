import React, { useState } from 'react';
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

    const totalSteps = 4; // Вступление, примеры, тест, результаты

    const handleNext = () => {
        if (activeStep === 2 && !quizSubmitted) {
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
        }
        
        if (activeStep === totalSteps - 1) {
            // Завершение обучения
            if (onComplete) {
                onComplete();
            }
        } else {
            setActiveStep((prevStep) => prevStep + 1);
        }
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
    };

    const handleAnswerChange = (questionIndex, optionIndex) => {
        setAnswers({
            ...answers,
            [questionIndex]: optionIndex
        });
    };

    const handleAlertClose = () => {
        setShowAlert(false);
    };

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <div className="step-content">
                        <h2 className="step-title">Руководство по общению в анонимном чате</h2>
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
                            В этом руководстве мы рассмотрим примеры удачного начала разговора 
                            и проверим ваши знания с помощью небольшого теста.
                        </p>
                    </div>
                );
            case 1:
                return (
                    <div className="step-content">
                        <h2 className="step-title">Примеры начала общения</h2>
                        <p>
                            Начало разговора часто определяет его дальнейший ход. Вот несколько примеров, 
                            как можно начать общение:
                        </p>

                        {chatExamples.map((example, index) => (
                            <div className="example-container" key={index}>
                                <h3 className="example-title">{example.title}</h3>
                                {example.messages.map((message, msgIndex) => (
                                    <div className="chat-example" key={msgIndex}>
                                        <p>{message}</p>
                                    </div>
                                ))}
                            </div>
                        ))}

                        <p><strong>Рекомендации:</strong></p>
                        <ul>
                            <li>Начинайте с приветствия и открытого вопроса</li>
                            <li>Проявляйте искренний интерес к собеседнику</li>
                            <li>Избегайте слишком личных вопросов в начале разговора</li>
                            <li>Будьте вежливы и уважительны</li>
                            <li>Дайте собеседнику время на ответ</li>
                        </ul>
                    </div>
                );
            case 2:
                return (
                    <div className="step-content">
                        <h2 className="step-title">Проверьте свои знания</h2>
                        <p>
                            Пройдите небольшой тест, чтобы проверить, как хорошо вы усвоили материал:
                        </p>

                        {quizQuestions.map((q, index) => (
                            <div className="quiz-question" key={index}>
                                <h3>{index + 1}. {q.question}</h3>
                                <div className="quiz-options">
                                    {q.options.map((option, optionIndex) => (
                                        <div className="quiz-option" key={optionIndex}>
                                            <label className={quizSubmitted ? (optionIndex === q.correctAnswer ? "correct" : answers[index] === optionIndex ? "incorrect" : "") : ""}>
                                                <input
                                                    type="radio"
                                                    name={`question-${index}`}
                                                    value={optionIndex}
                                                    checked={answers[index] === optionIndex}
                                                    onChange={() => handleAnswerChange(index, optionIndex)}
                                                    disabled={quizSubmitted}
                                                />
                                                {option}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                {quizSubmitted && (
                                    <div className={answers[index] === q.correctAnswer ? "feedback correct" : "feedback incorrect"}>
                                        {answers[index] === q.correctAnswer 
                                            ? '✓ Правильно!' 
                                            : `✗ Неверно. Правильный ответ: ${q.options[q.correctAnswer]}`}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                );
            case 3:
                return (
                    <div className="step-content">
                        <h2 className="step-title">Результаты теста</h2>
                        <div className="results-container">
                            <h3>Ваш результат: {quizScore} из {quizQuestions.length}</h3>
                            <p>
                                {quizScore === quizQuestions.length 
                                    ? 'Отлично! Вы готовы к общению в анонимном чате.' 
                                    : quizScore >= quizQuestions.length / 2 
                                        ? 'Хороший результат! Обратите внимание на ошибки и продолжайте практиковаться.' 
                                        : 'Рекомендуем еще раз ознакомиться с материалами и повторить тест.'}
                            </p>
                        </div>
                        <p>
                            Теперь вы знаете, как начинать общение в анонимном чате. Желаем вам приятных и интересных бесед!
                        </p>
                        <p>
                            Помните о главных принципах:
                        </p>
                        <ul>
                            <li>Уважение к собеседнику</li>
                            <li>Интерес к разговору</li>
                            <li>Позитивный настрой</li>
                            <li>Терпение</li>
                        </ul>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="tutorial-container">
            <div className="stepper">
                {Array.from({ length: totalSteps }).map((_, index) => (
                    <div 
                        key={index} 
                        className={`step ${index === activeStep ? 'active' : ''} ${index < activeStep ? 'completed' : ''}`}
                    >
                        <div className="step-indicator">{index + 1}</div>
                        <div className="step-label">
                            {index === 0 ? 'Введение' : 
                             index === 1 ? 'Примеры' :
                             index === 2 ? 'Тест' : 'Результаты'}
                        </div>
                    </div>
                ))}
            </div>

            {renderStepContent(activeStep)}

            <div className="button-container">
                <button
                    className="button secondary"
                    disabled={activeStep === 0}
                    onClick={handleBack}
                >
                    Назад
                </button>
                <button
                    className="button primary"
                    onClick={handleNext}
                >
                    {activeStep === totalSteps - 1 ? 'Завершить' : 'Далее'}
                </button>
            </div>

            {showAlert && (
                <div className="alert-message">
                    <p>{alertMessage}</p>
                    <button onClick={handleAlertClose}>Закрыть</button>
                </div>
            )}
        </div>
    );
};

export default OnboardingTutorial;
