import React, { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';

/**
 * Улучшенный компонент для отображения экрана успешной регистрации
 * @param {Object} props - Свойства компонента
 * @param {Object} props.userData - Данные пользователя
 * @returns {JSX.Element} Анимированный экран успешной регистрации
 */
const SuccessScreen = ({ userData }) => {
    const [showContent, setShowContent] = useState(false);
    const [showSummary, setShowSummary] = useState(false);

    useEffect(() => {
        // Последовательное отображение элементов для создания эффекта поэтапной анимации
        setTimeout(() => setShowContent(true), 300);
        setTimeout(() => setShowSummary(true), 1000);

        // Уведомим Telegram что регистрация завершена
        try {
            WebApp.MainButton.setText('Начать общение');
            WebApp.MainButton.show();
            
            // Вызываем TelegramGameProxy.callback с успешным результатом
            if (window.TelegramGameProxy) {
                window.TelegramGameProxy.callback({
                    event: 'registration_success',
                    data: { success: true }
                });
            }
        } catch (error) {
            console.warn("Не удалось взаимодействовать с Telegram WebApp:", error);
        }
    }, []);

    // Функция для выделения коротких ключевых слов из интересов для отображения тегов
    const extractInterestTags = (interests) => {
        if (!interests) return [];
        
        const words = interests.split(/[,.;:\s]+/);
        return words
            .filter(word => word.length > 3)
            .slice(0, 5)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
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
