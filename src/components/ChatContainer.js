import React, { useEffect } from 'react';
import styled from 'styled-components';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 768px;
  margin: 0 auto;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--tg-theme-bg-color, #ffffff);
  overflow: hidden;
  width: 100%;

  @media (min-width: 769px) {
    position: relative;
    width: 100%;
    max-width: 768px;
  }
  
  @media (max-width: 768px) {
    width: 100%;
    max-width: 100%;
    position: fixed;
  }
`;

const Header = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background-color: var(--tg-theme-bg-color, #ffffff);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 12px 16px;
  padding-top: calc(12px + env(safe-area-inset-top, 0px));
  display: flex;
  align-items: center;
  justify-content: space-between;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  flex-shrink: 0;
  width: 100%;
  max-width: 768px;
  margin: 0 auto;
  height: 54px;

  @media (max-width: 768px) {
    padding: 8px 12px;
    padding-top: calc(8px + env(safe-area-inset-top, 0px));
    width: 100%;
    max-width: 100%;
    height: 54px;
    display: flex !important;
    opacity: 1 !important;
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
  padding-top: calc(16px + var(--header-height, 60px));
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  position: relative;
  height: 100%;
  margin-top: 0;
  width: 100%;
  max-width: 768px;
  margin: 0 auto;

  &.keyboard-visible {
    padding-bottom: calc(80px + var(--keyboard-height, 0px));
    transition: padding-bottom 0.3s ease;
  }

  @media (max-width: 768px) {
    padding: 12px;
    padding-top: calc(12px + var(--header-height, 60px));
    padding-bottom: calc(70px + env(safe-area-inset-bottom, 0px));
    margin-top: 0;
    width: 100%;
    max-width: 100%;
    position: fixed;
    top: 0;
    bottom: 70px;
    left: 0;
    right: 0;

    &.keyboard-visible {
      padding-bottom: calc(70px + var(--keyboard-height, 0px));
      bottom: var(--keyboard-height, 0px);
    }
  }
`;

const BackButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  margin: -8px;
  cursor: pointer;
  color: var(--tg-theme-button-color, #2481cc);
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 24px;
    height: 24px;
  }

  &:hover {
    opacity: 0.8;
  }

  &:active {
    opacity: 0.6;
  }
`;

const Title = styled.h1`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--tg-theme-text-color, #000000);
  flex: 1;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 16px;

  @media (max-width: 768px) {
    font-size: 16px;
    padding: 0 12px;
  }
`;

const ChatContainer = ({ children, title, onBack, isSupportChat, onEndChat }) => {
  useEffect(() => {
    // Set header height
    const updateHeaderHeight = () => {
      const header = document.querySelector('header');
      if (header) {
        const headerHeight = header.offsetHeight;
        document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
      }
    };

    // Initial update
    updateHeaderHeight();

    // Update on resize
    window.addEventListener('resize', updateHeaderHeight);
    
    // Handle keyboard events
    const handleKeyboardVisibilityChange = () => {
      updateHeaderHeight();
      
      // Ensure the header is visible when the keyboard is hidden
      if (!document.body.classList.contains('keyboard-visible')) {
        const header = document.querySelector('header');
        if (header) {
          header.style.display = 'flex';
          header.style.opacity = '1';
        }
      }
    };
    
    window.addEventListener('resize', handleKeyboardVisibilityChange);
    document.addEventListener('visibilitychange', handleKeyboardVisibilityChange);

    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      window.removeEventListener('resize', handleKeyboardVisibilityChange);
      document.removeEventListener('visibilitychange', handleKeyboardVisibilityChange);
    };
  }, []);

  const EndChatButton = styled.button`
    background: none;
    border: none;
    padding: 8px 12px;
    color: var(--tg-theme-destructive-text-color, #ff3b30);
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    white-space: nowrap;

    &:hover {
      opacity: 0.8;
    }

    &:active {
      opacity: 0.6;
    }
  `;

  return (
    <Container>
      <Header>
        {onBack && (
          <BackButton onClick={onBack}>
            <ArrowLeftIcon />
          </BackButton>
        )}
        <Title>{title}</Title>
        {!isSupportChat && onEndChat && (
          <EndChatButton onClick={onEndChat}>
            Завершить чат
          </EndChatButton>
        )}
      </Header>
      <MessagesContainer className={document.body.classList.contains('keyboard-visible') ? 'keyboard-visible' : ''}>
        {children}
      </MessagesContainer>
    </Container>
  );
};

ChatContainer.defaultProps = {
  isSupportChat: false,
};

export default ChatContainer; 