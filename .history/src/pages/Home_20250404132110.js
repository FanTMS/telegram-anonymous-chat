import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import '../styles/Home.css';

const Home = ({ user }) => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalChats: 0,
        activeChats: 0,
        lastActivity: null
    });
    const [isLoading, setIsLoading] = useState(true);

    // Загрузка статистики пользователя
    useEffect(() => {
        const loadUserStats = async () => {
            if (!user) return;
            
            setIsLoading(true);
            
            try {
                // В реальном приложении здесь будет загрузка статистики из базы данных
                // Для примера используем задержку и моковые данные
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                setStats({
                    totalChats: Math.floor(Math.random() * 15),
                    activeChats: Math.floor(Math.random() * 3),
                    lastActivity: new Date().toISOString()
                });
            } catch (error) {
                console.error('Ошибка при загрузке статистики:', error);
            } finally {
                setIsLoading(false);
            }
        };
        
        loadUserStats();
    }, [user]);

    // Обработка нажатия кнопки поиска
    const handleFindChat = () => {
        if (WebApp.HapticFeedback) {
            WebApp.HapticFeedback.impactOccurred('medium');
        }
        navigate('/random-chat');
    };

    // Обработка нажатия на секцию чатов
    const handleGoToChats = () => {
        if (WebApp.HapticFeedback) {
            WebApp.HapticFeedback.impactOccurred('light');
        }
        navigate('/chats');
    };

    // Форматирование даты последней активности
    const formatLastActivity = (isoDate) => {
        if (!isoDate) return 'Никогда';
        
        const date = new Date(isoDate);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        
        if (diffMins < 1) return 'Только что';
        if (diffMins < 60) return `${diffMins} мин. назад`;
        
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} ч. назад`;
        
        return date.toLocaleDateString();
    };

    // Отображение приветствия в зависимости от времени суток
    const getGreeting = () => {
        const hour = new Date().getHours();
        
        if (hour >= 5 && hour < 12) return 'Доброе утро';
        if (hour >= 12 && hour < 18) return 'Добрый день';
        if (hour >= 18 && hour < 22) return 'Добрый вечер';
        return 'Доброй ночи';
    };

    return (
        <div className="home-container">
            <div className="greeting-section">
                <h1 className="greeting-title">
                    {getGreeting()}, {user?.name || 'Пользователь'}!
                </h1>
                <p className="greeting-subtitle">
                    Добро пожаловать в анонимный чат
                </p>
            </div>

            {isLoading ? (
                <div className="stats-loading">
                    <div className="loading-spinner"></div>
                </div>
            ) : (
                <div className="stats-section">
                    <div className="stats-card" onClick={handleGoToChats}>
                        <div className="stats-header">
                            <h3>Ваша активность</h3>
                            <span className="card-arrow">→</span>
                        </div>
                        <div className="stats-grid">
                            <div className="stats-item">
                                <span className="stats-value">{stats.totalChats}</span>
                                <span className="stats-label">Всего чатов</span>
                            </div>
                            <div className="stats-item">
                                <span className="stats-value">{stats.activeChats}</span>
                                <span className="stats-label">Активных</span>
                            </div>
                            <div className="stats-item">
                                <span className="stats-value">{formatLastActivity(stats.lastActivity)}</span>
                                <span className="stats-label">Последний чат</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="quick-actions">
                <button className="action-button primary" onClick={handleFindChat}>
                    <span className="button-icon">🔍</span>
                    Найти собеседника
                </button>
                <button className="action-button secondary" onClick={() => navigate('/guide')}>
                    <span className="button-icon">📖</span>
                    Руководство
                </button>
            </div>

            <div className="features-section">
                <h2 className="section-title">Возможности приложения</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">🔒</div>
                        <h3 className="feature-title">Анонимность</h3>
                        <p className="feature-description">
                            Общайтесь анонимно без раскрытия личных данных
                        </p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">👥</div>
                        <h3 className="feature-title">Случайные собеседники</h3>
                        <p className="feature-description">
                            Система подберет интересного собеседника
                        </p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🎯</div>
                        <h3 className="feature-title">По интересам</h3>
                        <p className="feature-description">
                            Находите собеседников с общими интересами
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
