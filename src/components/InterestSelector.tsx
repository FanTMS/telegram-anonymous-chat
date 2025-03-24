import React from 'react'
import { motion } from 'framer-motion'
import WebApp from '@twa-dev/sdk'

interface InterestSelectorProps {
    selectedInterests: string[]
    onSelectInterest: (interests: string[]) => void
}

export const InterestSelector: React.FC<InterestSelectorProps> = ({
    selectedInterests,
    onSelectInterest
}) => {
    // Все доступные интересы
    const allInterests = [
        { id: 'music', name: 'Музыка', icon: '🎵' },
        { id: 'movies', name: 'Кино', icon: '🎬' },
        { id: 'books', name: 'Книги', icon: '📚' },
        { id: 'sports', name: 'Спорт', icon: '⚽' },
        { id: 'travel', name: 'Путешествия', icon: '✈️' },
        { id: 'food', name: 'Кулинария', icon: '🍕' },
        { id: 'pets', name: 'Животные', icon: '🐶' },
        { id: 'gaming', name: 'Игры', icon: '🎮' },
        { id: 'tech', name: 'Технологии', icon: '💻' },
        { id: 'art', name: 'Искусство', icon: '🎨' },
        { id: 'science', name: 'Наука', icon: '🔬' },
        { id: 'nature', name: 'Природа', icon: '🌿' },
        { id: 'fashion', name: 'Мода', icon: '👗' },
        { id: 'fitness', name: 'Фитнес', icon: '💪' },
        { id: 'photography', name: 'Фотография', icon: '📷' }
    ]

    // Функция обработки выбора интереса
    const handleInterestClick = (interestName: string) => {
        // Вибрация для тактильной обратной связи
        if (WebApp.isExpanded) {
            WebApp.HapticFeedback.impactOccurred('light')
        }

        if (selectedInterests.includes(interestName)) {
            onSelectInterest(selectedInterests.filter(i => i !== interestName))
        } else {
            onSelectInterest([...selectedInterests, interestName])
        }
    }

    return (
        <div className="grid grid-cols-3 gap-2">
            {allInterests.map((interest) => (
                <motion.div
                    key={interest.id}
                    className={`p-2 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${selectedInterests.includes(interest.name)
                            ? 'bg-tg-theme-button-color text-tg-theme-button-text-color'
                            : 'bg-tg-theme-bg-color text-tg-theme-text-color'
                        }`}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleInterestClick(interest.name)}
                >
                    <span className="text-xl mb-1">{interest.icon}</span>
                    <span className="text-xs text-center">{interest.name}</span>

                    {selectedInterests.includes(interest.name) && (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-4 h-4 bg-white rounded-full flex items-center justify-center absolute top-1 right-1"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-tg-theme-button-color" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        </motion.div>
                    )}
                </motion.div>
            ))}
        </div>
    )
}
