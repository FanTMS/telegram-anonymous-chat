import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface InterestsSelectorProps {
  selectedInterests: string[];
  onChange: (interests: string[]) => void;
  maxSelections?: number;
  disabled?: boolean;
}

// Список популярных интересов
const ALL_INTERESTS = [
  'Музыка', 'Кино', 'Спорт', 'Путешествия', 'Книги',
  'Искусство', 'Фотография', 'Программирование', 'Игры', 'Кулинария',
  'Наука', 'Технологии', 'Мода', 'Здоровье', 'Животные',
  'Природа', 'История', 'Психология', 'Финансы', 'Бизнес'
];

export const InterestsSelector: React.FC<InterestsSelectorProps> = ({
  selectedInterests,
  onChange,
  maxSelections = 5,
  disabled = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredInterests, setFilteredInterests] = useState(ALL_INTERESTS);

  // Фильтрация интересов при вводе поискового запроса
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredInterests(ALL_INTERESTS);
    } else {
      const lowercaseSearchTerm = searchTerm.toLowerCase();
      const filtered = ALL_INTERESTS.filter(interest =>
        interest.toLowerCase().includes(lowercaseSearchTerm)
      );
      setFilteredInterests(filtered);
    }
  }, [searchTerm]);

  // Обработчик выбора интереса
  const handleInterestToggle = (interest: string) => {
    if (disabled) return;

    if (selectedInterests.includes(interest)) {
      onChange(selectedInterests.filter(i => i !== interest));
    } else {
      // Проверяем, не превышен ли лимит выбранных интересов
      if (selectedInterests.length < maxSelections) {
        onChange([...selectedInterests, interest]);
      }
    }
  };

  // Обработчик добавления нового интереса
  const handleAddCustomInterest = () => {
    if (disabled || !searchTerm.trim() || searchTerm.length > 20) return;

    // Проверяем, не выбран ли уже этот интерес
    if (!selectedInterests.includes(searchTerm) && selectedInterests.length < maxSelections) {
      onChange([...selectedInterests, searchTerm]);
      setSearchTerm('');
    }
  };

  return (
    <div className="interests-selector">
      {/* Поисковая строка */}
      <div className="mb-3 flex">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Поиск интересов..."
          className="w-full px-3 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          disabled={disabled || selectedInterests.length >= maxSelections}
        />
        <button
          onClick={handleAddCustomInterest}
          className={`px-3 py-2 rounded-r-lg ${disabled || !searchTerm.trim() || selectedInterests.length >= maxSelections
              ? 'bg-gray-300 text-gray-600 dark:bg-gray-600 dark:text-gray-400'
              : 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
            }`}
          disabled={disabled || !searchTerm.trim() || selectedInterests.length >= maxSelections}
        >
          Добавить
        </button>
      </div>

      {/* Выбранные интересы */}
      <div className="mb-3">
        <div className="text-sm mb-1 text-gray-600 dark:text-gray-300">
          Выбрано: {selectedInterests.length}/{maxSelections}
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedInterests.length > 0 ? (
            selectedInterests.map((interest) => (
              <motion.div
                key={interest}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded-full text-sm flex items-center"
              >
                {interest}
                <button
                  onClick={() => handleInterestToggle(interest)}
                  className="ml-2 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                  disabled={disabled}
                >
                  ✕
                </button>
              </motion.div>
            ))
          ) : (
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              Выберите интересы из списка ниже
            </span>
          )}
        </div>
      </div>

      {/* Список популярных интересов */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {filteredInterests.map((interest) => (
          <motion.button
            key={interest}
            onClick={() => handleInterestToggle(interest)}
            className={`px-3 py-2 rounded-lg text-sm text-left ${selectedInterests.includes(interest)
                ? 'bg-blue-500 text-white dark:bg-blue-600'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              } ${disabled || (selectedInterests.length >= maxSelections && !selectedInterests.includes(interest))
                ? 'opacity-50 cursor-not-allowed'
                : 'cursor-pointer'
              }`}
            disabled={disabled || (selectedInterests.length >= maxSelections && !selectedInterests.includes(interest))}
            whileHover={
              !disabled && (selectedInterests.length < maxSelections || selectedInterests.includes(interest))
                ? { scale: 1.02 }
                : {}
            }
            whileTap={
              !disabled && (selectedInterests.length < maxSelections || selectedInterests.includes(interest))
                ? { scale: 0.98 }
                : {}
            }
          >
            {interest}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default InterestsSelector;
