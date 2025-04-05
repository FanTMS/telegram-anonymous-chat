import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/BeginnerGuide.css';

const BeginnerGuide = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [currentStep, setCurrentStep] = useState(0);
    const [loaded, setLoaded] = useState(false);

    // Важно: принудительно перерисовываем компонент при монтировании
    useEffect(() => {
        // Устанавливаем флаг загрузки для перерисовки содержимого
        setLoaded(true);
        
        // Добавляем обработчик изменения истории для повторной инициализации компонента
        const handleHistoryChange = () => {
            if (location.pathname === '/guide') {
                setLoaded(false);
                setTimeout(() => setLoaded(true), 50);
            }
        };
        
        window.addEventListener('popstate', handleHistoryChange);
        
        return () => {
            window.removeEventListener('popstate', handleHistoryChange);
        };
    }, [location.pathname]);

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

    // Если компонент еще не загружен, показываем заглушку
    if (!loaded) {
        return <div className="guide-loading">Загрузка руководства...</div>;
    }

    return (
        <div className="beginner-guide">
            <div className="guide-progress">
                <div
                    className="guide-progress-bar"
                    style={{ width: `${((currentStep + 1) / guideSteps.length) * 100}%` }}
                ></div>
            </div>

            <h1 className="guide-title">{guideSteps[currentStep].title}</h1>

            <div className="guide-content">
                <img
                    src={guideSteps[currentStep].image}
                    alt={guideSteps[currentStep].title}
                    className="guide-image"
                />
                <p>{guideSteps[currentStep].content}</p>
            </div>

            <div className="guide-nav">
                {currentStep > 0 && (
                    <button
                        className="guide-btn guide-btn-back"
                        onClick={() => setCurrentStep(currentStep - 1)}
                    >
                        Назад
                    </button>
                )}

                {currentStep < guideSteps.length - 1 ? (
                    <button
                        className="guide-btn guide-btn-next"
                        onClick={() => setCurrentStep(currentStep + 1)}
                    >
                        Далее
                    </button>
                ) : (
                    <button
                        className="guide-btn guide-btn-next"
                        onClick={() => navigate('/random-chat')}
                    >
                        Начать общение
                    </button>
                )}
            </div>
        </div>
    );
};

export default BeginnerGuide;
