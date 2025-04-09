import React, { useEffect } from 'react';
import styled from 'styled-components';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 768px;
  margin: 0 auto;
  position: relative;
  background: var(--tg-theme-bg-color, #ffffff);
  overflow: hidden;
`;

const Header = styled.header`
  position: sticky;
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
  max-width: 768px;
  margin: 0 auto;
  flex-shrink: 0;

  @media (max-width: 768px) {
    padding: 8px 12px;
    padding-top: calc(8px + env(safe-area-inset-top, 0px));
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  height: calc(100vh - var(--header-height) - var(--keyboard-height, 0px));

  &.keyboard-visible {
    height: calc(100vh - var(--header-height) - var(--keyboard-height, 0px));
    padding-bottom: calc(80px + var(--keyboard-height, 0px));
  }

  @media (max-width: 768px) {
    padding: 12px;
    padding-bottom: calc(70px + env(safe-area-inset-bottom, 0px));

    &.keyboard-visible {
      padding-bottom: calc(70px + var(--keyboard-height, 0px));
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

const ChatContainer = ({ children, title, onBack }) => {
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

    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

  return (
    <Container>
      <Header>
        {onBack && (
          <BackButton onClick={onBack}>
            <ArrowLeftIcon />
          </BackButton>
        )}
        <Title>{title}</Title>
      </Header>
      <MessagesContainer className={document.body.classList.contains('keyboard-visible') ? 'keyboard-visible' : ''}>
        {children}
      </MessagesContainer>
    </Container>
  );
};

export default ChatContainer; 