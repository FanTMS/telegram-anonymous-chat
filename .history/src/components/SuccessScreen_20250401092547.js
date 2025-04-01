import React from 'react';

/**
 * Компонент для отображения экрана успешной регистрации
 * @param {Object} props - Свойства компонента
 * @param {Object} props.userData - Данные пользователя
 * @returns {JSX.Element} Экран успешной регистрации
 */
const SuccessScreen = ({ userData }) => {
    return (
        <div className="success-container">
            <div className="success-icon"></div>
            <h2 className="success-title">Регистрация завершена!</h2>
            <p className="success-message">
                Вы успешно зарегистрировались в анонимном чате.
                Теперь вы можете начать общение с другими участниками.
            </p>
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
                    <div className="user-summary-value">{userData.interests}</div>
                </div>
                {userData.aboutMe && (
                    <div className="user-summary-row">
                        <div className="user-summary-label">О себе:</div>
                        <div className="user-summary-value">{userData.aboutMe}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuccessScreen;
