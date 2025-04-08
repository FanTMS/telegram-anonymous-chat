import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { 
    collection, 
    query, 
    orderBy, 
    getDocs, 
    doc, 
    updateDoc, 
    getDoc, 
    Timestamp, 
    where
} from 'firebase/firestore';
import { useAuth } from '../hooks/useAuth';
import { addSupportChat } from '../utils/supportService';
import '../styles/AdminReports.css';

const AdminReports = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);
    const [showChatModal, setShowChatModal] = useState(false);
    const [decisionComment, setDecisionComment] = useState('');
    const [currentStatus, setCurrentStatus] = useState('pending');

    useEffect(() => {
        fetchReports(currentStatus);
    }, [currentStatus]);

    const fetchReports = async (status = 'pending') => {
        try {
            setLoading(true);
            
            const reportsRef = collection(db, 'reports');
            const q = query(
                reportsRef, 
                where('status', '==', status),
                orderBy('createdAt', 'desc')
            );
            
            const querySnapshot = await getDocs(q);
            const reportsList = [];
            
            for (const docSnapshot of querySnapshot.docs) {
                const reportData = docSnapshot.data();
                const reportWithId = {
                    id: docSnapshot.id,
                    ...reportData,
                    createdAt: reportData.createdAt ? (typeof reportData.createdAt.toDate === 'function' ? reportData.createdAt.toDate() : reportData.createdAt) : new Date()
                };
                
                // Получаем информацию о пользователях
                try {
                    const reporterDoc = await getDoc(doc(db, 'users', reportData.reporterId));
                    const reportedUserDoc = await getDoc(doc(db, 'users', reportData.reportedUserId));
                    
                    reportWithId.reporterInfo = reporterDoc.exists() ? reporterDoc.data() : { username: 'Неизвестный пользователь' };
                    reportWithId.reportedUserInfo = reportedUserDoc.exists() ? reportedUserDoc.data() : { username: 'Неизвестный пользователь' };
                } catch (userError) {
                    console.error('Ошибка при получении данных пользователя:', userError);
                }
                
                reportsList.push(reportWithId);
            }
            
            setReports(reportsList);
        } catch (err) {
            console.error('Ошибка при получении списка жалоб:', err);
            setError('Не удалось загрузить список жалоб. Пожалуйста, попробуйте позже.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return 'Дата неизвестна';
        return new Date(date).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleOpenReport = (report) => {
        setSelectedReport(report);
    };

    const handleCloseReport = () => {
        setSelectedReport(null);
        setDecisionComment('');
    };

    const handleViewChat = async () => {
        if (!selectedReport || !selectedReport.chatId) {
            return;
        }
        
        navigate(`/chat/${selectedReport.chatId}`);
    };

    const handleResolveReport = async (action) => {
        if (!selectedReport) return;
        
        try {
            setLoading(true);
            
            // Обновляем статус жалобы в базе данных
            const reportRef = doc(db, 'reports', selectedReport.id);
            await updateDoc(reportRef, {
                status: 'resolved',
                resolution: action,
                resolvedBy: user.uid,
                resolvedAt: Timestamp.now(),
                adminComment: decisionComment || ''
            });
            
            // Если решение - бан пользователя
            if (action === 'ban') {
                const userRef = doc(db, 'users', selectedReport.reportedUserId);
                await updateDoc(userRef, {
                    status: 'banned',
                    bannedAt: Timestamp.now(),
                    bannedBy: user.uid,
                    banReason: `По жалобе №${selectedReport.id}: ${selectedReport.reason}`
                });
            }
            
            // Отправляем уведомление пользователю, отправившему жалобу
            try {
                const notificationMessage = action === 'ban' 
                    ? `Ваша жалоба №${selectedReport.id.substring(0, 8)} на пользователя ${selectedReport.reportedUserInfo.username || 'ID: ' + selectedReport.reportedUserId} была рассмотрена. Решение: пользователь заблокирован.` 
                    : `Ваша жалоба №${selectedReport.id.substring(0, 8)} на пользователя ${selectedReport.reportedUserInfo.username || 'ID: ' + selectedReport.reportedUserId} была рассмотрена. Решение: жалоба отклонена.`;

                await addSupportChat(
                    selectedReport.reporterId,
                    {
                        type: 'system',
                        message: notificationMessage,
                        createdAt: Timestamp.now()
                    }
                );
            } catch (notifyError) {
                console.error('Ошибка при отправке уведомления пользователю:', notifyError);
            }
            
            // Обновляем список жалоб
            fetchReports(currentStatus);
            handleCloseReport();
            
        } catch (err) {
            console.error('Ошибка при обработке жалобы:', err);
            setError('Не удалось обработать жалобу. Пожалуйста, попробуйте позже.');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusFilter = (status) => {
        setCurrentStatus(status);
    };

    return (
        <div className="admin-reports-container">
            <div className="admin-reports-header">
                <h1>Управление жалобами</h1>
                <button
                    className="admin-back-button"
                    onClick={() => navigate('/admin')}
                >
                    Назад
                </button>
            </div>

            <div className="admin-reports-filter">
                <button 
                    className={`filter-button ${currentStatus === 'pending' ? 'active' : ''}`}
                    onClick={() => handleStatusFilter('pending')}
                >
                    Ожидающие
                </button>
                <button 
                    className={`filter-button ${currentStatus === 'resolved' ? 'active' : ''}`}
                    onClick={() => handleStatusFilter('resolved')}
                >
                    Обработанные
                </button>
            </div>

            {loading && <div className="loading-spinner">Загрузка...</div>}
            
            {error && <div className="error-message">{error}</div>}

            {!loading && !error && reports.length === 0 && (
                <div className="no-reports-message">
                    {currentStatus === 'pending' 
                        ? 'Нет жалоб, требующих рассмотрения' 
                        : 'Нет обработанных жалоб'}
                </div>
            )}

            <div className="reports-list">
                {reports.map(report => (
                    <div 
                        key={report.id} 
                        className="report-item"
                        onClick={() => handleOpenReport(report)}
                    >
                        <div className="report-header">
                            <span className="report-id">№{report.id.substring(0, 8)}</span>
                            <span className="report-date">{formatDate(report.createdAt)}</span>
                        </div>
                        <div className="report-content">
                            <div className="report-users">
                                <div className="reporter">
                                    <strong>Отправитель:</strong> {report.reporterInfo?.username || 'Неизвестный пользователь'}
                                </div>
                                <div className="reported-user">
                                    <strong>На пользователя:</strong> {report.reportedUserInfo?.username || 'Неизвестный пользователь'}
                                </div>
                            </div>
                            <div className="report-reason">
                                <strong>Причина:</strong> {report.reason}
                            </div>
                            <div className="report-description">
                                {report.description}
                            </div>
                            {report.status === 'resolved' && (
                                <div className="report-resolution">
                                    <strong>Решение:</strong> {report.resolution === 'ban' ? 'Пользователь заблокирован' : 'Жалоба отклонена'}
                                    {report.adminComment && (
                                        <div className="admin-comment">
                                            <strong>Комментарий администратора:</strong> {report.adminComment}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {selectedReport && (
                <div className="report-modal">
                    <div className="report-modal-content">
                        <div className="modal-header">
                            <h2>Жалоба №{selectedReport.id.substring(0, 8)}</h2>
                            <button className="close-button" onClick={handleCloseReport}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="report-detail">
                                <strong>Дата создания:</strong> {formatDate(selectedReport.createdAt)}
                            </div>
                            <div className="report-detail">
                                <strong>Отправитель:</strong> {selectedReport.reporterInfo?.username || 'Неизвестный пользователь'}
                            </div>
                            <div className="report-detail">
                                <strong>На пользователя:</strong> {selectedReport.reportedUserInfo?.username || 'Неизвестный пользователь'}
                            </div>
                            <div className="report-detail">
                                <strong>Причина:</strong> {selectedReport.reason}
                            </div>
                            <div className="report-detail description">
                                <strong>Описание:</strong>
                                <p>{selectedReport.description}</p>
                            </div>
                            
                            <button 
                                className="view-chat-button"
                                onClick={handleViewChat}
                                disabled={!selectedReport.chatId}
                            >
                                Просмотреть переписку
                            </button>
                            
                            {selectedReport.status === 'pending' && (
                                <>
                                    <div className="admin-decision">
                                        <h3>Решение</h3>
                                        <textarea
                                            className="decision-comment"
                                            placeholder="Комментарий к решению (опционально)"
                                            value={decisionComment}
                                            onChange={(e) => setDecisionComment(e.target.value)}
                                        />
                                        <div className="decision-buttons">
                                            <button 
                                                className="reject-button"
                                                onClick={() => handleResolveReport('reject')}
                                            >
                                                Отклонить жалобу
                                            </button>
                                            <button 
                                                className="ban-button"
                                                onClick={() => handleResolveReport('ban')}
                                            >
                                                Заблокировать пользователя
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                            
                            {selectedReport.status === 'resolved' && (
                                <div className="report-resolution-details">
                                    <h3>Решение по жалобе</h3>
                                    <div className="resolution-info">
                                        <strong>Статус:</strong> {selectedReport.resolution === 'ban' ? 'Пользователь заблокирован' : 'Жалоба отклонена'}
                                    </div>
                                    {selectedReport.adminComment && (
                                        <div className="resolution-info">
                                            <strong>Комментарий:</strong> {selectedReport.adminComment}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReports; 