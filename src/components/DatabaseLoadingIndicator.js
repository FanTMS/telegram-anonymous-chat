import React, { useState, useEffect } from 'react';
import '../styles/DatabaseLoadingIndicator.css';

const DatabaseLoadingIndicator = ({ onComplete }) => {
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('Подключение к базе данных...');
    const [showLoader, setShowLoader] = useState(true);

    useEffect(() => {
        // Шаги загрузки с прогрессом, сообщениями и задержками
        const steps = [
            { progress: 15, message: 'Проверка подключения...', delay: 700 },
            { progress: 30, message: 'Инициализация соединения...', delay: 800 },
            { progress: 45, message: 'Загрузка данных пользователя...', delay: 1000 },
            { progress: 65, message: 'Синхронизация чатов...', delay: 900 },
            { progress: 85, message: 'Подготовка интерфейса...', delay: 700 },
            { progress: 100, message: 'Готово!', delay: 500 }
        ];

        let currentStep = 0;
        let isMounted = true;
        
        const simulateLoading = () => {
            if (!isMounted) return;
            
            if (currentStep < steps.length) {
                const step = steps[currentStep];
                setProgress(step.progress);
                setStatus(step.message);
                
                const timer = setTimeout(() => {
                    currentStep++;
                    simulateLoading();
                }, step.delay);
                
                return () => clearTimeout(timer);
            } else {
                // Загрузка завершена
                setTimeout(() => {
                    if (!isMounted) return;
                    
                    // Плавно скрываем индикатор
                    setShowLoader(false);
                    
                    // Вызываем колбэк завершения через короткую задержку
                    setTimeout(() => {
                        if (onComplete && isMounted) onComplete();
                    }, 300);
                }, 300);
            }
        };
        
        simulateLoading();
        
        // Очистка при размонтировании
        return () => {
            isMounted = false;
        };
    }, [onComplete]);

    // Использование SVG вместо эмодзи для более стабильного отображения
    const renderLoadingIcon = () => (
        <div className="db-loading-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="#3390EC"/>
                <path d="M12 2V4" stroke="#3390EC" strokeWidth="2" strokeLinecap="round"/>
                <path d="M19.071 4.92871L17.6568 6.34292" stroke="#3390EC" strokeWidth="2" strokeLinecap="round"/>
                <path d="M22 12H20" stroke="#3390EC" strokeWidth="2" strokeLinecap="round"/>
                <path d="M19.071 19.0713L17.6568 17.6571" stroke="#3390EC" strokeWidth="2" strokeLinecap="round"/>
                <path d="M12 22V20" stroke="#3390EC" strokeWidth="2" strokeLinecap="round"/>
                <path d="M4.92896 19.0713L6.34317 17.6571" stroke="#3390EC" strokeWidth="2" strokeLinecap="round"/>
                <path d="M2 12H4" stroke="#3390EC" strokeWidth="2" strokeLinecap="round"/>
                <path d="M4.92896 4.92871L6.34317 6.34292" stroke="#3390EC" strokeWidth="2" strokeLinecap="round"/>
            </svg>
        </div>
    );

    return (
        <div className={`db-loading-container ${showLoader ? 'active' : 'fade-out'}`}>
            <div className="db-loading-card">
                {renderLoadingIcon()}
                <h2 className="db-loading-title">Загрузка данных</h2>
                <div className="db-progress-bar">
                    <div 
                        className="db-progress-fill" 
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <p className="db-loading-status">{status}</p>
                <p className="db-loading-tip">Пожалуйста, подождите...</p>
            </div>
        </div>
    );
};

export default DatabaseLoadingIndicator; 