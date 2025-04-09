import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import connectionService from '../utils/firebaseConnectionService';
import { isCompactMode } from '../utils/telegramUtils';

const slideUp = keyframes`
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(var(--tg-theme-button-color-rgb, 51, 144, 236), 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(var(--tg-theme-button-color-rgb, 51, 144, 236), 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(var(--tg-theme-button-color-rgb, 51, 144, 236), 0);
  }
`;

const InputContainer = styled.form`
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background-color: var(--tg-theme-bg-color, #ffffff);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  width: 100%;
  max-width: 768px;
  margin: 0 auto;
  transform: translateY(0);
  transition: transform 0.3s ease, bottom 0.3s ease;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));

  &.keyboard-visible {
    bottom: var(--keyboard-height, 0px);
  }

  @media (max-width: 768px) {
    padding: 8px 12px;
    padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
    width: 100%;
    max-width: 768px;
  }
  
  @media (min-width: 769px) {
    width: 100%;
    max-width: 768px;
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
  transition: all 0.2s ease;
  
  &:focus {
    border-color: var(--tg-theme-button-color, #3390ec);
    background-color: var(--tg-theme-bg-color, #ffffff);
    box-shadow: 0 0 0 2px rgba(var(--tg-theme-button-color-rgb, 51, 144, 236), 0.2);
  }
  
  &::placeholder {
    color: var(--tg-theme-hint-color, #999999);
  }
  
  ${props => props.compact && `
    font-size: 14px;
    padding: 8px 12px;
    min-height: 36px;
    border-radius: 18px;
  `}
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
  position: relative;
  overflow: hidden;
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%);
    transform: scale(0);
    transition: transform 0.5s ease-out;
    border-radius: 50%;
  }
  
  &:active:before {
    transform: scale(2);
  }
  
  &:disabled {
    background-color: var(--tg-theme-secondary-bg-color, #cccccc);
    cursor: not-allowed;
  }
  
  &:active:not(:disabled) {
    transform: scale(0.92);
  }
  
  ${props => props.ready && !props.disabled && `
    animation: ${pulse} 1.5s infinite;
  `}
  
  svg {
    width: 20px;
    height: 20px;
    fill: currentColor;
    position: relative;
    transition: transform 0.2s ease;
  }
  
  ${props => props.compact && `
    width: 36px;
    height: 36px;
    
    svg {
      width: 18px;
      height: 18px;
    }
  `}
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
  transition: opacity 0.3s ease, transform 0.3s ease;
  transform: translateY(${props => props.$visible ? '0' : '100%'});
  z-index: 1001;
  box-shadow: 0 -1px 5px rgba(0, 0, 0, 0.1);
  
  @media (min-width: 481px) {
    max-width: 480px;
    left: 50%;
    transform: translateX(-50%) translateY(${props => props.$visible ? '0' : '100%'});
    border-radius: 8px 8px 0 0;
  }
`;

const AttachmentButton = styled.button`
  background: none;
  border: none;
  color: var(--tg-theme-hint-color, #999999);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: color 0.2s ease, transform 0.2s ease;
  margin-right: 8px;
  
  &:hover {
    color: var(--tg-theme-link-color, #3390ec);
  }
  
  &:active {
    transform: scale(0.92);
  }
  
  svg {
    width: 22px;
    height: 22px;
    fill: currentColor;
  }
  
  ${props => props.compact && `
    width: 36px;
    height: 36px;
    margin-right: 6px;
    
    svg {
      width: 20px;
      height: 20px;
    }
  `}
`;

const MessageComposingIndicator = styled.div`
  position: absolute;
  top: -28px;
  left: 16px;
  font-size: 12px;
  color: var(--tg-theme-hint-color, #999999);
  opacity: ${props => props.$visible ? '1' : '0'};
  transition: opacity 0.3s ease;
  background-color: var(--tg-theme-bg-color, #ffffff);
  padding: 4px 8px;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const MessageInput = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const [isOffline, setIsOffline] = useState(false);
  const [hasUserTyped, setHasUserTyped] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isCompact = isCompactMode();

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

  useEffect(() => {
    const handleKeyboardShow = () => {
      setIsKeyboardVisible(true);
      document.body.classList.add('keyboard-visible');
      
      // Set keyboard height with a slight delay to ensure accurate height
      setTimeout(() => {
        if (window.visualViewport) {
          const keyboardHeight = window.innerHeight - window.visualViewport.height;
          document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
        }
      }, 100);
    };

    const handleKeyboardHide = () => {
      setIsKeyboardVisible(false);
      document.body.classList.remove('keyboard-visible');
      document.documentElement.style.setProperty('--keyboard-height', '0px');
    };

    // For iOS
    window.addEventListener('focusin', (e) => {
      if (e.target === textareaRef.current) {
        handleKeyboardShow();
      }
    });
    window.addEventListener('focusout', (e) => {
      if (e.target === textareaRef.current) {
        handleKeyboardHide();
      }
    });

    // For Android
    if (window.visualViewport) {
      let lastHeight = window.visualViewport.height;
      
      window.visualViewport.addEventListener('resize', () => {
        const newHeight = window.visualViewport.height;
        const heightDiff = lastHeight - newHeight;
        
        if (heightDiff > 150) { // Keyboard is shown
          handleKeyboardShow();
        } else if (heightDiff < -150) { // Keyboard is hidden
          handleKeyboardHide();
        }
        
        lastHeight = newHeight;
      });
    }

    return () => {
      window.removeEventListener('focusin', handleKeyboardShow);
      window.removeEventListener('focusout', handleKeyboardHide);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', () => {});
      }
    };
  }, []);

  // Автофокус на поле ввода при монтировании
  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
    
    // Очистка таймаута набора текста при размонтировании
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [disabled]);

  const handleChange = (e) => {
    const newMessage = e.target.value;
    setMessage(newMessage);
    
    // Если впервые что-то ввели, отмечаем, что пользователь начал печатать
    if (!hasUserTyped && newMessage.trim().length > 0) {
      setHasUserTyped(true);
    }

    // Уведомляем о наборе текста
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        // Устанавливаем таймаут прекращения набора
        typingTimeoutRef.current = null;
      }, 2000);
    }

    // Автоматически меняем высоту textarea
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      // Проверяем подключение перед отправкой
      if (isOffline) {
        alert('Нет соединения с сервером. Ваше сообщение будет отправлено, когда соединение восстановится.');
        return;
      }

      // Передаем текст сообщения в callback
      onSendMessage(message.trim());

      // Очищаем поле ввода
      setMessage('');
      setHasUserTyped(false);
      
      // Auto-focus after sending on mobile
      if (window.innerWidth <= 768) {
        textareaRef.current?.focus();
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  return (
    <InputContainer 
      onSubmit={handleSubmit} 
      className={isKeyboardVisible ? 'keyboard-visible' : ''}
    >
      <OfflineIndicator $visible={isOffline}>
        Нет соединения с сервером
      </OfflineIndicator>

      <AttachmentButton type="button" compact={isCompact}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
        </svg>
      </AttachmentButton>

      <MessageTextarea
        ref={textareaRef}
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Введите сообщение..."
        disabled={disabled}
        compact={isCompact}
        rows={1}
      />

      <SendButton 
        type="submit" 
        disabled={!message.trim() || disabled}
        ready={message.trim().length > 0}
        compact={isCompact}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" />
        </svg>
      </SendButton>
    </InputContainer>
  );
};

export default MessageInput;
