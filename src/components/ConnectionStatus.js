import React, { useState, useEffect } from 'react';
import connectionService from '../utils/firebaseConnectionService';
import '../styles/ConnectionStatus.css';

const ConnectionStatus = () => {
    const [status, setStatus] = useState({ connected: true, error: null });
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleConnectionChange = (newStatus) => {
            setStatus(newStatus);

            // Показываем уведомление только при потере соединения
            if (!newStatus.connected) {
                setVisible(true);
            } else {
                // Если соединение восстановлено, сразу скрываем
                setVisible(false);
            }
        };

        connectionService.addConnectionListener(handleConnectionChange);

        return () => {
            connectionService.removeConnectionListener(handleConnectionChange);
        };
    }, []);

    const handleRetry = () => {
        connectionService.checkConnection();
    };

    // Если соединение восстановлено, не показываем уведомление
    if (status.connected) {
        return null;
    }

    return (
        <div 
            className={`status-bar ${status.connected ? 'connected' : 'disconnected'}`}
            style={{
                transform: visible ? 'translateY(0)' : 'translateY(-100%)',
                opacity: visible ? '1' : '0',
                pointerEvents: visible ? 'auto' : 'none'
            }}
        >
            <span style={{ marginRight: '8px', fontSize: '18px' }}>⚠</span>
            <span style={{ flex: 1 }}>
                {`Соединение с базой данных потеряно${status.error ? `: ${status.error}` : ''}`}
            </span>
            <button 
                onClick={handleRetry}
                style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    marginLeft: '8px',
                    cursor: 'pointer',
                    fontSize: '12px'
                }}
            >
                Повторить
            </button>
        </div>
    );
};

export default ConnectionStatus;
