import React from 'react';
import styled from 'styled-components';

const StyledInputContainer = styled.form`
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
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);

  &.keyboard-visible {
    bottom: var(--keyboard-height, 0px);
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    padding: 8px 12px;
    padding-bottom: calc(8px + env(safe-area-inset-bottom, 0px));
    width: 100%;
    max-width: 100%;
    box-shadow: 0 -1px 5px rgba(0, 0, 0, 0.05);
  }
  
  @media (min-width: 769px) {
    width: 100%;
    max-width: 768px;
  }
`;

const InputContainer = ({ children, className, onSubmit, ...props }) => {
  return (
    <StyledInputContainer 
      className={className}
      onSubmit={onSubmit}
      {...props}
    >
      {children}
    </StyledInputContainer>
  );
};

export default InputContainer; 