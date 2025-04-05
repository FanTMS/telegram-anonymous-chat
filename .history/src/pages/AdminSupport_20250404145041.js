import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupportRequests, updateSupportRequest } from '../utils/supportService';
import { getUserById } from '../utils/userService';
import WebApp from '@twa-dev/sdk';
import '../styles/AdminSupport.css';

// Список администраторов (Telegram IDs)
const ADMIN_IDS = ['12345678', '87654321']; // Замените на реальные Telegram ID администраторов

const AdminSupport = () => {
    const navigate = useNavigate();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [supportRequests, setSupportRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentAdminId, setCurrentAdminId] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [responseText, setResponseText] = useState('');
    const [filter, setFilter] = useState('all');
    const [refreshTrigger, setRefreshTrigger] = useState(0);

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
                setCurrentAdminId(userId);

                // Если локальная разработка, разрешаем доступ
                if (process.env.NODE_ENV === 'development') {
                    setIsAuthorized(true);
                    setCurrentAdminId('12345678'); // ID для разработки
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

    // Загрузка запросов в поддержку
    useEffect(() => {
        const loadSupportRequests = async () => {
            if (!isAuthorized) return;

            try {
                setLoading(true);
                setError(null);

                // Определяем статус фильтра для запроса
                let statusFilter = null;
                if (filter !== 'all') {
                    statusFilter = filter;
                }

                const requests = await getSupportRequests(statusFilter, 100);

                // Получаем информацию о пользователях для запросов
                const requestsWithUserData = await Promise.all(
                    requests.map(async (request) => {
                        try {
                            if (request.userId) {
                                const userData = await getUserById(request.userId);
                                if (userData) {
                                    return {
                                        ...request,
                                        userData: userData
                                    };
                                }
                            }
                            return request;
                        } catch (error) {
                            console.warn(`Не удалось получить информацию о пользователе ${request.userId}:`, error);
                            return request;
                        }
                    })
                );

                setSupportRequests(requestsWithUserData);
            } catch (error) {
                console.error('Ошибка при загрузке запросов в поддержку:', error);
                setError('Не удалось загрузить запросы. Пожалуйста, попробуйте позже.');
            } finally {
                setLoading(false);
            }
        };

        if (!isCheckingAuth) {
            loadSupportRequests();
        }
    }, [isAuthorized, isCheckingAuth, filter, refreshTrigger]);

    // Ручное обновление списка запросов
    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    // Обработка выбора запроса
    const handleSelectRequest = (request) => {
        setSelectedRequest(request);
        setResponseText(request.response || '');
    };

    // Обработка изменения статуса запроса
    const handleStatusChange = async (newStatus) => {
        if (!selectedRequest) return;
        
        try {
            setLoading(true);
            
            const result = await updateSupportRequest(
                selectedRequest.id,
                newStatus,
                currentAdminId,
                newStatus === 'resolved' ? responseText : selectedRequest.response
            );
            
            if (!result) {
                throw new Error('Не удалось обновить статус запроса');
            }
            
            // Обновляем список запросов
            handleRefresh();
            
            // Если запрос разрешен или отклонен, закрываем детали
            if (newStatus === 'resolved' || newStatus === 'rejected') {
                setSelectedRequest(null);
            }
        } catch (error) {
            console.error('Ошибка при обновлении статуса запроса:', error);
            alert('Не удалось обновить статус запроса. Пожалуйста, попробуйте позже.');
        } finally {
            setLoading(false);
        }
    };

    // Отправка ответа
    const handleSendResponse = async () => {
        if (!selectedRequest || !responseText.trim()) return;
        
        try {
            setLoading(true);
            
            const result = await updateSupportRequest(
                selectedRequest.id,
                'resolved',
                currentAdminId,
                responseText
            );
            
            if (!result) {
                throw new Error('Не удалось отправить ответ');
            }
            
            // Обновляем список запросов
            handleRefresh();
            
            // Закрываем детали запроса
            setSelectedRequest(null);
        } catch (error) {
            console.error('Ошибка при отправке ответа:', error);
            alert('Не удалось отправить ответ. Пожалуйста, попробуйте позже.');
        } finally {
            setLoading(false);
        }
    };

    // Форматирование даты
    const formatDate = (date) => {
        if (!date) return 'Неизвестно';

        return new Date(date).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Получение цвета статуса запроса
    const getStatusColor = (status) => {
        switch (status) {
            case 'new': return '#ff9800';
            case 'processing': return '#2196f3';
            case 'resolved': return '#4caf50';
            case 'rejected': return '#f44336';
            default: return '#999999';
        }
    };

    // Получение текста статуса запроса
    const getStatusText = (status) => {
        switch (status) {
            case 'new': return 'Новый';
            case 'processing': return 'В обработке';
            case 'resolved': return 'Решен';
            case 'rejected': return 'Отклонен';
            default: return 'Неизвестно';
        }
    };

    // Если проверка прав завершена и пользователь не админ - редирект
    if (!isCheckingAuth && !isAuthorized) {
        return (
            <div className="admin-unauthorized">
                <h2>Доступ запрещен</h2>
                <p>У вас нет прав для доступа к этой странице.</p>
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
        <div className="admin-support-container">
            <div className="admin-header">
                <h1>Панель поддержки</h1>
                <div className="admin-actions">
                    <button className="admin-refresh-button" onClick={handleRefresh} disabled={loading}>
                        {loading ? 'Обновление...' : 'Обновить'}
                    </button>
                    <button className="admin-back-button" onClick={() => navigate('/admin')}>
                        К администрированию
                    </button>
                </div>
            </div>

            <div className="admin-filter">
                <span>Фильтр:</span>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    disabled={loading}
                >
                    <option value="all">Все запросы</option>
                    <option value="new">Новые</option>
                    <option value="processing">В обработке</option>
                    <option value="resolved">Решенные</option>
                    <option value="rejected">Отклоненные</option>
                </select>
            </div>

            {error && (
                <div className="admin-error-message">
                    {error}
                </div>
            )}

            <div className="admin-support-content">
                <div className="admin-requests-list">
                    <h2>Запросы в поддержку</h2>

                    {loading && !supportRequests.length && (
                        <div className="admin-loading">
                            <div className="admin-loading-spinner"></div>
                            <p>Загрузка запросов...</p>
                        </div>
                    )}

                    {!loading && !supportRequests.length && (
                        <div className="admin-no-requests">
                            <p>Запросов не найдено</p>
                        </div>
                    )}

                    {supportRequests.map((request) => (
                        <div
                            key={request.id}
                            className={`admin-request-item ${selectedRequest?.id === request.id ? 'selected' : ''}`}
                            onClick={() => handleSelectRequest(request)}
                        >
                            <div className="admin-request-header">
                                <div className="admin-request-user">
                                    <span className="admin-request-name">
                                        {request.firstName || request.username || request.userId || 'Неизвестный пользователь'}
                                    </span>
                                </div>
                                <div
                                    className="admin-request-status"
                                    style={{ backgroundColor: getStatusColor(request.status) }}
                                >
                                    {getStatusText(request.status)}
                                </div>
                            </div>

                            <div className="admin-request-message">
                                {request.message.length > 100
                                    ? `${request.message.substring(0, 100)}...`
                                    : request.message}
                            </div>

                            <div className="admin-request-date">
                                {formatDate(request.createdAt)}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="admin-request-details">
                    {selectedRequest ? (
                        <>
                            <h2>Детали запроса</h2>

                            <div className="admin-request-detail-item">
                                <span className="admin-detail-label">Пользователь:</span>
                                <span className="admin-detail-value">
                                    {selectedRequest.firstName || selectedRequest.username || selectedRequest.userId || 'Неизвестный пользователь'}
                                    {selectedRequest.username && ` (@${selectedRequest.username})`}
                                </span>
                            </div>

                            <div className="admin-request-detail-item">
                                <span className="admin-detail-label">Telegram ID:</span>
                                <span className="admin-detail-value">{selectedRequest.userId || 'Неизвестно'}</span>
                            </div>

                            <div className="admin-request-detail-item">
                                <span className="admin-detail-label">Дата создания:</span>
                                <span className="admin-detail-value">{formatDate(selectedRequest.createdAt)}</span>
                            </div>

                            <div className="admin-request-detail-item">
                                <span className="admin-detail-label">Статус:</span>
                                <span
                                    className="admin-detail-value admin-status-badge"
                                    style={{ backgroundColor: getStatusColor(selectedRequest.status) }}
                                >
                                    {getStatusText(selectedRequest.status)}
                                </span>
                            </div>

                            <div className="admin-request-message-full">
                                <span className="admin-detail-label">Сообщение:</span>
                                <div className="admin-message-content">
                                    {selectedRequest.message}
                                </div>
                            </div>

                            {selectedRequest.assignedTo && (
                                <div className="admin-request-detail-item">
                                    <span className="admin-detail-label">Назначено:</span>
                                    <span className="admin-detail-value">
                                        {selectedRequest.assignedTo === currentAdminId ? 'Вам' : selectedRequest.assignedTo}
                                    </span>
                                </div>
                            )}

                            <div className="admin-response-area">
                                <span className="admin-detail-label">Ответ:</span>
                                <textarea
                                    className="admin-response-input"
                                    value={responseText}
                                    onChange={(e) => setResponseText(e.target.value)}
                                    placeholder="Введите ответ пользователю..."
                                    rows={5}
                                    disabled={selectedRequest.status === 'resolved' || selectedRequest.status === 'rejected'}
                                />
                            </div>

                            <div className="admin-request-actions">
                                {selectedRequest.status === 'new' && (
                                    <button
                                        className="admin-action-button processing"
                                        onClick={() => handleStatusChange('processing')}
                                        disabled={loading}
                                    >
                                        Взять в работу
                                    </button>
                                )}

                                {(selectedRequest.status === 'new' || selectedRequest.status === 'processing') && (
                                    <>
                                        <button
                                            className="admin-action-button resolve"
                                            onClick={handleSendResponse}
                                            disabled={loading || !responseText.trim()}
                                        >
                                            Решить и ответить
                                        </button>

                                        <button
                                            className="admin-action-button reject"
                                            onClick={() => handleStatusChange('rejected')}
                                            disabled={loading}
                                        >
                                            Отклонить
                                        </button>
                                    </>
                                )}

                                <button
                                    className="admin-action-button cancel"
                                    onClick={() => setSelectedRequest(null)}
                                >
                                    Закрыть
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="admin-no-request-selected">
                            <p>Выберите запрос для просмотра деталей</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminSupport;
