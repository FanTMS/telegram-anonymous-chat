import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';

const InterestContainer = styled.div`
  margin-bottom: 16px;
`;

const InterestGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
  margin-top: 8px;
`;

const InterestOption = styled.div`
  padding: 8px 12px;
  background-color: ${props => props.$selected ? '#0088cc' : '#f1f1f1'};
  color: ${props => props.$selected ? 'white' : '#333'};
  border-radius: 16px;
  font-size: 14px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.$selected ? '#006699' : '#e0e0e0'};
  }
`;

// Список предопределенных интересов
const INTEREST_OPTIONS = [
  'Музыка', 'Кино', 'Книги', 'Спорт', 'Путешествия', 
  'Фотография', 'Искусство', 'Технологии', 'Игры',
  'Кулинария', 'Мода', 'Природа', 'Наука', 'История',
  'Животные', 'Танцы', 'Программирование', 'Психология'
];

const InterestSelector = ({ value = [], onChange }) => {
  // Убедимся, что value всегда массив
  const safeValue = Array.isArray(value) ? value : [];
  
  // Используем useCallback для стабильности функции toggleInterest
  const toggleInterest = useCallback((interest) => {
    const newInterests = safeValue.includes(interest)
      ? safeValue.filter(item => item !== interest)
      : [...safeValue, interest];
    
    onChange(newInterests);
  }, [safeValue, onChange]);

  return (
    <InterestContainer>
      <InterestGrid>
        {INTEREST_OPTIONS.map(interest => (
          <InterestOption
            key={interest}
            $selected={safeValue.includes(interest)}
            onClick={() => toggleInterest(interest)}
          >
            {interest}
          </InterestOption>
        ))}
      </InterestGrid>
    </InterestContainer>
  );
};

export default InterestSelector;
