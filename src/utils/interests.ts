// Тип для интересов
export interface Interest {
  id: string;
  name: string;
  icon: string;
  category: 'hobby' | 'entertainment' | 'lifestyle' | 'knowledge' | 'other';
}

// Доступные интересы
export const availableInterests: Interest[] = [
  { id: 'music', name: 'Музыка', icon: '🎵', category: 'hobby' },
  { id: 'movies', name: 'Фильмы', icon: '🎬', category: 'entertainment' },
  { id: 'sports', name: 'Спорт', icon: '⚽', category: 'hobby' },
  { id: 'gaming', name: 'Игры', icon: '🎮', category: 'entertainment' },
  { id: 'reading', name: 'Чтение', icon: '📚', category: 'hobby' },
  { id: 'travel', name: 'Путешествия', icon: '✈️', category: 'lifestyle' },
  { id: 'cooking', name: 'Кулинария', icon: '🍳', category: 'hobby' },
  { id: 'technology', name: 'Технологии', icon: '💻', category: 'knowledge' },
  { id: 'art', name: 'Искусство', icon: '🎨', category: 'hobby' },
  { id: 'photography', name: 'Фотография', icon: '📷', category: 'hobby' },
  { id: 'fashion', name: 'Мода', icon: '👗', category: 'lifestyle' },
  { id: 'science', name: 'Наука', icon: '🔬', category: 'knowledge' },
  { id: 'history', name: 'История', icon: '🏛️', category: 'knowledge' },
  { id: 'animals', name: 'Животные', icon: '🐾', category: 'lifestyle' },
  { id: 'fitness', name: 'Фитнес', icon: '💪', category: 'lifestyle' },
  { id: 'programming', name: 'Программирование', icon: '👨‍💻', category: 'knowledge' },
  { id: 'languages', name: 'Языки', icon: '🗣️', category: 'knowledge' },
  { id: 'psychology', name: 'Психология', icon: '🧠', category: 'knowledge' },
  { id: 'politics', name: 'Политика', icon: '🏛️', category: 'other' },
  { id: 'philosophy', name: 'Философия', icon: '🤔', category: 'knowledge' },
]

// Получить интерес по ID
export const getInterestById = (interestId: string): Interest | undefined => {
  return availableInterests.find(interest => interest.id === interestId);
}

// Получить интересы пользователя
export const getUserInterests = (userInterestIds: string[]): Interest[] => {
  return userInterestIds
    .map(interestId => getInterestById(interestId))
    .filter((interest): interest is Interest => interest !== undefined);
}

// Генерировать случайный псевдоним
export const generateRandomNickname = (): string => {
  const adjectives = ['Тайный', 'Загадочный', 'Скрытный', 'Неизвестный', 'Анонимный', 'Таинственный'];
  const nouns = ['Пользователь', 'Собеседник', 'Гость', 'Друг', 'Визитёр', 'Путник'];

  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 1000);

  return `${randomAdjective} ${randomNoun} ${randomNumber}`;
}
