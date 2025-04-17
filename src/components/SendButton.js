import React from 'react';
import styled, { keyframes, css } from 'styled-components';

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

const StyledSendButton = styled.button`
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
  
  ${props => props.$ready && css`
    animation: ${pulse} 1.5s infinite;
  `}
  
  svg {
    width: 20px;
    height: 20px;
    fill: currentColor;
    position: relative;
    transition: transform 0.2s ease;
  }
  
  ${props => props.$compact && css`
    width: 36px;
    height: 36px;
    
    svg {
      width: 18px;
      height: 18px;
    }
  `}
`;

const SendButton = ({ disabled = false, ready = false, compact = false, onClick, ...props }) => {
  return (
    <StyledSendButton 
      type="button"
      disabled={disabled} 
      $ready={!disabled && ready !== false} 
      $compact={compact}
      onClick={onClick}
      {...props}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z" />
      </svg>
    </StyledSendButton>
  );
};

export default SendButton; 