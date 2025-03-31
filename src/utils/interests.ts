// Список доступных интересов
export const availableInterests = [
  { icon: '🎵', name: 'Музыка' },
  { icon: '🎬', name: 'Кино' },
  { icon: '📚', name: 'Книги' },
  { icon: '⚽', name: 'Спорт' },
  { icon: '✈️', name: 'Путешествия' },
  { icon: '🍕', name: 'Кулинария' },
  { icon: '🐶', name: 'Животные' },
  { icon: '🎮', name: 'Игры' },
  { icon: '💻', name: 'Технологии' },
  { icon: '🎨', name: 'Искусство' },
  { icon: '🔬', name: 'Наука' },
  { icon: '🌿', name: 'Природа' },
  { icon: '👗', name: 'Мода' },
  { icon: '💪', name: 'Фитнес' },
  { icon: '📷', name: 'Фотография' }
];

// Функция для генерации случайного псевдонима
export const generateRandomNickname = (): string => {
  const adjectives = ['Солнечный', 'Лунный', 'Звездный', 'Загадочный', 'Веселый', 'Тихий', 'Яркий', 'Креативный'];
  const nouns = ['Путник', 'Герой', 'Мечтатель', 'Исследователь', 'Художник', 'Странник', 'Философ'];

  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 1000);

  return `${randomAdjective}${randomNoun}${randomNumber}`;
};

// Получить случайные интересы
export const getRandomInterests = (count: number = 3): string[] => {
  // Перемешиваем интересы и выбираем нужное количество
  const shuffled = [...availableInterests].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map(interest => interest.name);
};

export default {
  availableInterests,
  generateRandomNickname,
  getRandomInterests
};
