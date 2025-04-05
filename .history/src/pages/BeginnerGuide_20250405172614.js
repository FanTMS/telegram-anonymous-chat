import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/BeginnerGuide.css';

const BeginnerGuide = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    // Принудительно обновляем компонент при загрузке
    useEffect(() => {
        setIsLoaded(true);
    }, []);
    
    const guideSteps = [
        {
            title: "Добро пожаловать в Анонимный чат!",
            content: "Это руководство познакомит вас с основными функциями приложения. Прокручивайте вниз, чтобы продолжить.",
            image: "/images/guide/welcome.svg"
        },
        {
            title: "Поиск собеседника",
            content: "Чтобы найти случайного собеседника, перейдите на вкладку «Поиск» и нажмите на кнопку. Мы подберем вам собеседника на основе ваших интересов.",
            image: "/images/guide/search.svg"
        },
        {
            title: "Общение в чате",
            content: "Общайтесь анонимно с вашим собеседником. Вы можете обмениваться текстовыми сообщениями, смайликами и стикерами.",
            image: "/images/guide/chat.svg"
        },
        {
            title: "Завершение чата",
            content: "Если вы хотите закончить разговор, нажмите кнопку меню (⋮) в верхнем правом углу чата и выберите «Завершить чат».",
            image: "/images/guide/end_chat.svg"
        },
        {
            title: "Ваши чаты",
            content: "Все ваши активные чаты доступны на вкладке «Чаты». Вы можете возвращаться к ним в любое время.",
            image: "/images/guide/chats_list.svg"
        },
        {
            title: "Настройки профиля",
            content: "В разделе «Профиль» вы можете изменить информацию о себе и свои интересы для более точного подбора собеседников.",
            image: "/images/guide/profile.svg"
        },
        {
            title: "Готово!",
            content: "Теперь вы знаете основы. Приятного общения!",
            image: "/images/guide/complete.svg"
        }
    ];

    const handleNextStep = () => {
        if (currentStep < guideSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            navigate('/home');
        }
    };

    const handlePrevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = () => {
        navigate('/home');
    };

    // Чтобы страница точно отрисовалась, даже если есть какие-то проблемы с React Router
    if (!isLoaded) {
        return <div className="guide-loading">Загрузка руководства...</div>;
    }

    const step = guideSteps[currentStep];
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === guideSteps.length - 1;

    return (
        <div className="guide-container">
            <div className="guide-progress">
                {guideSteps.map((_, index) => (
                    <div
                        key={index}
                        className={`guide-progress-dot ${index <= currentStep ? 'active' : ''}`}
                        onClick={() => setCurrentStep(index)}
                    />
                ))}
            </div>
            
            <div className="guide-content">
                <div className="guide-image-container">
                    <img 
                        src={step.image || '/images/guide/placeholder.svg'} 
                        alt={step.title}
                        className="guide-image" 
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/images/guide/placeholder.svg';
                        }}
                    />
                </div>
                
                <h1 className="guide-title">{step.title}</h1>
                <p className="guide-description">{step.content}</p>
            </div>
            
            <div className="guide-navigation">
                {!isFirstStep && (
                    <button className="guide-button secondary" onClick={handlePrevStep}>
                        Назад
                    </button>
                )}
                
                <button className="guide-button skip" onClick={handleSkip}>
                    {isLastStep ? 'Закрыть' : 'Пропустить'}
                </button>
                
                {!isLastStep && (
                    <button className="guide-button primary" onClick={handleNextStep}>
                        Далее
                    </button>
                )}
                
                {isLastStep && (
                    <button className="guide-button primary" onClick={handleNextStep}>
                        Завершить
                    </button>
                )}
            </div>
        </div>
    );
};

export default BeginnerGuide;
