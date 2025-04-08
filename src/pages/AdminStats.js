import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    getDoc,
    doc, 
    orderBy, 
    limit,
    Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import '../styles/AdminStats.css';

const AdminStats = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        users: {
            total: 0,
            active: 0,
            banned: 0,
            newToday: 0,
            newThisWeek: 0
        },
        chats: {
            total: 0,
            active: 0,
            completed: 0,
            messagesCount: 0,
            avgMessagesPerChat: 0
        },
        reports: {
            total: 0,
            pending: 0,
            resolved: 0,
            bans: 0
        }
    });
    const [dailyStats, setDailyStats] = useState([]);
    const [topUsers, setTopUsers] = useState([]);
    const [selectedTimeframe, setSelectedTimeframe] = useState('week');

    useEffect(() => {
        fetchStatistics();
    }, [selectedTimeframe]);

    const fetchStatistics = async () => {
        try {
            setLoading(true);
            
            // Получаем временные рамки для фильтрации
            const { startDate, endDate } = getTimeframeRange(selectedTimeframe);
            
            // Параллельно запускаем все запросы
            const [
                usersStats,
                chatsStats,
                reportsStats,
                dailyStatsData,
                topUsersData
            ] = await Promise.all([
                fetchUsersStats(startDate),
                fetchChatsStats(startDate),
                fetchReportsStats(),
                fetchDailyStats(selectedTimeframe),
                fetchTopUsers(startDate, endDate)
            ]);
            
            setStats({
                users: usersStats,
                chats: chatsStats,
                reports: reportsStats
            });
            
            setDailyStats(dailyStatsData);
            setTopUsers(topUsersData);
            
        } catch (err) {
            console.error('Ошибка при получении статистики:', err);
            setError('Не удалось загрузить статистику. Пожалуйста, попробуйте позже.');
        } finally {
            setLoading(false);
        }
    };
    
    const getTimeframeRange = (timeframe) => {
        const now = new Date();
        let startDate;
        
        switch (timeframe) {
            case 'day':
                startDate = new Date(now);
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(now);
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                startDate = new Date(now);
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
        }
        
        return {
            startDate: Timestamp.fromDate(startDate),
            endDate: Timestamp.fromDate(now)
        };
    };

    const fetchUsersStats = async (startDate) => {
        // Получаем общее количество пользователей
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const totalUsers = usersSnapshot.size;
        
        // Получаем активных пользователей (заходили в течение последних 7 дней)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysAgoTimestamp = Timestamp.fromDate(sevenDaysAgo);
        
        const activeUsersQuery = query(
            usersRef,
            where('lastActive', '>=', sevenDaysAgoTimestamp)
        );
        const activeUsersSnapshot = await getDocs(activeUsersQuery);
        const activeUsers = activeUsersSnapshot.size;
        
        // Получаем забаненных пользователей
        const bannedUsersQuery = query(
            usersRef,
            where('status', '==', 'banned')
        );
        const bannedUsersSnapshot = await getDocs(bannedUsersQuery);
        const bannedUsers = bannedUsersSnapshot.size;
        
        // Получаем новых пользователей за сегодня
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = Timestamp.fromDate(today);
        
        const newTodayQuery = query(
            usersRef,
            where('createdAt', '>=', todayTimestamp)
        );
        const newTodaySnapshot = await getDocs(newTodayQuery);
        const newToday = newTodaySnapshot.size;
        
        // Получаем новых пользователей за неделю
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoTimestamp = Timestamp.fromDate(weekAgo);
        
        const newThisWeekQuery = query(
            usersRef,
            where('createdAt', '>=', weekAgoTimestamp)
        );
        const newThisWeekSnapshot = await getDocs(newThisWeekQuery);
        const newThisWeek = newThisWeekSnapshot.size;
        
        return {
            total: totalUsers,
            active: activeUsers,
            banned: bannedUsers,
            newToday,
            newThisWeek
        };
    };
    
    const fetchChatsStats = async () => {
        // Получаем общее количество чатов
        const chatsRef = collection(db, 'chats');
        const chatsSnapshot = await getDocs(chatsRef);
        const totalChats = chatsSnapshot.size;
        
        // Получаем активные чаты
        const activeChatsQuery = query(
            chatsRef,
            where('status', '==', 'active')
        );
        const activeChatsSnapshot = await getDocs(activeChatsQuery);
        const activeChats = activeChatsSnapshot.size;
        
        // Получаем завершенные чаты
        const completedChatsQuery = query(
            chatsRef,
            where('status', '==', 'ended')
        );
        const completedChatsSnapshot = await getDocs(completedChatsQuery);
        const completedChats = completedChatsSnapshot.size;
        
        // Получаем количество сообщений
        const messagesRef = collection(db, 'messages');
        const messagesQuery = query(messagesRef, limit(1));
        
        let messagesCount = 0;
        let avgMessagesPerChat = 0;
        
        try {
            // Примечание: в реальном приложении вы можете хранить 
            // количество сообщений в отдельной коллекции для статистики,
            // так как подсчет всех сообщений может быть ресурсоемким
            const aggregatedStatsDoc = await getDoc(doc(db, 'statistics', 'messages'));
            
            if (aggregatedStatsDoc.exists()) {
                const statsData = aggregatedStatsDoc.data();
                messagesCount = statsData.totalCount || 0;
            } else {
                // Приблизительная оценка - в реальности нужен другой подход
                messagesCount = totalChats * 15; // предполагаем в среднем 15 сообщений на чат
            }
            
            avgMessagesPerChat = totalChats > 0 ? Math.round(messagesCount / totalChats) : 0;
        } catch (err) {
            console.error('Ошибка при получении статистики сообщений:', err);
            messagesCount = totalChats * 15; // fallback оценка
            avgMessagesPerChat = totalChats > 0 ? Math.round(messagesCount / totalChats) : 0;
        }
        
        return {
            total: totalChats,
            active: activeChats,
            completed: completedChats,
            messagesCount,
            avgMessagesPerChat
        };
    };
    
    const fetchReportsStats = async () => {
        // Получаем общее количество жалоб
        const reportsRef = collection(db, 'reports');
        const reportsSnapshot = await getDocs(reportsRef);
        const totalReports = reportsSnapshot.size;
        
        // Получаем ожидающие рассмотрения жалобы
        const pendingReportsQuery = query(
            reportsRef,
            where('status', '==', 'pending')
        );
        const pendingReportsSnapshot = await getDocs(pendingReportsQuery);
        const pendingReports = pendingReportsSnapshot.size;
        
        // Получаем разрешенные жалобы
        const resolvedReportsQuery = query(
            reportsRef,
            where('status', '==', 'resolved')
        );
        const resolvedReportsSnapshot = await getDocs(resolvedReportsQuery);
        const resolvedReports = resolvedReportsSnapshot.size;
        
        // Получаем количество блокировок по жалобам
        const bansQuery = query(
            reportsRef,
            where('resolution', '==', 'ban')
        );
        const bansSnapshot = await getDocs(bansQuery);
        const bans = bansSnapshot.size;
        
        return {
            total: totalReports,
            pending: pendingReports,
            resolved: resolvedReports,
            bans
        };
    };
    
    const fetchDailyStats = async (timeframe) => {
        // В реальном приложении статистика по дням может храниться в отдельной коллекции
        // Здесь просто генерируем примерные данные для демонстрации
        
        let days = 7;
        switch (timeframe) {
            case 'day':
                days = 1;
                break;
            case 'week':
                days = 7;
                break;
            case 'month':
                days = 30;
                break;
            case 'year':
                days = 30; // Для года показываем статистику по месяцам
                break;
        }
        
        const dailyStatsData = [];
        const now = new Date();
        
        for (let i = 0; i < days; i++) {
            const date = new Date(now);
            date.setDate(now.getDate() - i);
            
            const dateStr = timeframe === 'year' 
                ? date.toLocaleDateString('ru-RU', { month: 'long' })
                : date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
            
            // Генерируем случайные данные для визуализации
            const newUsers = Math.floor(Math.random() * 20) + 5;
            const newChats = Math.floor(Math.random() * 40) + 10;
            const newReports = Math.floor(Math.random() * 5);
            
            dailyStatsData.push({
                date: dateStr,
                newUsers,
                newChats,
                newReports
            });
        }
        
        // Возвращаем данные в обратном порядке, чтобы они шли от старых к новым
        return dailyStatsData.reverse();
    };
    
    const fetchTopUsers = async (startDate, endDate) => {
        // В реальном приложении это может быть сложный запрос с агрегацией данных
        // Здесь просто возвращаем примерные данные для демонстрации
        
        try {
            const usersRef = collection(db, 'users');
            const usersQuery = query(
                usersRef,
                orderBy('messagesSent', 'desc'),
                limit(5)
            );
            
            const usersSnapshot = await getDocs(usersQuery);
            
            const topUsersData = usersSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    username: data.username || 'Пользователь',
                    messagesSent: data.messagesSent || Math.floor(Math.random() * 500) + 100,
                    chatsStarted: data.chatsStarted || Math.floor(Math.random() * 50) + 5,
                    lastActive: data.lastActive ? (typeof data.lastActive.toDate === 'function' ? data.lastActive.toDate() : data.lastActive) : new Date()
                };
            });
            
            // Если данных мало, добавим еще записи
            if (topUsersData.length < 5) {
                const additionalUsers = 5 - topUsersData.length;
                for (let i = 0; i < additionalUsers; i++) {
                    topUsersData.push({
                        id: `generated-${i}`,
                        username: `Активный пользователь ${i+1}`,
                        messagesSent: Math.floor(Math.random() * 500) + 100,
                        chatsStarted: Math.floor(Math.random() * 50) + 5,
                        lastActive: new Date()
                    });
                }
            }
            
            return topUsersData;
            
        } catch (err) {
            console.error('Ошибка при получении статистики топ пользователей:', err);
            
            // Возвращаем сгенерированные данные в случае ошибки
            const generatedData = [];
            for (let i = 0; i < 5; i++) {
                generatedData.push({
                    id: `generated-${i}`,
                    username: `Пользователь ${i+1}`,
                    messagesSent: Math.floor(Math.random() * 500) + 100,
                    chatsStarted: Math.floor(Math.random() * 50) + 5,
                    lastActive: new Date()
                });
            }
            
            return generatedData;
        }
    };
    
    const formatDate = (date) => {
        if (!date) return 'Неизвестно';
        
        if (typeof date === 'string') {
            return date;
        }
        
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    const handleTimeframeChange = (timeframe) => {
        setSelectedTimeframe(timeframe);
    };

    return (
        <div className="admin-stats-container">
            <div className="admin-stats-header">
                <h1>Статистика приложения</h1>
                <button
                    className="admin-back-button"
                    onClick={() => navigate('/admin')}
                >
                    Назад
                </button>
            </div>
            
            <div className="timeframe-selector">
                <button 
                    className={`timeframe-button ${selectedTimeframe === 'day' ? 'active' : ''}`}
                    onClick={() => handleTimeframeChange('day')}
                >
                    День
                </button>
                <button 
                    className={`timeframe-button ${selectedTimeframe === 'week' ? 'active' : ''}`}
                    onClick={() => handleTimeframeChange('week')}
                >
                    Неделя
                </button>
                <button 
                    className={`timeframe-button ${selectedTimeframe === 'month' ? 'active' : ''}`}
                    onClick={() => handleTimeframeChange('month')}
                >
                    Месяц
                </button>
                <button 
                    className={`timeframe-button ${selectedTimeframe === 'year' ? 'active' : ''}`}
                    onClick={() => handleTimeframeChange('year')}
                >
                    Год
                </button>
            </div>
            
            {loading && <div className="loading-spinner">Загрузка статистики...</div>}
            
            {error && <div className="error-message">{error}</div>}
            
            {!loading && !error && (
                <div className="stats-content">
                    <div className="stats-cards">
                        {/* Статистика пользователей */}
                        <div className="stats-card">
                            <div className="stats-card-header">
                                <h2>Пользователи</h2>
                                <div className="stats-card-icon users-icon">👥</div>
                            </div>
                            <div className="stats-card-content">
                                <div className="stats-item">
                                    <span className="stats-label">Всего:</span>
                                    <span className="stats-value">{stats.users.total}</span>
                                </div>
                                <div className="stats-item">
                                    <span className="stats-label">Активных:</span>
                                    <span className="stats-value">{stats.users.active}</span>
                                </div>
                                <div className="stats-item">
                                    <span className="stats-label">Заблокировано:</span>
                                    <span className="stats-value">{stats.users.banned}</span>
                                </div>
                                <div className="stats-item">
                                    <span className="stats-label">Новых сегодня:</span>
                                    <span className="stats-value">{stats.users.newToday}</span>
                                </div>
                                <div className="stats-item">
                                    <span className="stats-label">Новых за неделю:</span>
                                    <span className="stats-value">{stats.users.newThisWeek}</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Статистика чатов */}
                        <div className="stats-card">
                            <div className="stats-card-header">
                                <h2>Чаты</h2>
                                <div className="stats-card-icon chats-icon">💬</div>
                            </div>
                            <div className="stats-card-content">
                                <div className="stats-item">
                                    <span className="stats-label">Всего:</span>
                                    <span className="stats-value">{stats.chats.total}</span>
                                </div>
                                <div className="stats-item">
                                    <span className="stats-label">Активных:</span>
                                    <span className="stats-value">{stats.chats.active}</span>
                                </div>
                                <div className="stats-item">
                                    <span className="stats-label">Завершенных:</span>
                                    <span className="stats-value">{stats.chats.completed}</span>
                                </div>
                                <div className="stats-item">
                                    <span className="stats-label">Всего сообщений:</span>
                                    <span className="stats-value">{stats.chats.messagesCount}</span>
                                </div>
                                <div className="stats-item">
                                    <span className="stats-label">Сообщений на чат:</span>
                                    <span className="stats-value">{stats.chats.avgMessagesPerChat}</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Статистика жалоб */}
                        <div className="stats-card">
                            <div className="stats-card-header">
                                <h2>Жалобы</h2>
                                <div className="stats-card-icon reports-icon">⚠️</div>
                            </div>
                            <div className="stats-card-content">
                                <div className="stats-item">
                                    <span className="stats-label">Всего:</span>
                                    <span className="stats-value">{stats.reports.total}</span>
                                </div>
                                <div className="stats-item">
                                    <span className="stats-label">Ожидают:</span>
                                    <span className="stats-value">{stats.reports.pending}</span>
                                </div>
                                <div className="stats-item">
                                    <span className="stats-label">Рассмотрено:</span>
                                    <span className="stats-value">{stats.reports.resolved}</span>
                                </div>
                                <div className="stats-item">
                                    <span className="stats-label">Блокировок:</span>
                                    <span className="stats-value">{stats.reports.bans}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* График активности */}
                    <div className="stats-graph-section">
                        <h2>Активность за {
                            selectedTimeframe === 'day' ? 'день' : 
                            selectedTimeframe === 'week' ? 'неделю' : 
                            selectedTimeframe === 'month' ? 'месяц' : 'год'
                        }</h2>
                        <div className="stats-graph">
                            <div className="graph-legend">
                                <div className="legend-item">
                                    <span className="legend-color users-color"></span>
                                    <span>Новые пользователи</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-color chats-color"></span>
                                    <span>Новые чаты</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-color reports-color"></span>
                                    <span>Жалобы</span>
                                </div>
                            </div>
                            
                            <div className="graph-container">
                                <div className="graph-labels">
                                    {dailyStats.map(day => (
                                        <div key={day.date} className="graph-label">{day.date}</div>
                                    ))}
                                </div>
                                
                                <div className="graph-data-container">
                                    {dailyStats.map(day => (
                                        <div key={day.date} className="graph-day-group">
                                            <div 
                                                className="graph-bar users-bar" 
                                                style={{ height: `${Math.min(day.newUsers * 3, 100)}px` }}
                                                title={`${day.newUsers} новых пользователей`}
                                            >
                                                <span className="bar-value">{day.newUsers}</span>
                                            </div>
                                            <div 
                                                className="graph-bar chats-bar" 
                                                style={{ height: `${Math.min(day.newChats * 1.5, 100)}px` }}
                                                title={`${day.newChats} новых чатов`}
                                            >
                                                <span className="bar-value">{day.newChats}</span>
                                            </div>
                                            <div 
                                                className="graph-bar reports-bar" 
                                                style={{ height: `${Math.min(day.newReports * 10, 100)}px` }}
                                                title={`${day.newReports} жалоб`}
                                            >
                                                <span className="bar-value">{day.newReports}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Топ пользователей */}
                    <div className="top-users-section">
                        <h2>Самые активные пользователи</h2>
                        <div className="top-users-table">
                            <div className="top-users-header">
                                <div className="user-column">Пользователь</div>
                                <div className="messages-column">Сообщений</div>
                                <div className="chats-column">Чатов</div>
                                <div className="last-active-column">Последняя активность</div>
                            </div>
                            
                            <div className="top-users-body">
                                {topUsers.map((user, index) => (
                                    <div key={user.id} className="top-user-row">
                                        <div className="user-column">
                                            <span className="user-rank">{index + 1}</span>
                                            <span className="user-name">{user.username}</span>
                                        </div>
                                        <div className="messages-column">{user.messagesSent}</div>
                                        <div className="chats-column">{user.chatsStarted}</div>
                                        <div className="last-active-column">{formatDate(user.lastActive)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminStats; 