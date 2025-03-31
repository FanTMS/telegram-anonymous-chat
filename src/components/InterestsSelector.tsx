import { InterestSelector } from './InterestSelector';
import React from 'react';

interface InterestsSelectorProps {
  selectedInterests: string[];
  onChange?: (interests: string[]) => void;
  onSelectInterest?: (interests: string[]) => void;
  maxSelections?: number;
}

// Создаем компонент-обертку для полной совместимости
export const InterestsSelector: React.FC<InterestsSelectorProps> = (props) => {
  return <InterestSelector {...props} />;
};

export default InterestsSelector;
