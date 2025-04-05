import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserSupportRequests, createSupportRequest } from '../utils/supportService';
import { UserContext } from '../contexts/UserContext';
import WebApp from '@twa-dev/sdk';
import { safeHapticFeedback, safeShowPopup } from '../utils/telegramWebAppUtils';
import { useToast } from '../components/Toast';
import '../styles/UserSupport.css';

const UserSupport = () => {
    const navigate = useNavigate();
    const { user } = useContext(UserContext);
    const { showToast } = useToast();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showNewRequestModal, setShowNewRequestModal] = useState(false);
    const [newRequestText, setNewRequestText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [activeRequest, setActiveRequest] = useState(null);

    // Установка кнопки "Назад" в Telegram WebApp
    useEffect(() => {
        try {
            if (WebApp.isExpanded !== undefined) {
                WebApp.BackButton.show();
                WebApp.BackButton.onClick(() => navigate(-1));
            }

            return () => {
                if (WebApp.isExpanded !== undefined) {
                    WebApp.BackButton.offClick(() => navigate(-1));
                    WebApp.BackButton.hide();
                }
            };
        } catch (error) {
            console.warn('Ошибка при настройке кнопки "Назад":', error);
        }
    }, [navigate]);

    // Загрузка запросов пользователя
    useEffect(() => {
        const loadRequests = async () => {
            if (!user) return;

            try {
                setLoading(true);
                setError(null);

                // Получаем ID пользователя из разных источников
                let userId = user.telegramId || user.id;

                if (!userId) {
                    // Пробуем получить ID из sessionStorage или localStorage
                    try {
                        const userDataStr = sessionStorage.getItem('userData');
                        if (userDataStr) {
                            const userData = JSON.parse(userDataStr);
                            userId = userData.telegramId;
                        }

                        if (!userId) {
                            userId = localStorage.getItem('current_user_id');
                        }
                    } catch (e) {
                        console.warn('Ошибка при получении ID из хранилища:', e);
                    }
                }

                if (!userId) {
                    setError('Не удалось определить ID пользователя. Пожалуйста, перезагрузите страницу.');
                    setLoading(false);
                    return;
                }

                const userRequests = await getUserSupportRequests(userId);
                setRequests(userRequests || []);
            } catch (error) {
                console.error('Ошибка при загрузке запросов:', error);
                setError('Не удалось загрузить ваши запросы в поддержку. Пожалуйста, попробуйте позже.');
            } finally {
                setLoading(false);
            }
        };

        loadRequests();
    }, [user]);

    // Создание нового запроса
    const handleNewRequest = async () => {
        if (!newRequestText.trim()) return;

        try {
            setSubmitting(true);

            // Получаем ID пользователя из разных источников
            let userId = user?.telegramId || user?.id;

            if (!userId) {
                // Пробуем получить ID из sessionStorage или localStorage
                try {
                    const userDataStr = sessionStorage.getItem('userData');
                    if (userDataStr) {
                        const userData = JSON.parse(userDataStr);
                        userId = userData.telegramId;
                    }

                    if (!userId) {
                        userId = localStorage.getItem('current_user_id');
                    }
                } catch (e) {
                    console.warn('Ошибка при получении ID из хранилища:', e);
                }
            }

            if (!userId) {
                throw new Error('Не удалось определить ID пользователя');
            }

            console.log('Отправка запроса с ID пользователя:', userId);

            await createSupportRequest(newRequestText);

            // Тактильная обратная связь
            safeHapticFeedback('notification', null, 'success');

            // Используем toast для уведомления
            showToast('Ваш запрос успешно отправлен. Мы ответим вам в ближайшее время.', 'success');

            setNewRequestText('');
            setShowNewRequestModal(false);

            // Обновляем список запросов
            const userRequests = await getUserSupportRequests(userId);
            setRequests(userRequests || []);

            // Предлагаем пользователю перейти в чат поддержки
            setTimeout(() => {
                safeShowPopup({
                    title: 'Чат с поддержкой',
                    message: 'Вы можете продолжить общение с поддержкой в чате. Перейти сейчас?',
                    buttons: [
                        {
                            id: 'go_to_chat',
                            text: 'Перейти в чат',
                            type: 'default'
                        },
                        {
                            text: 'Позже',
                            type: 'cancel'
                        }
                    ]
                }).then((buttonId) => {
                    if (buttonId === 'go_to_chat') {
                        navigate('/chats');
                    }
                });
            }, 1000);

        } catch (error) {
            console.error('Ошибка при отправке запроса в поддержку:', error);
            showToast(`Не удалось отправить запрос: ${error.message}. Пожалуйста, попробуйте позже.`, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // Открытие деталей запроса
    const openRequestDetails = (request) => {
        safeHapticFeedback('selection');
        setActiveRequest(request);
    };

    // Закрытие деталей запроса
    const closeRequestDetails = () => {
        setActiveRequest(null);
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

    return (
        <div className="user-support-container">
            <div className="user-support-header">
                <h1>Служба поддержки</h1>
                <button
                    className="new-request-button"
                    onClick={() => setShowNewRequestModal(true)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Новый запрос
                </button>
            </div>

            {error && (
                <div className="user-support-error">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="user-support-loading">
                    <div className="loading-spinner"></div>
                    <p>Загрузка ваших запросов...</p>
                </div>
            ) : (
                <>
                    {requests.length === 0 ? (
                        <div className="user-support-empty">
                            <div className="empty-icon">📩</div>
                            <h2>У вас еще нет запросов</h2>
                            <p>Создайте новый запрос, если у вас есть вопрос или проблема.</p>
                            <button
                                className="empty-new-request-button"
                                onClick={() => setShowNewRequestModal(true)}
                            >
                                Создать запрос
                            </button>
                        </div>
                    ) : (
                        <div className="requests-list">
                            {requests.map((request) => (
                                <div
                                    key={request.id}
                                    className="request-item"
                                    onClick={() => openRequestDetails(request)}
                                >
                                    <div className="request-header">
                                        <div className="request-date">
                                            {formatDate(request.createdAt)}
                                        </div>
                                        <div
                                            className="request-status"
                                            style={{ backgroundColor: getStatusColor(request.status) }}
                                        >
                                            {getStatusText(request.status)}
                                        </div>
                                    </div>
                                    <div className="request-message">
                                        {request.message.length > 120
                                            ? `${request.message.substring(0, 120)}...`
                                            : request.message}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Модальное окно нового запроса */}
            {showNewRequestModal && (
                <div className="modal-overlay" onClick={() => setShowNewRequestModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Новый запрос в поддержку</h2>
                            <button
                                className="modal-close"
                                onClick={() => setShowNewRequestModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>Опишите ваш вопрос или проблему, и наши специалисты ответят вам как можно скорее.</p>
                            <textarea
                                value={newRequestText}
                                onChange={(e) => setNewRequestText(e.target.value)}
                                placeholder="Введите ваше сообщение..."
                                rows={6}
                            />
                        </div>
                        <div className="modal-footer">
                            <button
                                className="modal-cancel-btn"
                                onClick={() => setShowNewRequestModal(false)}
                                disabled={submitting}
                            >
                                Отмена
                            </button>
                            <button
                                className="modal-submit-btn"
                                onClick={handleNewRequest}
                                disabled={!newRequestText.trim() || submitting}
                            >
                                {submitting ? (
                                    <>
                                        <span className="submit-spinner"></span>
                                        Отправка...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="22" y1="2" x2="11" y2="13"></line>
                                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                        </svg>
                                        Отправить
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модальное окно деталей запроса */}
            {activeRequest && (
                <div className="modal-overlay" onClick={closeRequestDetails}>
                    <div className="modal-content request-details" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Детали запроса</h2>
                            <button className="modal-close" onClick={closeRequestDetails}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="request-detail-item">
                                <span className="detail-label">Статус:</span>
                                <span
                                    className="detail-status"
                                    style={{ backgroundColor: getStatusColor(activeRequest.status) }}
                                >
                                    {getStatusText(activeRequest.status)}
                                </span>
                            </div>
                            <div className="request-detail-item">
                                <span className="detail-label">Дата создания:</span>
                                <span className="detail-value">{formatDate(activeRequest.createdAt)}</span>
                            </div>
                            <div className="request-message-content">
                                <h3>Ваше сообщение:</h3>
                                <div className="message-text">{activeRequest.message}</div>
                            </div>

                            {activeRequest.response && (
                                <div className="request-response">
                                    <h3>Ответ поддержки:</h3>
                                    <div className="response-text">{activeRequest.response}</div>
                                    <div className="response-date">
                                        Получен: {formatDate(activeRequest.updatedAt)}
                                    </div>
                                </div>
                            )}

                            {activeRequest.status === 'new' && (
                                <div className="request-waiting">
                                    <p>Ваш запрос находится в очереди на рассмотрение.</p>
                                </div>
                            )}

                            {activeRequest.status === 'processing' && (
                                <div className="request-processing">
                                    <p>Ваш запрос рассматривается специалистом поддержки.</p>
                                </div>
                            )}

                            {activeRequest.status === 'rejected' && !activeRequest.response && (
                                <div className="request-rejected">
                                    <p>Ваш запрос был отклонен.</p>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="modal-close-btn" onClick={closeRequestDetails}>
                                Закрыть
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserSupport;
