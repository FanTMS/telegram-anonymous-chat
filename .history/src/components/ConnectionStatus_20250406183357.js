import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import connectionService from '../utils/firebaseConnectionService';

const StatusContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 8px 16px;
  background-color: ${props => props.$connected ? 'rgba(52, 199, 89, 0.9)' : 'rgba(255, 59, 48, 0.9)'};
  color: white;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  z-index: 9999;
  transition: transform 0.3s ease, opacity 0.3s ease;
  transform: translateY(${props => props.$visible ? '0' : '-100%'});
  opacity: ${props => props.$visible ? '1' : '0'};
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
`;

const Icon = styled.span`
  margin-right: 8px;
  display: inline-block;
`;

const Message = styled.span`
  flex: 1;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
  padding: 0 4px;
`;

const ConnectionStatus = () => {
  const [status, setStatus] = useState({
    connected: true,
    error: null,
    lastConnected: null
  });
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    // Добавляем слушатель статуса соединения
    connectionService.addConnectionListener(newStatus => {
      setStatus(newStatus);
      
      if (!newStatus.connected) {
        setVisible(true);
      } else {
        // Если соединение восстановлено, показываем на 3 секунды и скрываем
        setVisible(true);
        setTimeout(() => setVisible(false), 3000);
      }
    });
    
    // Проверяем соединение сразу при монтировании
    connectionService.checkConnection();
    
    // Очистка при размонтировании
    return () => {
      connectionService.removeConnectionListener(setStatus);
    };
  }, []);
  
  // Если соединение есть и нет ошибок, нечего показывать
  if (status.connected && !visible) {
    return null;
  }
  
  return (
    <StatusContainer $connected={status.connected} $visible={visible}>
      <Icon>
        {status.connected ? '✅' : '⚠️'}
      </Icon>
      <Message>
        {status.connected
          ? 'Соединение с базой данных восстановлено'
          : `Соединение с базой данных потеряно${status.error ? `: ${status.error}` : ''}`
        }
      </Message>
      <CloseButton onClick={() => setVisible(false)}>✕</CloseButton>
    </StatusContainer>
  );
};

export default ConnectionStatus;
