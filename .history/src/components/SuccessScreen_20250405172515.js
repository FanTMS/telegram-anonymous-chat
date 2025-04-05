import React, { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import { useNavigate } from 'react-router-dom';
import '../styles/SuccessScreen.css';

const SuccessScreen = ({ userData, redirectDelay = 3000 }) => {
    const navigate = useNavigate();
    const [showContent, setShowContent] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [countdown, setCountdown] = useState(Math.floor(redirectDelay / 1000));

    useEffect(() => {
        // Анимация появления контента
        const contentTimer = setTimeout(() => setShowContent(true), 500);
        const summaryTimer = setTimeout(() => setShowSummary(true), 1000);

        // Обратный отсчет
        const countdownInterval = setInterval(() => {
            setCountdown(prev => Math.max(0, prev - 1));
        }, 1000);

        // Автоматический редирект после отображения
        const redirectTimer = setTimeout(() => {
            try {
                navigate('/home');
            } catch (error) {
                console.error('Ошибка при перенаправлении:', error);
                // Резервный вариант в случае ошибки
                window.location.href = '/home';
            }
        }, redirectDelay);

        try {
            // Настраиваем кнопку Telegram WebApp
            WebApp.MainButton.setText('Начать общение');
            WebApp.MainButton.show();

            // Добавляем обработчик по нажатию на кнопку
            WebApp.MainButton.onClick(() => {
                navigate('/home');
            });
            
            // Уведомление об успешной регистрации
            WebApp.HapticFeedback.notificationOccurred('success');
        } catch (e) {
            console.warn('Не удалось настроить интерфейс Telegram WebApp:', e);
        }

        return () => {
            clearTimeout(contentTimer);
            clearTimeout(summaryTimer);
            clearTimeout(redirectTimer);
            clearInterval(countdownInterval);
            
            try {
                WebApp.MainButton.hide();
                WebApp.MainButton.offClick();
            } catch (e) {
                // Игнорируем ошибки очистки WebApp
            }
        };
    }, [navigate, redirectDelay]);

    return (
        <div className="success-screen">
            <div className={`success-content ${showContent ? 'show' : ''}`}>
                <div className="success-icon">✅</div>
                <h1>Регистрация завершена!</h1>
                <p>Ваш профиль успешно создан</p>
                
                <div className={`success-summary ${showSummary ? 'show' : ''}`}>
                    <div className="success-user-info">
                        <div className="success-user-avatar">
                            {userData.name ? userData.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div className="success-user-details">
                            <h3>{userData.name}</h3>
                            <p>{userData.gender}, {userData.age} лет</p>
                        </div>
                    </div>
                    
                    <div className="success-interests">
                        <h4>Интересы:</h4>
                        <div className="success-tags">
                            {userData.interests && userData.interests.map((interest, index) => (
                                <span key={index} className="success-tag">{interest}</span>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="success-redirect-info">
                    Перенаправление на главную через {countdown} сек...
                </div>
                
                <button 
                    className="success-button"
                    onClick={() => navigate('/home')}
                >
                    Перейти сейчас
                </button>
            </div>
        </div>
    );
};

export default SuccessScreen;
