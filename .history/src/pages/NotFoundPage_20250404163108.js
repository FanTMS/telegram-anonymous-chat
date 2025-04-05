import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/NotFoundPage.css';

const NotFoundPage = () => {
    const navigate = useNavigate();

    // Возможность автоматически редиректить на главную страницу через несколько секунд
    useEffect(() => {
        const timer = setTimeout(() => {
            // Раскомментировать, если нужен автоматический редирект
            // navigate('/');
        }, 5000);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="not-found-container">
            <div className="not-found-content">
                <h1>404</h1>
                <h2>Страница не найдена</h2>
                <p>Извините, запрашиваемая страница не существует или была перемещена.</p>
                <div className="not-found-actions">
                    <button 
                        className="primary-button"
                        onClick={() => navigate('/')}
                    >
                        На главную
                    </button>
                    <button 
                        className="secondary-button"
                        onClick={() => navigate(-1)}
                    >
                        Назад
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
