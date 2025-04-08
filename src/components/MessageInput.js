import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import connectionService from '../utils/firebaseConnectionService';

const InputContainer = styled.form`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--tg-theme-bg-color, #ffffff);
  border-top: 1px solid var(--tg-theme-secondary-bg-color, rgba(0, 0, 0, 0.1));
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding-bottom: calc(12px + var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)));
  width: 100%;
  margin: 0;
  
  @media (min-width: 481px) {
    position: absolute;
    width: 100%;
    max-width: 480px;
    left: 50%;
    transform: translateX(-50%);
  }
`;

const MessageTextarea = styled.textarea`
  flex: 1;
  border: 1px solid var(--tg-theme-secondary-bg-color, rgba(0, 0, 0, 0.1));
  border-radius: 20px;
  padding: 10px 16px;
  font-size: 15px;
  resize: none;
  max-height: 120px;
  min-height: 40px;
  line-height: 20px;
  outline: none;
  background-color: var(--tg-theme-secondary-bg-color, #f5f5f5);
  color: var(--tg-theme-text-color, #000000);
  
  &:focus {
    border-color: var(--tg-theme-button-color, #3390ec);
    background-color: var(--tg-theme-bg-color, #ffffff);
  }
  
  &::placeholder {
    color: var(--tg-theme-hint-color, #999999);
  }
`;

const SendButton = styled.button`
  background-color: var(--tg-theme-button-color, #3390ec);
  color: var(--tg-theme-button-text-color, #ffffff);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  margin-left: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.2s ease;
  
  &:disabled {
    background-color: var(--tg-theme-secondary-bg-color, #cccccc);
    cursor: not-allowed;
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  svg {
    width: 20px;
    height: 20px;
    fill: currentColor;
  }
`;

const OfflineIndicator = styled.div`
  position: absolute;
  top: -32px;
  left: 0;
  right: 0;
  background-color: #ffcc00;
  color: #333333;
  padding: 6px;
  text-align: center;
  font-size: 13px;
  opacity: ${props => props.$visible ? '1' : '0'};
  transition: opacity 0.3s ease;
  transform: translateY(${props => props.$visible ? '0' : '100%'});
  
  @media (min-width: 481px) {
    max-width: 480px;
    left: 50%;
    transform: translateX(-50%) translateY(${props => props.$visible ? '0' : '100%'});
    border-radius: 8px 8px 0 0;
  }
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
