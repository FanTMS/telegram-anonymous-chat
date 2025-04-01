import React from 'react';

/**
 * Компонент отображения индикатора загрузки с текстом
 * @param {Object} props - Свойства компонента
 * @param {string} props.text - Текст, отображаемый под спиннером (по умолчанию "Загрузка...")
 * @param {boolean} props.overlay - Флаг, показывающий спиннер поверх содержимого (по умолчанию true)
 * @returns {JSX.Element} Индикатор загрузки
 */
const LoadingSpinner = ({ text = "Загрузка...", overlay = true }) => {
    const spinnerContent = (
        <>
            <div className="loading-spinner"></div>
            <div className="loading-text">{text}</div>
        </>
    );

    if (overlay) {
        return (
            <div className="form-loading">
                {spinnerContent}
            </div>
        );
    }

    return (
        <div className="loading-container">
            {spinnerContent}
        </div>
    );
};

export default LoadingSpinner;
