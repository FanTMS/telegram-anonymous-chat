/**
 * Генератор случайных псевдонимов
 */

const adjectives = [
    'Веселый', 'Грустный', 'Смелый', 'Скромный', 'Умный',
    'Добрый', 'Милый', 'Быстрый', 'Ленивый', 'Мудрый',
    'Хитрый', 'Шустрый', 'Ловкий', 'Дерзкий', 'Громкий',
    'Тихий', 'Яркий', 'Бледный', 'Сильный', 'Слабый',
    'Крепкий', 'Могучий', 'Нежный', 'Грозный', 'Странный',
    'Загадочный', 'Забавный', 'Классный', 'Крутой', 'Задумчивый'
];

const nouns = [
    'Кот', 'Пес', 'Волк', 'Тигр', 'Лев',
    'Заяц', 'Лиса', 'Медведь', 'Дельфин', 'Орел',
    'Ястреб', 'Сокол', 'Ворон', 'Горностай', 'Ёж',
    'Барсук', 'Рысь', 'Пантера', 'Гепард', 'Слон',
    'Черепаха', 'Дракон', 'Феникс', 'Грифон', 'Единорог',
    'Пегас', 'Мантикора', 'Василиск', 'Гидра', 'Химера'
];

/**
 * Генерирует случайный псевдоним
 * @returns {string} Сгенерированный псевдоним
 */
export const generateNickname = () => {
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 1000);

    return `${adjective}${noun}${number}`;
};

/**
 * Генерирует случайный псевдоним с номером
 * @param {number} length - Длина псевдонима (по умолчанию 3 слова)
 * @returns {string} Сгенерированный псевдоним
 */
export const generateRandomUsername = (length = 3) => {
    const parts = [];
    for (let i = 0; i < length - 1; i++) {
        if (i % 2 === 0) {
            parts.push(adjectives[Math.floor(Math.random() * adjectives.length)]);
        } else {
            parts.push(nouns[Math.floor(Math.random() * nouns.length)]);
        }
    }
    parts.push(Math.floor(Math.random() * 10000));

    return parts.join('');
};
