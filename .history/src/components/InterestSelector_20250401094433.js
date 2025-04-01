import React, { useState, useEffect } from 'react';
import AnimatedTransition from './AnimatedTransition';

// Предопределенные интересы с названиями и иконками
const PREDEFINED_INTERESTS = [
    { id: 'music', name: 'Музыка', icon: '🎵' },
    { id: 'sports', name: 'Спорт', icon: '⚽' },
    { id: 'gaming', name: 'Игры', icon: '🎮' },
    { id: 'movies', name: 'Кино', icon: '🎬' },
    { id: 'books', name: 'Книги', icon: '📚' },
    { id: 'travel', name: 'Путешествия', icon: '✈️' },
    { id: 'cooking', name: 'Кулинария', icon: '🍳' },
    { id: 'art', name: 'Искусство', icon: '🎨' },
    { id: 'tech', name: 'Технологии', icon: '💻' },
    { id: 'science', name: 'Наука', icon: '🔬' },
    { id: 'nature', name: 'Природа', icon: '🌿' },
    { id: 'fitness', name: 'Фитнес', icon: '💪' },
    { id: 'fashion', name: 'Мода', icon: '👗' },
    { id: 'pets', name: 'Питомцы', icon: '🐾' },
    { id: 'photography', name: 'Фотография', icon: '📷' },
    { id: 'crypto', name: 'Криптовалюты', icon: '₿' },
    { id: 'dance', name: 'Танцы', icon: '💃' },
    { id: 'history', name: 'История', icon: '🏛️' },
    { id: 'psychology', name: 'Психология', icon: '🧠' },
    { id: 'languages', name: 'Языки', icon: '🗣️' }
];

/**
 * Компонент выбора интересов с иконками и анимациями
 */
const InterestSelector = ({
    value = [],
    onChange,
    maxSelections = 5,
    error,
    hint
}) => {
    const [selectedInterests, setSelectedInterests] = useState(value);
    const [isAnimating, setIsAnimating] = useState(false);

    // Синхронизация с родительским компонентом
    useEffect(() => {
        if (typeof onChange === 'function') {
            onChange(selectedInterests);
        }
    }, [selectedInterests, onChange]);

    // Обработка выбора интереса
    const handleInterestClick = (interest) => {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 300);

        if (selectedInterests.includes(interest.id)) {
            // Если интерес уже выбран, удаляем его
            setSelectedInterests(prev => prev.filter(id => id !== interest.id));
        } else if (selectedInterests.length < maxSelections) {
            // Иначе добавляем, если не превышен лимит
            setSelectedInterests(prev => [...prev, interest.id]);
        }
    };

    // Получение полных данных об интересах по ID
    const getSelectedInterestsData = () => {
        return PREDEFINED_INTERESTS.filter(interest =>
            selectedInterests.includes(interest.id)
        );
    };

    // Преобразование выбранных интересов в строку (для совместимости с существующим кодом)
    const getInterestsString = () => {
        return getSelectedInterestsData()
            .map(interest => interest.name)
            .join(', ');
    };

    return (
        <div className="interest-selector-container">
            <div className="interest-selector-grid">
                {PREDEFINED_INTERESTS.map((interest) => {
                    const isSelected = selectedInterests.includes(interest.id);
                    return (
                        <div
                            key={interest.id}
                            className={`interest-item ${isSelected ? 'selected' : ''} ${isAnimating ? 'animating' : ''}`}
                            onClick={() => handleInterestClick(interest)}
                        >
                            <div className="interest-icon">{interest.icon}</div>
                            <div className="interest-name">{interest.name}</div>
                            {isSelected && <div className="interest-selected-mark">✓</div>}
                        </div>
                    );
                })}
            </div>

            {selectedInterests.length > 0 && (
                <div className="selected-interests-summary">
                    <p className="selected-interests-label">
                        Выбрано ({selectedInterests.length}/{maxSelections}):
                    </p>
                    <div className="selected-interests-tags">
                        {getSelectedInterestsData().map(interest => (
                            <div key={interest.id} className="selected-interest-tag">
                                <span className="interest-tag-icon">{interest.icon}</span>
                                <span className="interest-tag-name">{interest.name}</span>
                                <button
                                    type="button"
                                    className="interest-tag-remove"
                                    onClick={() => handleInterestClick(interest)}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                    <input
                        type="hidden"
                        name="interests"
                        value={getInterestsString()}
                    />
                </div>
            )}

            {selectedInterests.length === 0 && (
                <p className="no-interests-selected">
                    Выберите минимум один интерес из списка выше
                </p>
            )}

            {error && (
                <AnimatedTransition animation="fadeIn" duration={300}>
                    <div className="interest-selector-error">{error}</div>
                </AnimatedTransition>
            )}

            {hint && !error && (
                <div className="interest-selector-hint">{hint}</div>
            )}
        </div>
    );
};

export default InterestSelector;
