import React, { useState, useRef } from 'react';
import styled from 'styled-components';

const SearchContainer = styled.div`
  position: relative;
  width: 100%;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 38px;
  border-radius: 8px;
  border: none;
  background-color: var(--tg-theme-secondary-bg-color, rgba(0, 0, 0, 0.05));
  color: var(--tg-theme-text-color, #000);
  font-size: 14px;
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.05);
  }
  
  &::placeholder {
    color: var(--tg-theme-hint-color, #999);
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--tg-theme-hint-color, #999);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ClearButton = styled.button`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: var(--tg-theme-hint-color, #999);
  display: ${props => props.$show ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

const SearchInput = ({ placeholder = 'Поиск...', value = '', onChange, onClear }) => {
    const inputRef = useRef(null);

    const handleClear = () => {
        if (onClear) {
            onClear();
        } else if (onChange) {
            onChange({ target: { value: '' } });
        }

        // Фокус на поле ввода после очистки
        inputRef.current?.focus();
    };

    return (
        <SearchContainer>
            <SearchIcon>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                </svg>
            </SearchIcon>

            <Input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
            />

            <ClearButton
                $show={value && value.length > 0}
                onClick={handleClear}
                type="button"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
            </ClearButton>
        </SearchContainer>
    );
};

export default SearchInput;
