import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import connectionService from '../utils/firebaseConnectionService';

const InputContainer = styled.form`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background-color: #f5f5f5;
  border-top: 1px solid #e0e0e0;
  position: relative;
`;

const MessageTextarea = styled.textarea`
  flex: 1;
  border: 1px solid #ddd;
  border-radius: 18px;
  padding: 8px 12px;
  font-size: 15px;
  resize: none;
  max-height: 120px;
  min-height: 40px;
  line-height: 20px;
  outline: none;
  
  &:focus {
    border-color: #0088cc;
  }
`;

const SendButton = styled.button`
  background-color: #0088cc;
  color: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  margin-left: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const OfflineIndicator = styled.div`
  position: absolute;
  top: -24px;
  left: 0;
  right: 0;
  background-color: #ffcc00;
  color: #333;
  padding: 4px;
  text-align: center;
  font-size: 12px;
  opacity: ${props => props.$visible ? '1' : '0'};
  transition: opacity 0.3s ease;
`;

const MessageInput = ({ onSendMessage, disabled, placeholder = "Введите сообщение..." }) => {
    const [message, setMessage] = useState('');
    const [isOffline, setIsOffline] = useState(false);
    const textareaRef = useRef(null);

    // Отслеживаем состояние подключения
    useEffect(() => {
        const handleConnectionChange = (status) => {
            setIsOffline(!status.connected);
        };

        connectionService.addConnectionListener(handleConnectionChange);

        return () => {
            connectionService.removeConnectionListener(handleConnectionChange);
        };
    }, []);

    const handleChange = (e) => {
        setMessage(e.target.value);

        // Автоматически меняем высоту textarea
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!message.trim() || disabled) return;

        // Проверяем подключение перед отправкой
        if (isOffline) {
            alert('Нет соединения с сервером. Ваше сообщение будет отправлено, когда соединение восстановится.');
            return;
        }

        // Передаем текст сообщения в callback
        onSendMessage(message);

        // Очищаем поле ввода
        setMessage('');

        // Сбрасываем высоту textarea
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e) => {
        // Отправка по Enter (без Shift)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <InputContainer onSubmit={handleSubmit}>
            <OfflineIndicator $visible={isOffline}>
                Нет соединения с сервером
            </OfflineIndicator>

            <MessageTextarea
                ref={textareaRef}
                value={message}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                rows={1}
            />

            <SendButton type="submit" disabled={!message.trim() || disabled}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
            </SendButton>
        </InputContainer>
    );
};

export default MessageInput;
