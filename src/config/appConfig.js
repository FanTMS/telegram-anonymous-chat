/**
 * Конфигурация приложения
 */

// Список интересов для выбора пользователем
export const INTERESTS = [
    { id: 'tech', name: 'Технологии' },
    { id: 'music', name: 'Музыка' },
    { id: 'books', name: 'Книги' },
    { id: 'movies', name: 'Фильмы' },
    { id: 'sports', name: 'Спорт' },
    { id: 'travel', name: 'Путешествия' },
    { id: 'food', name: 'Еда и кулинария' },
    { id: 'art', name: 'Искусство' },
    { id: 'games', name: 'Игры' },
    { id: 'psychology', name: 'Психология' },
    { id: 'science', name: 'Наука' },
    { id: 'languages', name: 'Языки' },
    { id: 'history', name: 'История' },
    { id: 'programming', name: 'Программирование' },
    { id: 'design', name: 'Дизайн' },
    { id: 'photography', name: 'Фотография' },
    { id: 'fashion', name: 'Мода' },
    { id: 'health', name: 'Здоровье и фитнес' },
    { id: 'business', name: 'Бизнес' },
    { id: 'animals', name: 'Животные' }
];

// Другие настройки приложения
export const APP_CONFIG = {
    defaultUserNickname: 'Анонимный пользователь',
    defaultUserAvatar: '/assets/default-avatar.png',
    messageMaxLength: 2000,
    maxActiveChatCount: 10,
    maxChatIdleTimeMin: 60,
    maxUserIdleTimeDays: 30
};
