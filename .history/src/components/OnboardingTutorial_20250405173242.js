import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Stepper, Step, StepLabel, Card, CardContent, Radio, RadioGroup, FormControlLabel, FormControl, Snackbar, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';

const TutorialContainer = styled(Box)(({ theme }) => ({
    padding: theme.spacing(3),
    maxWidth: '800px',
    margin: '0 auto',
}));

const StepContent = styled(Box)(({ theme }) => ({
    padding: theme.spacing(3),
    marginBottom: theme.spacing(2),
}));

const ButtonContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: theme.spacing(2),
}));

const ExampleContainer = styled(Card)(({ theme }) => ({
    marginBottom: theme.spacing(2),
    background: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
}));

const ExampleTitle = styled(Typography)(({ theme }) => ({
    fontWeight: 'bold',
    marginBottom: theme.spacing(1),
}));

const ChatExample = styled(Box)(({ theme }) => ({
    padding: theme.spacing(1),
    background: theme.palette.action.hover,
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(1),
}));

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
    const [alertSeverity, setAlertSeverity] = useState('success');

    const totalSteps = 4; // Вступление, примеры, тест, результаты

    const handleNext = () => {
        if (activeStep === 2 && !quizSubmitted) {
            // Проверка, ответил ли пользователь на все вопросы теста
            if (Object.keys(answers).length < quizQuestions.length) {
                setAlertMessage('Пожалуйста, ответьте на все вопросы теста');
                setAlertSeverity('warning');
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
                    <StepContent>
                        <Typography variant="h5" gutterBottom>
                            Руководство по общению в анонимном чате
                        </Typography>
                        <Typography paragraph>
                            Добро пожаловать в наш анонимный чат! Это руководство поможет вам начать общение 
                            и сделать его комфортным и приятным для всех участников.
                        </Typography>
                        <Typography paragraph>
                            Анонимный чат — это возможность познакомиться с новыми людьми, 
                            не раскрывая личную информацию. Но даже при анонимном общении 
                            важно соблюдать уважение и этикет.
                        </Typography>
                        <Typography paragraph>
                            В этом руководстве мы рассмотрим примеры удачного начала разговора 
                            и проверим ваши знания с помощью небольшого теста.
                        </Typography>
                    </StepContent>
                );
            case 1:
                return (
                    <StepContent>
                        <Typography variant="h5" gutterBottom>
                            Примеры начала общения
                        </Typography>
                        <Typography paragraph>
                            Начало разговора часто определяет его дальнейший ход. Вот несколько примеров, 
                            как можно начать общение:
                        </Typography>

                        {chatExamples.map((example, index) => (
                            <ExampleContainer key={index}>
                                <CardContent>
                                    <ExampleTitle variant="subtitle1">
                                        {example.title}
                                    </ExampleTitle>
                                    {example.messages.map((message, msgIndex) => (
                                        <ChatExample key={msgIndex}>
                                            <Typography variant="body2">
                                                {message}
                                            </Typography>
                                        </ChatExample>
                                    ))}
                                </CardContent>
                            </ExampleContainer>
                        ))}

                        <Typography paragraph>
                            <strong>Рекомендации:</strong>
                        </Typography>
                        <Typography component="ul">
                            <li>Начинайте с приветствия и открытого вопроса</li>
                            <li>Проявляйте искренний интерес к собеседнику</li>
                            <li>Избегайте слишком личных вопросов в начале разговора</li>
                            <li>Будьте вежливы и уважительны</li>
                            <li>Дайте собеседнику время на ответ</li>
                        </Typography>
                    </StepContent>
                );
            case 2:
                return (
                    <StepContent>
                        <Typography variant="h5" gutterBottom>
                            Проверьте свои знания
                        </Typography>
                        <Typography paragraph>
                            Пройдите небольшой тест, чтобы проверить, как хорошо вы усвоили материал:
                        </Typography>

                        {quizQuestions.map((q, index) => (
                            <Card key={index} sx={{ mb: 3, p: 2 }}>
                                <Typography variant="subtitle1" sx={{ mb: 2 }}>
                                    {index + 1}. {q.question}
                                </Typography>
                                <FormControl component="fieldset" disabled={quizSubmitted}>
                                    <RadioGroup
                                        value={answers[index] !== undefined ? answers[index] : ''}
                                        onChange={(e) => handleAnswerChange(index, parseInt(e.target.value))}
                                    >
                                        {q.options.map((option, optionIndex) => (
                                            <FormControlLabel
                                                key={optionIndex}
                                                value={optionIndex}
                                                control={<Radio />}
                                                label={option}
                                            />
                                        ))}
                                    </RadioGroup>
                                </FormControl>
                                {quizSubmitted && (
                                    <Box sx={{ mt: 1, p: 1, bgcolor: answers[index] === q.correctAnswer ? 'success.light' : 'error.light', borderRadius: 1 }}>
                                        <Typography>
                                            {answers[index] === q.correctAnswer 
                                                ? '✓ Правильно!' 
                                                : `✗ Неверно. Правильный ответ: ${q.options[q.correctAnswer]}`}
                                        </Typography>
                                    </Box>
                                )}
                            </Card>
                        ))}
                    </StepContent>
                );
            case 3:
                return (
                    <StepContent>
                        <Typography variant="h5" gutterBottom>
                            Результаты теста
                        </Typography>
                        <Paper elevation={3} sx={{ p: 3, textAlign: 'center', mb: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Ваш результат: {quizScore} из {quizQuestions.length}
                            </Typography>
                            <Typography variant="body1">
                                {quizScore === quizQuestions.length 
                                    ? 'Отлично! Вы готовы к общению в анонимном чате.' 
                                    : quizScore >= quizQuestions.length / 2 
                                        ? 'Хороший результат! Обратите внимание на ошибки и продолжайте практиковаться.' 
                                        : 'Рекомендуем еще раз ознакомиться с материалами и повторить тест.'}
                            </Typography>
                        </Paper>
                        <Typography paragraph>
                            Теперь вы знаете, как начинать общение в анонимном чате. Желаем вам приятных и интересных бесед!
                        </Typography>
                        <Typography paragraph>
                            Помните о главных принципах:
                        </Typography>
                        <Typography component="ul">
                            <li>Уважение к собеседнику</li>
                            <li>Интерес к разговору</li>
                            <li>Позитивный настрой</li>
                            <li>Терпение</li>
                        </Typography>
                    </StepContent>
                );
            default:
                return null;
        }
    };

    return (
        <TutorialContainer>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                <Step>
                    <StepLabel>Введение</StepLabel>
                </Step>
                <Step>
                    <StepLabel>Примеры</StepLabel>
                </Step>
                <Step>
                    <StepLabel>Тест</StepLabel>
                </Step>
                <Step>
                    <StepLabel>Результаты</StepLabel>
                </Step>
            </Stepper>

            {renderStepContent(activeStep)}

            <ButtonContainer>
                <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    variant="outlined"
                >
                    Назад
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleNext}
                >
                    {activeStep === totalSteps - 1 ? 'Завершить' : 'Далее'}
                </Button>
            </ButtonContainer>

            <Snackbar open={showAlert} autoHideDuration={6000} onClose={handleAlertClose}>
                <Alert onClose={handleAlertClose} severity={alertSeverity} sx={{ width: '100%' }}>
                    {alertMessage}
                </Alert>
            </Snackbar>
        </TutorialContainer>
    );
};

export default OnboardingTutorial;
