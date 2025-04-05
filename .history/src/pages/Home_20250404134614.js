import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import { getUserStatistics } from '../utils/usersService';
import '../styles/Home.css';

const Home = ({ user }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadUserStats();
    }, [user]);

    const loadUserStats = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const userStats = await getUserStatistics(user.id);
            setStats(userStats);
        } catch (error) {
            console.error("Ошибка при загрузке статистики:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefreshStats = async () => {
        if (refreshing) return;
        
        try {
            setRefreshing(true);
            // Тактильная обратная связь
            if (WebApp.HapticFeedback) {
                WebApp.HapticFeedback.impactOccurred('medium');
            }
            await loadUserStats();
        } finally {
            setRefreshing(false);
        }
    };

    const handleFindChat = () => {
        // Тактильная обратная связь
        if (WebApp.HapticFeedback) {
            WebApp.HapticFeedback.impactOccurred('medium');
        }
        
        // Анимация кнопки
        const button = document.querySelector('.action-button.primary');
        if (button) {
            button.classList.add('clicked');
            setTimeout(() => button.classList.remove('clicked'), 300);
        }
        
        navigate('/random-chat');
    };

    return (
        <div className="home-container">
            {/* Секция приветствия */}
            <div className="greeting-section">
                <div className="greeting-pattern"></div>
                <div className="greeting-content">
                    <h1 className="greeting-title">Привет, {user?.name || 'Друг'}!</h1>
                    <p className="greeting-subtitle">Добро пожаловать в анонимный чат</p>
                </div>
            </div>

            {/* Секция статистики */}
            {(loading || stats) && (
                <div className="stats-section">
                    <div className="stats-header">
                        <div className="stats-title">Ваша статистика</div>
                        <button 
                            className="stats-refresh" 
                            onClick={handleRefreshStats}
                            disabled={refreshing}
                        >
                            <span className="stats-refresh-icon">
                                {refreshing ? '⌛' : '🔄'}
                            </span>
                            {refreshing ? 'Обновляется...' : 'Обновить'}
                        </button>
                    </div>
                    <div className="stats-card">
                        <div className="stats-grid">
                            <div className="stats-item">
                                <span className="stats-value">{stats?.activeChats || 0}</span>
                                <span className="stats-label">Активных чатов</span>
                            </div>
                            <div className="stats-item">
                                <span className="stats-value">{stats?.totalChats || 0}</span>
                                <span className="stats-label">Всего чатов</span>
                            </div>
                            <div className="stats-item">
                                <span className="stats-value">{stats?.totalMessages || 0}</span>
                                <span className="stats-label">Сообщений</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Секция быстрых действий */}
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

            {/* Секция возможностей */}
            <div className="features-section">
                <h2 className="section-title">
                    <span className="section-title-icon">✨</span>
                    Возможности
                </h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">🔒</div>
                        <h3 className="feature-title">Анонимность</h3>
                        <p className="feature-description">
                            Полная анонимность при общении
                        </p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🔍</div>
                        <h3 className="feature-title">Поиск</h3>
                        <p className="feature-description">
                            Быстрый поиск случайного собеседника
                        </p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">🎯</div>
                        <h3 className="feature-title">По интересам</h3>
                        <p className="feature-description">
                            Находите собеседников с общими интересами
                        </p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">📱</div>
                        <h3 className="feature-title">В Telegram</h3>
                        <p className="feature-description">
                            Удобное общение в знакомом интерфейсе
                        </p>
                    </div>
                </div>
            </div>

            {/* Секция советов */}
            <div className="tips-section">
                <h2 className="section-title">
                    <span className="section-title-icon">💡</span>
                    Полезные советы
                </h2>
                <div className="tip-card">
                    <div className="tip-title">
                        <span className="tip-icon">👋</span>
                        Начните с приветствия
                    </div>
                    <div className="tip-content">
                        Вежливое приветствие увеличивает шансы на интересный разговор.
                    </div>
                </div>
                <div className="tip-card">
                    <div className="tip-title">
                        <span className="tip-icon">🔎</span>
                        Ищите общие интересы
                    </div>
                    <div className="tip-content">
                        Спросите собеседника о его увлечениях, чтобы найти общую тему.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
