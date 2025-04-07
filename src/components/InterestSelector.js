import React from 'react';
import '../styles/InterestSelector.css';

// Предопределенные интересы для выбора
const PREDEFINED_INTERESTS = [
    { id: 'music', name: 'Музыка', icon: '🎵' },
    { id: 'sports', name: 'Спорт', icon: '⚽' },
    { id: 'gaming', name: 'Игры', icon: '🎮' },
    { id: 'movies', name: 'Кино', icon: '🎬' },
    { id: 'books', name: 'Книги', icon: '📚' },
    { id: 'travel', name: 'Путешествия', icon: '✈️' },
    { id: 'cooking', name: 'Кулинария', icon: '🍳' },
    { id: 'tech', name: 'Технологии', icon: '💻' },
    { id: 'art', name: 'Искусство', icon: '🎨' },
    { id: 'nature', name: 'Природа', icon: '🌲' },
    { id: 'science', name: 'Наука', icon: '🔬' },
    { id: 'history', name: 'История', icon: '🏛️' }
];

const InterestSelector = ({ value = [], onChange }) => {
    // Ensure value is always an array
    const normalizedValue = Array.isArray(value) ? value : [];

    const handleToggleInterest = (interestId) => {
        const selectedInterests = [...normalizedValue];
        const index = selectedInterests.findIndex(interest => 
            typeof interest === 'string' ? interest === interestId : interest.id === interestId
        );
        
        if (index !== -1) {
            // Удалить интерес, если он уже выбран
            selectedInterests.splice(index, 1);
        } else {
            // Добавить интерес, если он еще не выбран и не превышен лимит
            if (selectedInterests.length < 5) {
                selectedInterests.push(interestId);
            }
        }
        
        onChange(selectedInterests);
    };

    const isSelected = (interestId) => {
        return normalizedValue.some(interest => 
            typeof interest === 'string' ? interest === interestId : interest.id === interestId
        );
    };

    return (
        <div className="interest-selector">
            <div className="interests-grid">
                {PREDEFINED_INTERESTS.map((interest) => (
                    <div
                        key={interest.id}
                        className={`interest-item ${isSelected(interest.id) ? 'selected' : ''}`}
                        onClick={() => handleToggleInterest(interest.id)}
                    >
                        <div className="interest-icon">{interest.icon}</div>
                        <div className="interest-name">{interest.name}</div>
                        {isSelected(interest.id) && (
                            <div className="interest-select-indicator">✓</div>
                        )}
                    </div>
                ))}
            </div>
            {normalizedValue.length === 5 && (
                <div className="interest-limit-message">Максимум 5 интересов</div>
            )}
        </div>
    );
};

export default InterestSelector;
