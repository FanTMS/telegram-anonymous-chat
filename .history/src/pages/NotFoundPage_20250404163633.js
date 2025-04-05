import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/NotFoundPage.css';

const NotFoundPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [countdown, setCountdown] = useState(5);
    const [autoRedirect, setAutoRedirect] = useState(true);

    // Автоматический редирект на главную
    useEffect(() => {
        if (!autoRedirect) return;

        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    navigate('/');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [navigate, autoRedirect]);

    // Отключение автоматического редиректа при взаимодействии с пользователем
    const handleButtonClick = (path) => {
        setAutoRedirect(false);
        navigate(path);
    };

    return (
        <div className="not-found-container">
            <div className="not-found-content">
                <h1>404</h1>
                <h2>Страница не найдена</h2>
                <p>Извините, страница <code>{location.pathname}</code> не существует или была перемещена.</p>
                <div className="not-found-actions">
                    <button
                        className="primary-button"
                        onClick={() => handleButtonClick('/')}
                    >
                        На главную
                    </button>
                    <button
                        className="secondary-button"
                        onClick={() => handleButtonClick(-1)}
                    >
                        Назад
                    </button>
                </div>
                {autoRedirect && (
                    <div className="redirect-info">
                        Автоматическое перенаправление через {countdown} сек...
                        <button 
                            className="cancel-button"
                            onClick={() => setAutoRedirect(false)}
                        >
                            Отменить
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotFoundPage;
