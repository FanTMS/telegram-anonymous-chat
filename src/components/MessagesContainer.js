import React, { useEffect } from 'react';
import styled from 'styled-components';
import '../styles/MessagesContainer.css';

const StyledMessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
  padding-top: calc(16px + var(--header-height, 60px));
  padding-bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  position: relative;
  height: 100vh;
  margin-top: 0;
  width: 100%;
  max-width: 768px;
  margin: 0 auto;
  background-color: #f5f7fb;
  
  &::-webkit-scrollbar {
    width: 5px;
  }
  
  &::-webkit-scrollbar-track {
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: var(--tg-theme-button-color, rgba(0, 0, 0, 0.2));
    border-radius: 3px;
  }

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

    &.keyboard-visible {
      padding-bottom: calc(70px + var(--keyboard-height, 0px));
    }
  }
`;

const MessagesContainer = ({ children, className, onScroll, ...props }) => {
  // Update header height variable when the component mounts
  useEffect(() => {
    const updateHeaderHeight = () => {
      const header = document.querySelector('header');
      if (header) {
        const headerHeight = header.offsetHeight;
        document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
      }
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);

    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
    };
  }, []);

  return (
    <StyledMessagesContainer 
      className={className}
      onScroll={onScroll}
      {...props}
    >
      {children}
    </StyledMessagesContainer>
  );
};

export default MessagesContainer; 