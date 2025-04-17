import React, { useState, useRef, useEffect, forwardRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import connectionService from '../utils/firebaseConnectionService';
import { isCompactMode } from '../utils/telegramUtils';
import InputContainer from './InputContainer';
import SendButton from './SendButton';

const _slideUp = keyframes`
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
  
  ${props => props.$compact && css`
    font-size: 14px;
    padding: 8px 12px;
    min-height: 36px;
    border-radius: 18px;
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
  
  ${props => props.$compact && css`
    width: 36px;
    height: 36px;
    margin-right: 6px;
    
    svg {
      width: 20px;
      height: 20px;
    }
  `}
`;

const _MessageComposingIndicator = styled.div`
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

const MessageInput = forwardRef(({ onSendMessage, onSend, disabled = false, placeholder = "Введите сообщение...", onTyping, value, onChange, onKeyDown }, ref) => {
  const [message, setMessage] = useState(value || '');
  const [isOffline, setIsOffline] = useState(false);
  const [hasUserTyped, setHasUserTyped] = useState(false);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isCompact = isCompactMode();
  const containerRef = useRef(null);

  // Connect the forwarded ref to our textarea
  useEffect(() => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(textareaRef.current);
      } else {
        ref.current = textareaRef.current;
      }
    }
  }, [ref]);

  // If value is controlled externally
  useEffect(() => {
    if (value !== undefined) {
      setMessage(value);
    }
  }, [value]);

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
      // Add class to document body to allow components to adjust
      document.body.classList.add('keyboard-visible');
      
      // On iOS and some Android devices we can detect keyboard height
      if (window.visualViewport) {
        const viewportHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const keyboardHeight = windowHeight - viewportHeight;
        
        if (keyboardHeight > 0) {
          document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
          
          // Ensure the input field is visible and not hidden by keyboard
          if (textareaRef.current) {
            setTimeout(() => {
              textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }, 100);
          }
        }
      }
      
      // Add class to the input container
      if (containerRef.current) {
        containerRef.current.classList.add('keyboard-visible');
        containerRef.current.style.position = 'fixed';
        containerRef.current.style.bottom = '0';
        containerRef.current.style.left = '0';
        containerRef.current.style.right = '0';
        containerRef.current.style.zIndex = '1000';
        containerRef.current.style.backgroundColor = 'var(--tg-theme-bg-color, #ffffff)';
      }
      
      // Add class to parent messages container if it exists
      const messagesContainer = document.querySelector('.chat-messages, [class*="MessagesContainer"]');
      if (messagesContainer) {
        messagesContainer.classList.add('keyboard-visible');
        // Adjust padding to prevent content from being hidden behind the keyboard
        messagesContainer.style.paddingBottom = `calc(70px + ${keyboardHeight || 0}px)`;
      }
    };

    const handleKeyboardHide = () => {
      // Remove class from document body
      document.body.classList.remove('keyboard-visible');
      
      // Reset the keyboard height
      document.documentElement.style.setProperty('--keyboard-height', '0px');
      
      // Remove class from the input container
      if (containerRef.current) {
        containerRef.current.classList.remove('keyboard-visible');
        containerRef.current.style.position = '';
        containerRef.current.style.bottom = '';
        containerRef.current.style.left = '';
        containerRef.current.style.right = '';
        containerRef.current.style.zIndex = '';
        containerRef.current.style.backgroundColor = '';
      }
      
      // Remove class from parent messages container if it exists
      const messagesContainer = document.querySelector('.chat-messages, [class*="MessagesContainer"]');
      if (messagesContainer) {
        messagesContainer.classList.remove('keyboard-visible');
        messagesContainer.style.paddingBottom = `calc(70px + env(safe-area-inset-bottom, 0px))`;
      }
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
    const newValue = e.target.value;
    setMessage(newValue);
    
    // If value is controlled externally, call the onChange function
    if (onChange) {
      onChange(e);
    } else {
      // If value is not controlled externally, handle it internally
      setMessage(newValue);
    }

    // Notify about typing
    if (newValue && !hasUserTyped) {
      setHasUserTyped(true);
    }

    // Trigger onTyping callback if provided
    if (onTyping) {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Call onTyping immediately
      onTyping(true);

      // Set timeout to stop typing indication
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
      }, 3000);
    }

    // Adjust textarea height
    _adjustTextareaHeight();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Prevent sending if message is empty, offline or disabled
    if (!message.trim() || isOffline || disabled) {
      return;
    }

    // Use the provided message handler or the internal one
    if (onSendMessage) {
      onSendMessage(message);
    } else if (onSend) {
      onSend(message);
    }

    // Reset internal state only if not controlled externally
    if (value === undefined) {
      setMessage('');
    }
    
    // Reset the textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = '';
    }
    
    // Reset typing status
    setHasUserTyped(false);
  };

  const handleKeyDown = (e) => {
    // Forward the keydown event if handler provided
    if (onKeyDown) {
      onKeyDown(e);
    }
    
    // Default enter without shift for sending
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const _adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  return (
    <InputContainer 
      onSubmit={handleSubmit} 
      className={document.body.classList.contains('keyboard-visible') ? 'keyboard-visible' : ''}
      ref={containerRef}
    >
      <OfflineIndicator $visible={isOffline}>
        Нет соединения с сервером
      </OfflineIndicator>

      <AttachmentButton type="button" $compact={isCompact}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
        </svg>
      </AttachmentButton>

      <MessageTextarea
        ref={textareaRef}
        value={message}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={disabled ? "Чат завершен" : placeholder}
        disabled={disabled}
        $compact={isCompact}
        rows={1}
      />

      <SendButton 
        onClick={handleSubmit}
        disabled={!message.trim() || disabled || isOffline}
      />
    </InputContainer>
  );
});

export default MessageInput;
