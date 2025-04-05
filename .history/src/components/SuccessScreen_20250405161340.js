import React, { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';
import { useNavigate } from 'react-router-dom';
import '../styles/SuccessScreen.css';

const SuccessScreen = ({ userData, redirectDelay = 3000 }) => {
    const navigate = useNavigate();
    const [showContent, setShowContent] = useState(false);
    const [showSummary, setShowSummary] = useState(false);

    useEffect(() => {
        // Анимация появления контента
        const contentTimer = setTimeout(() => setShowContent(true), 500);
        const summaryTimer = setTimeout(() => setShowSummary(true), 1000);

        // Автоматический редирект после отображения
        let redirectTimer;
        try {
            // Настраиваем кнопку Telegram WebApp
            WebApp.MainButton.setText('Начать общение');
            WebApp.MainButton.show();

            // Добавляем обработчик по нажатию на кнопку
            WebApp.MainButton.onClick(() => {
                navigate('/home');
            });

            // Вызываем TelegramGameProxy.callback с успешным результатом
            if (window.TelegramGameProxy) {
                window.TelegramGameProxy.callback({
                    event: 'registration_success',
                    data: { success: true }
                });
            }

            return () => {
                clearTimeout(contentTimer);
                clearTimeout(summaryTimer);
                clearTimeout(redirectTimer);
                WebApp.MainButton.offClick(() => navigate('/home'));
            };
        } catch (error) {
            console.warn("Не удалось взаимодействовать с Telegram WebApp:", error);
        }
    }, [navigate, redirectDelay]);

    // Функция для выделения коротких ключевых слов из интересов для отображения тегов
    const extractInterestTags = (interests) => {
        if (!interests) return [];
        
        // Если interests - это массив
        if (Array.isArray(interests)) {
            // Если это массив объектов с id и name
            if (interests.length > 0 && typeof interests[0] === 'object') {
                return interests.slice(0, 5).map(item => 
                    item.name ? item.name.charAt(0).toUpperCase() + item.name.slice(1) : item.id
                );
            }
            // Если это массив строк идентификаторов
            return interests.slice(0, 5).map(item => 
                typeof item === 'string' ? item.charAt(0).toUpperCase() + item.slice(1) : String(item)
            );
        }
        
        // Если это строка
        if (typeof interests === 'string') {
            const words = interests.split(/[,.;:\s]+/);
            return words
                .filter(word => word.length > 3)
                .slice(0, 5)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1));
        }
        
        return []; // Возвращаем пустой массив для других типов
    };

    const interestTags = extractInterestTags(userData.interests);

    return (
        <div className="success-container">
            <div className="success-icon"></div>
            <div className={`success-content ${showContent ? 'show' : ''}`}>
                <h2 className="success-title">Регистрация завершена!</h2>
                <p className="success-message">
                    Вы успешно зарегистрировались в анонимном чате.
                    Теперь вы можете начать общение с другими участниками.
                </p>

                {showSummary && (
                    <div className="user-summary">
                        <div className="user-summary-row">
                            <div className="user-summary-label">Имя/Псевдоним:</div>
                            <div className="user-summary-value">
                                {userData.name ? userData.name : userData.nickname || 'Будет использован псевдоним'}
                            </div>
                        </div>
                        <div className="user-summary-row">
                            <div className="user-summary-label">Возраст:</div>
                            <div className="user-summary-value">{userData.age}</div>
                        </div>
                        <div className="user-summary-row">
                            <div className="user-summary-label">Интересы:</div>
                            <div className="user-summary-value">
                                <div className="interest-tags">
                                    {interestTags.map((tag, index) => (
                                        <span key={index} className="interest-tag">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {userData.aboutMe && (
                            <div className="user-summary-row">
                                <div className="user-summary-label">О себе:</div>
                                <div className="user-summary-value">{userData.aboutMe}</div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuccessScreen;
