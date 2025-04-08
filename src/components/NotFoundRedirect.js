import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const NotFoundRedirect = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Redirect to home page after a short delay
        const timer = setTimeout(() => {
            navigate('/', { replace: true });
        }, 100);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="not-found-redirect">
            <h1>404</h1>
            <p>Перенаправление на главную страницу...</p>
        </div>
    );
};

export default NotFoundRedirect; 