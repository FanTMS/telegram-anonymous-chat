import React, { useState, useEffect } from 'react';
import '../styles/RegistrationSuccess.css';

const RegistrationSuccess = ({ userData }) => {
    const [showContent, setShowContent] = useState(false);

    // Анимация появления контента с задержкой
    useEffect(() => {
        const timer = setTimeout(() => {
            setShowContent(true);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="success-container">
            <div className="success-icon"></div>

            <div className={`success-content ${showContent ? 'show' : ''}`}>
                <h1 className="success-title">Регистрация успешна!</h1>
                <p className="success-message">
                    Ваш профиль создан. Теперь вы можете начать общаться с новыми людьми.
                </p>

                {userData && (
                    <div className="user-summary">
                        {userData.name && (
                            <div className="user-summary-row">
                                <div className="user-summary-label">Имя:</div>
                                <div className="user-summary-value">{userData.name}</div>
                            </div>
                        )}
                        {userData.nickname && (
                            <div className="user-summary-row">
                                <div className="user-summary-label">Псевдоним:</div>
                                <div className="user-summary-value">{userData.nickname}</div>
                            </div>
                        )}
                        <div className="user-summary-row">
                            <div className="user-summary-label">Возраст:</div>
                            <div className="user-summary-value">{userData.age}</div>
                        </div>
                        <div className="user-summary-row">
                            <div className="user-summary-label">Интересы:</div>
                            <div className="user-summary-value">
                                <div className="interest-tags">
                                    {userData.interests.split(', ').map((tag, index) => (
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

                <div className="success-actions">
                    <button className="success-button">Начать общение</button>
                </div>
            </div>
        </div>
    );
};

export default RegistrationSuccess;
