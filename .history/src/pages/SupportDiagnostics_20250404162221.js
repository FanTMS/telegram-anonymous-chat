import React, { useState, useEffect } from 'react';
import { runSupportSystemDiagnostics, checkFirestoreConnection } from '../utils/debugUtils';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';

const SupportDiagnostics = () => {
    const [userId, setUserId] = useState('');
    const [diagnosticResults, setDiagnosticResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState(null);
    const navigate = useNavigate();
    const { showToast } = useToast();
    
    // Проверка соединения при загрузке страницы
    useEffect(() => {
        const checkConnection = async () => {
            const isConnected = await checkFirestoreConnection();
            setConnectionStatus(isConnected);
        };
        
        checkConnection();
    }, []);
    
    // Запуск диагностики
    const runDiagnostics = async () => {
        if (!userId.trim()) {
            showToast('Пожалуйста, введите ID пользователя', 'error');
            return;
        }
        
        setLoading(true);
        try {
            const results = await runSupportSystemDiagnostics(userId);
            setDiagnosticResults(results);
            
            if (results.firestoreConnection) {
                showToast('Диагностика завершена успешно', 'success');
            } else {
                showToast('Проблема с подключением к базе данных', 'error');
            }
        } catch (error) {
            console.error('Ошибка при выполнении диагностики:', error);
            showToast(`Ошибка диагностики: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="diagnostics-container">
            <h1>Диагностика системы поддержки</h1>
            
            <div className="connection-status">
                <h3>Статус соединения с базой данных:</h3>
                {connectionStatus === null ? (
                    <p>Проверка подключения...</p>
                ) : connectionStatus ? (
                    <p className="status-ok">✅ Подключено</p>
                ) : (
                    <p className="status-error">❌ Нет подключения</p>
                )}
            </div>
            
            <div className="user-id-input">
                <h3>Введите ID пользователя для диагностики:</h3>
                <input 
                    type="text" 
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="ID пользователя"
                />
                <button 
                    onClick={runDiagnostics} 
                    disabled={loading || !connectionStatus}
                >
                    {loading ? 'Выполняется...' : 'Запустить диагностику'}
                </button>
            </div>
            
            {diagnosticResults && (
                <div className="diagnostic-results">
                    <h3>Результаты диагностики:</h3>
                    
                    <div className="results-summary">
                        <p>Соединение с базой данных: {diagnosticResults.firestoreConnection ? '✅ Работает' : '❌ Не работает'}</p>
                        <p>Чат поддержки: {diagnosticResults.supportChat?.exists ? '✅ Существует' : '❌ Не найден'}</p>
                        <p>Запросы в поддержку: {diagnosticResults.supportRequests?.length > 0 ? `✅ Найдено ${diagnosticResults.supportRequests.length}` : '❌ Не найдены'}</p>
                    </div>
                    
                    {diagnosticResults.supportChat?.exists && (
                        <div className="chat-details">
                            <h4>Детали чата поддержки:</h4>
                            <p>ID чата: {diagnosticResults.supportChat.chatId}</p>
                            <p>Количество сообщений: {diagnosticResults.supportChat.messagesCount}</p>
                        </div>
                    )}
                    
                    <div className="raw-data">
                        <h4>Полные данные диагностики:</h4>
                        <pre>{JSON.stringify(diagnosticResults, null, 2)}</pre>
                    </div>
                </div>
            )}
            
            <button className="back-button" onClick={() => navigate(-1)}>
                Вернуться назад
            </button>
        </div>
    );
};

export default SupportDiagnostics;
