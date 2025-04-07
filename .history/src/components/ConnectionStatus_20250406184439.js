import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import connectionService from '../utils/firebaseConnectionService';

const StatusBar = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 8px 16px;
  background-color: ${props => props.$connected ? 'rgba(76, 175, 80, 0.9)' : 'rgba(244, 67, 54, 0.9)'};
  color: white;
  font-size: 14px;
  text-align: center;
  z-index: 9999;
  transition: transform 0.3s ease, opacity 0.3s ease;
  transform: translateY(${props => (props.$visible ? '0' : '-100%')});
  opacity: ${props => (props.$visible ? '1' : '0')};
  pointer-events: ${props => (props.$visible ? 'auto' : 'none')};
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StatusIcon = styled.span`
  margin-right: 8px;
  font-size: 18px;
`;

const StatusMessage = styled.span`
  flex: 1;
`;

const RetryButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  margin-left: 8px;
  cursor: pointer;
  font-size: 12px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const ConnectionStatus = () => {
    const [status, setStatus] = useState({ connected: true, error: null });
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleConnectionChange = (newStatus) => {
            setStatus(newStatus);

            if (!newStatus.connected) {
                // Если соединение потеряно, показываем уведомление
                setVisible(true);
            } else {
                // Если соединение восстановлено, показываем на короткое время и скрываем
                setVisible(true);
                setTimeout(() => setVisible(false), 3000);
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

    return (
        <StatusBar $connected={status.connected} $visible={visible}>
            <StatusIcon>{status.connected ? '✓' : '⚠'}</StatusIcon>
            <StatusMessage>
                {status.connected
                    ? 'Соединение с базой данных восстановлено'
                    : `Соединение с базой данных потеряно${status.error ? `: ${status.error}` : ''}`}
            </StatusMessage>
            {!status.connected && (
                <RetryButton onClick={handleRetry}>
                    Повторить
                </RetryButton>
            )}
        </StatusBar>
    );
};

export default ConnectionStatus;
