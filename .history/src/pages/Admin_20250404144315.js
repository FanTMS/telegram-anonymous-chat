import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import '../styles/Admin.css';

// Список администраторов (Telegram IDs)
const ADMIN_IDS = ['12345678', '87654321']; // Замените на реальные Telegram ID администраторов

const Admin = () => {
    const navigate = useNavigate();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    // Проверка авторизации администратора
    useEffect(() => {
        const checkAdminStatus = async () => {
            try {
                setIsCheckingAuth(true);

                // Получаем ID пользователя из WebApp
                let userId = '';

                try {
                    if (WebApp && WebApp.initDataUnsafe && WebApp.initDataUnsafe.user) {
                        userId = WebApp.initDataUnsafe.user.id.toString();
                    }
                } catch (error) {
                    console.warn('Не удалось получить ID пользователя из WebApp:', error);
                }

                // Если не смогли получить ID из WebApp, пробуем из sessionStorage
                if (!userId) {
                    try {
                        const userDataStr = sessionStorage.getItem('userData');
                        if (userDataStr) {
                            const userData = JSON.parse(userDataStr);
                            userId = userData.telegramId.toString();
                        }
                    } catch (error) {
                        console.warn('Не удалось получить ID пользователя из sessionStorage:', error);
                    }
                }

                // Проверяем, является ли пользователь администратором
                const isAdmin = ADMIN_IDS.includes(userId);

                setIsAuthorized(isAdmin);

                // Если локальная разработка, разрешаем доступ
                if (process.env.NODE_ENV === 'development') {
                    setIsAuthorized(true);
                }
            } catch (error) {
                console.error('Ошибка при проверке статуса администратора:', error);
                setIsAuthorized(false);
            } finally {
                setIsCheckingAuth(false);
            }
        };

        checkAdminStatus();
    }, []);

    // Если проверка прав завершена и пользователь не админ - редирект
    if (!isCheckingAuth && !isAuthorized) {
        return (
            <div className="admin-unauthorized">
                <h2>Доступ запрещен</h2>
                <p>У вас нет прав для доступа к панели администрирования.</p>
                <button onClick={() => navigate('/home')}>На главную</button>
            </div>
        );
    }

    // Если идет проверка прав - показываем загрузчик
    if (isCheckingAuth) {
        return (
            <div className="admin-loading-container">
                <div className="admin-loading-spinner"></div>
                <p>Проверка прав доступа...</p>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h1>Панель администрирования</h1>
                <button
                    className="admin-back-button"
                    onClick={() => navigate('/home')}
                >
                    На главную
                </button>
            </div>

            <div className="admin-menu">
                <div className="admin-menu-item" onClick={() => navigate('/admin/support')}>
                    <div className="admin-menu-icon">💬</div>
                    <div className="admin-menu-content">
                        <h2>Запросы в поддержку</h2>
                        <p>Управление запросами и обращениями пользователей в поддержку</p>
                    </div>
                </div>

                <div className="admin-menu-item" onClick={() => navigate('/admin/reports')}>
                    <div className="admin-menu-icon">⚠️</div>
                    <div className="admin-menu-content">
                        <h2>Жалобы</h2>
                        <p>Просмотр и обработка жалоб пользователей на собеседников</p>
                    </div>
                </div>

                <div className="admin-menu-item" onClick={() => navigate('/admin/stats')}>
                    <div className="admin-menu-icon">📊</div>
                    <div className="admin-menu-content">
                        <h2>Статистика</h2>
                        <p>Просмотр статистики использования приложения</p>
                    </div>
                </div>

                <div className="admin-menu-item" onClick={() => navigate('/admin/users')}>
                    <div className="admin-menu-icon">👥</div>
                    <div className="admin-menu-content">
                        <h2>Пользователи</h2>
                        <p>Управление пользователями и их правами</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Admin;
