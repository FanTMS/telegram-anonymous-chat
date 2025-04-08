import React, { useState, useEffect } from 'react';
import { getAppStatistics } from '../utils/statisticsService';
import { isAdmin } from '../utils/user';
import { Navigate, useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import '../styles/AdminDashboard.css';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../firebase';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [recentUsers, setRecentUsers] = useState([]);
    const [recentChats, setRecentChats] = useState([]);
    const [supportRequests, setSupportRequests] = useState([]);
    const [pendingSupportCount, setPendingSupportCount] = useState(0);

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

    // Загрузка последних пользователей
    useEffect(() => {
        const loadRecentUsers = async () => {
            if (!isAuthorized || activeTab !== 'users') return;

            try {
                const usersQuery = query(
                    collection(db, "users"),
                    orderBy("createdAt", "desc"),
                    limit(10)
                );

                const querySnapshot = await getDocs(usersQuery);
                const users = [];
                
                querySnapshot.forEach((doc) => {
                    const userData = doc.data();
                    users.push({
                        id: doc.id,
                        ...userData,
                        createdAt: userData.createdAt ? (typeof userData.createdAt.toDate === 'function' ? userData.createdAt.toDate().toLocaleString() : userData.createdAt) : 'Нет данных',
                        lastSeen: userData.lastSeen ? (typeof userData.lastSeen.toDate === 'function' ? userData.lastSeen.toDate().toLocaleString() : userData.lastSeen) : 'Нет данных'
                    });
                });

                setRecentUsers(users);
            } catch (error) {
                console.error("Ошибка при загрузке пользователей:", error);
            }
        };

        loadRecentUsers();
    }, [isAuthorized, activeTab]);

    // Загрузка последних чатов
    useEffect(() => {
        const loadRecentChats = async () => {
            if (!isAuthorized || activeTab !== 'chats') return;

            try {
                const chatsQuery = query(
                    collection(db, "chats"),
                    orderBy("createdAt", "desc"),
                    limit(10)
                );

                const querySnapshot = await getDocs(chatsQuery);
                const chats = [];
                
                querySnapshot.forEach((doc) => {
                    const chatData = doc.data();
                    chats.push({
                        id: doc.id,
                        ...chatData,
                        createdAt: chatData.createdAt ? (typeof chatData.createdAt.toDate === 'function' ? chatData.createdAt.toDate().toLocaleString() : chatData.createdAt) : 'Нет данных',
                        lastMessageTime: chatData.lastMessageTime ? (typeof chatData.lastMessageTime.toDate === 'function' ? chatData.lastMessageTime.toDate().toLocaleString() : chatData.lastMessageTime) : 'Нет данных'
                    });
                });

                setRecentChats(chats);
            } catch (error) {
                console.error("Ошибка при загрузке чатов:", error);
            }
        };

        loadRecentChats();
    }, [isAuthorized, activeTab]);

    // Загрузка запросов в техподдержку
    useEffect(() => {
        const loadSupportRequests = async () => {
            if (!isAuthorized || activeTab !== 'support') return;

            try {
                const supportQuery = query(
                    collection(db, "chats"),
                    where("type", "==", "support"),
                    orderBy("lastMessageTime", "desc"),
                    limit(10)
                );

                const querySnapshot = await getDocs(supportQuery);
                const requests = [];
                
                querySnapshot.forEach((doc) => {
                    const chatData = doc.data();
                    requests.push({
                        id: doc.id,
                        ...chatData,
                        createdAt: chatData.createdAt ? (typeof chatData.createdAt.toDate === 'function' ? chatData.createdAt.toDate().toLocaleString() : chatData.createdAt) : 'Нет данных',
                        lastMessageTime: chatData.lastMessageTime ? (typeof chatData.lastMessageTime.toDate === 'function' ? chatData.lastMessageTime.toDate().toLocaleString() : chatData.lastMessageTime) : 'Нет данных'
                    });
                });

                setSupportRequests(requests);
            } catch (error) {
                console.error("Ошибка при загрузке запросов в поддержку:", error);
            }
        };

        loadSupportRequests();
    }, [isAuthorized, activeTab]);

    // Загрузка количества непрочитанных запросов в поддержку
    useEffect(() => {
        const loadPendingSupportCount = async () => {
            if (!isAuthorized) return;

            try {
                const pendingQuery = query(
                    collection(db, "chats"),
                    where("type", "==", "support"),
                    where("unreadBySupport", "==", true)
                );

                const querySnapshot = await getDocs(pendingQuery);
                setPendingSupportCount(querySnapshot.size);
            } catch (error) {
                console.error("Ошибка при загрузке непрочитанных запросов:", error);
            }
        };

        if (!isCheckingAuth && isAuthorized) {
            loadPendingSupportCount();
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

    // Рендер содержимого вкладки "Обзор"
    const renderOverviewTab = () => (
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

            <div className="admin-stats-card">
                <h2>Статистика по категориям</h2>
                <div className="admin-stats-grid">
                    <div className="admin-stats-item">
                        <span className="admin-stats-value">{stats?.randomChatsCount || 0}</span>
                        <span className="admin-stats-label">Случайных чатов</span>
                    </div>
                    <div className="admin-stats-item">
                        <span className="admin-stats-value">{stats?.supportChatsCount || 0}</span>
                        <span className="admin-stats-label">Чатов поддержки</span>
                    </div>
                    <div className="admin-stats-item">
                        <span className="admin-stats-value">{pendingSupportCount || 0}</span>
                        <span className="admin-stats-label">Ожидают ответа</span>
                    </div>
                </div>
            </div>

            <div className="admin-actions">
                <button
                    className="admin-button"
                    onClick={() => navigate('/admin/support')}
                >
                    Управление поддержкой
                </button>
                <button
                    className="admin-button"
                    onClick={() => window.history.back()}
                >
                    Назад
                </button>
            </div>
        </div>
    );

    // Рендер содержимого вкладки "Пользователи"
    const renderUsersTab = () => (
        <div className="admin-tab-content">
            <h2>Последние пользователи</h2>
            
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Имя</th>
                            <th>Telegram ID</th>
                            <th>Дата регистрации</th>
                            <th>Последний вход</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentUsers.map(user => (
                            <tr key={user.id}>
                                <td>{user.id.substring(0, 8)}...</td>
                                <td>{user.name || 'Аноним'}</td>
                                <td>{user.telegramData?.telegramId || 'Нет данных'}</td>
                                <td>{user.createdAt}</td>
                                <td>{user.lastSeen}</td>
                                <td>
                                    <button 
                                        className="admin-table-button"
                                        onClick={() => navigate(`/admin/user/${user.id}`)}
                                    >
                                        Подробнее
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="admin-actions">
                <button
                    className="admin-button"
                    onClick={() => navigate('/admin/users')}
                >
                    Все пользователи
                </button>
            </div>
        </div>
    );

    // Рендер содержимого вкладки "Чаты"
    const renderChatsTab = () => (
        <div className="admin-tab-content">
            <h2>Последние чаты</h2>
            
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Тип</th>
                            <th>Участники</th>
                            <th>Создан</th>
                            <th>Последнее сообщение</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentChats.map(chat => (
                            <tr key={chat.id}>
                                <td>{chat.id.substring(0, 8)}...</td>
                                <td>{chat.type || 'Обычный'}</td>
                                <td>{chat.participants?.length || 0}</td>
                                <td>{chat.createdAt}</td>
                                <td>{chat.lastMessageTime}</td>
                                <td>
                                    <button 
                                        className="admin-table-button"
                                        onClick={() => navigate(`/admin/chat/${chat.id}`)}
                                    >
                                        Просмотр
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="admin-actions">
                <button
                    className="admin-button"
                    onClick={() => navigate('/admin/chats')}
                >
                    Все чаты
                </button>
            </div>
        </div>
    );

    // Рендер содержимого вкладки "Поддержка"
    const renderSupportTab = () => (
        <div className="admin-tab-content">
            <h2>Запросы в поддержку</h2>
            
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Пользователь</th>
                            <th>Создан</th>
                            <th>Последнее сообщение</th>
                            <th>Статус</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {supportRequests.map(chat => (
                            <tr key={chat.id} className={chat.unreadBySupport ? "unread-row" : ""}>
                                <td>{chat.id.substring(0, 8)}...</td>
                                <td>{chat.participants?.filter(id => id !== 'support')[0] || 'Неизвестно'}</td>
                                <td>{chat.createdAt}</td>
                                <td>{chat.lastMessageTime}</td>
                                <td>
                                    <span className={`status-badge ${chat.unreadBySupport ? "status-new" : "status-read"}`}>
                                        {chat.unreadBySupport ? "Новый" : "Прочитан"}
                                    </span>
                                </td>
                                <td>
                                    <button 
                                        className="admin-table-button"
                                        onClick={() => navigate(`/admin/support/${chat.id}`)}
                                    >
                                        Ответить
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="admin-actions">
                <button
                    className="admin-button"
                    onClick={() => navigate('/admin/support')}
                >
                    Панель поддержки
                </button>
            </div>
        </div>
    );

    return (
        <div className="admin-dashboard">
            <h1>Панель администратора</h1>

            <div className="admin-tabs">
                <button 
                    className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Обзор
                </button>
                <button 
                    className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    Пользователи
                </button>
                <button 
                    className={`admin-tab ${activeTab === 'chats' ? 'active' : ''}`}
                    onClick={() => setActiveTab('chats')}
                >
                    Чаты
                </button>
                <button 
                    className={`admin-tab ${activeTab === 'support' ? 'active' : ''}`}
                    onClick={() => setActiveTab('support')}
                >
                    Поддержка {pendingSupportCount > 0 && <span className="notification-badge">{pendingSupportCount}</span>}
                </button>
            </div>

            <div className="admin-content">
                {activeTab === 'overview' && renderOverviewTab()}
                {activeTab === 'users' && renderUsersTab()}
                {activeTab === 'chats' && renderChatsTab()}
                {activeTab === 'support' && renderSupportTab()}
            </div>
        </div>
    );
};

export default AdminDashboard;
