import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import '../styles/Home.css';

const Home = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleStartChatClick = () => {
        navigate('/random-chat');
    };

    const handleShowChatsClick = () => {
        navigate('/chats');
    };

    const handleProfileClick = () => {
        navigate('/profile');
    };

    return (
        <div className="home-container">
            <div className="home-header">
                <h1>Привет, {user?.name || 'друг'}!</h1>
                <p className="home-subtitle">Добро пожаловать в анонимный чат</p>
            </div>

            <div className="home-buttons">
                <button
                    className="primary-button"
                    onClick={handleStartChatClick}
                >
                    <span className="button-icon">💬</span>
                    Начать новый чат
                </button>

                <button
                    className="secondary-button"
                    onClick={handleShowChatsClick}
                >
                    <span className="button-icon">📋</span>
                    Показать мои чаты
                </button>

                <button
                    className="secondary-button"
                    onClick={handleProfileClick}
                >
                    <span className="button-icon">👤</span>
                    Мой профиль
                </button>
            </div>

            <div className="home-features">
                <div className="feature-card">
                    <div className="feature-icon">🔒</div>
                    <h3>Полная анонимность</h3>
                    <p>Никто не узнает, кто вы на самом деле</p>
                </div>

                <div className="feature-card">
                    <div className="feature-icon">👥</div>
                    <h3>Найти собеседника</h3>
                    <p>Общайтесь с теми, кто разделяет ваши интересы</p>
                </div>

                <div className="feature-card">
                    <div className="feature-icon">⚡</div>
                    <h3>Быстрые чаты</h3>
                    <p>Без лишних настроек и регистраций</p>
                </div>
            </div>
        </div>
    );
};

export default Home;
