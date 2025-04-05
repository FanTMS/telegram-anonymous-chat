import React from 'react';
import '../styles/LoadingSpinner.css';

const LoadingSpinner = ({ text = 'Загрузка...' }) => {
    return (
        <div className="loading-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">{text}</p>
        </div>
    );
};

export default LoadingSpinner;
