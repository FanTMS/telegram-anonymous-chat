import React, { useState, useEffect } from 'react';
import { getAppStatistics } from '../utils/statisticsService';
import { isAdmin } from '../utils/user';
import { Navigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    // Проверка администраторских прав
    useEffect(() => {
        const checkAdminStatus = async () => {
            try {
                const adminStatus = await isAdmin();
                setIsAuthorized(adminStatus);
            } catch (error) {
                console.error("Ошибка при проверке статуса администратора:", error);
                setError("Ошибка при проверке прав доступа");
            } finally {
                setIsCheckingAuth(false);
            }
        };

        checkAdminStatus();
    }, []);

    // Загрузка статистики приложения
    useEffect(() => {
        const loadAppStats = async () => {
            if (!isAuthorized) return;

            try {
                setLoading(true);
                const appStats = await getAppStatistics();
                setStats(appStats);
            } catch (error) {
                console.error("Ошибка при загрузке статистики приложения:", error);
                setError("Не удалось загрузить статистику");
            } finally {
                setLoading(false);
            }
        };

        if (!isCheckingAuth && isAuthorized) {
            loadAppStats();
        }
    }, [isAuthorized, isCheckingAuth]);

    // Если проверка прав завершена и пользователь не админ - редирект
    if (!isCheckingAuth && !isAuthorized) {
        return <Navigate to="/home" replace />;
    }

    // Если идет проверка прав или загрузка - показываем загрузчик
    if (isCheckingAuth || loading) {
        return (
            <div className="admin-loading">
                <div className="loading-spinner"></div>
                <p>{isCheckingAuth ? "Проверка прав доступа..." : "Загрузка статистики..."}</p>
            </div>
        );
    }

    // Если произошла ошибка - показываем сообщение
    if (error) {
        return (
            <div className="admin-error">
                <h2>Ошибка</h2>
                <p>{error}</p>
                <button 
                    className="admin-button"
                    onClick={() => window.location.reload()}
                >
                    Попробовать снова
                </button>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <h1>Панель администратора</h1>
            
            <div className="admin-stats-container">
                <div className="admin-stats-card">
                    <h2>Общая статистика</h2>
                    
                    <div className="admin-stats-grid">
                        <div className="admin-stats-item">
                            <span className="admin-stats-value">{stats?.totalUsers || 0}</span>
                            <span className="admin-stats-label">Всего пользователей</span>
                        </div>
                        <div className="admin-stats-item">
                            <span className="admin-stats-value">{stats?.activeUsers || 0}</span>
                            <span className="admin-stats-label">Активных пользователей</span>
                        </div>
                        <div className="admin-stats-item">
                            <span className="admin-stats-value">{stats?.totalChats || 0}</span>
                            <span className="admin-stats-label">Всего чатов</span>
                        </div>
                        <div className="admin-stats-item">
                            <span className="admin-stats-value">{stats?.activeChats || 0}</span>
                            <span className="admin-stats-label">Активных чатов</span>
                        </div>
                        <div className="admin-stats-item">
                            <span className="admin-stats-value">{stats?.totalMessages || 0}</span>
                            <span className="admin-stats-label">Всего сообщений</span>
                        </div>
                    </div>
                </div>
                
                <div className="admin-actions">
                    <button 
                        className="admin-button"
                        onClick={() => WebApp.BackButton.onClick(() => window.history.back())}
                    >
                        Назад
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
