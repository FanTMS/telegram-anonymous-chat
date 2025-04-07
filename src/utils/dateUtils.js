/**
 * Утилиты для работы с датами и временем
 */

/**
 * Форматирует дату и время для отображения в сообщениях
 * @param {Date|Object|number|string} dateTime - Объект даты, Timestamp, число или строка
 * @returns {string} Отформатированное время
 */
export const formatMessageTime = (dateTime) => {
    try {
        let date;

        // Обработка различных типов входных данных
        if (!dateTime) {
            return '';
        } else if (dateTime instanceof Date) {
            date = dateTime;
        } else if (typeof dateTime === 'object' && dateTime.toDate) {
            // Firebase Timestamp
            date = dateTime.toDate();
        } else if (typeof dateTime === 'object' && dateTime.seconds) {
            // Firebase Timestamp в виде { seconds, nanoseconds }
            date = new Date(dateTime.seconds * 1000);
        } else if (typeof dateTime === 'number') {
            date = new Date(dateTime);
        } else if (typeof dateTime === 'string') {
            date = new Date(dateTime);
        } else {
            return '';
        }

        // Проверка валидности даты
        if (isNaN(date.getTime())) {
            return '';
        }

        const now = new Date();
        const isToday = date.getDate() === now.getDate() &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear();

        const isYesterday = date.getDate() === now.getDate() - 1 &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear();

        // Форматирование времени в стиле Telegram
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const timeStr = `${hours}:${minutes}`;

        if (isToday) {
            return timeStr;
        } else if (isYesterday) {
            return `Вчера, ${timeStr}`;
        } else {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const shortYear = date.getFullYear().toString().substr(2);
            return `${day}.${month}.${shortYear}, ${timeStr}`;
        }
    } catch (error) {
        console.error('Ошибка форматирования времени:', error);
        return '';
    }
};

/**
 * Форматирует дату последней активности группы
 * @param {Date|Object|number|string} dateTime - Объект даты, Timestamp, число или строка
 * @returns {string} Отформатированная дата активности
 */
export const formatLastActivity = (dateTime) => {
    try {
        let date;

        // Обработка различных типов входных данных (аналогично formatMessageTime)
        if (!dateTime) {
            return 'нет активности';
        } else if (dateTime instanceof Date) {
            date = dateTime;
        } else if (typeof dateTime === 'object' && dateTime.toDate) {
            date = dateTime.toDate();
        } else if (typeof dateTime === 'object' && dateTime.seconds) {
            date = new Date(dateTime.seconds * 1000);
        } else if (typeof dateTime === 'number') {
            date = new Date(dateTime);
        } else if (typeof dateTime === 'string') {
            date = new Date(dateTime);
        } else {
            return 'нет активности';
        }

        // Проверка валидности даты
        if (isNaN(date.getTime())) {
            return 'нет активности';
        }

        const now = new Date();
        const diffMs = now - date;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHours = Math.floor(diffMin / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSec < 60) {
            return 'только что';
        } else if (diffMin < 60) {
            return `${diffMin} ${getMinutesText(diffMin)} назад`;
        } else if (diffHours < 24) {
            return `${diffHours} ${getHoursText(diffHours)} назад`;
        } else if (diffDays < 7) {
            return `${diffDays} ${getDaysText(diffDays)} назад`;
        } else {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            return `${day}.${month}`;
        }
    } catch (error) {
        console.error('Ошибка форматирования активности:', error);
        return 'нет активности';
    }
};

// Вспомогательные функции для склонения слов
function getMinutesText(minutes) {
    const lastDigit = minutes % 10;
    if (minutes >= 11 && minutes <= 19) return 'минут';
    if (lastDigit === 1) return 'минуту';
    if (lastDigit >= 2 && lastDigit <= 4) return 'минуты';
    return 'минут';
}

function getHoursText(hours) {
    const lastDigit = hours % 10;
    if (hours >= 11 && hours <= 19) return 'часов';
    if (lastDigit === 1) return 'час';
    if (lastDigit >= 2 && lastDigit <= 4) return 'часа';
    return 'часов';
}

function getDaysText(days) {
    const lastDigit = days % 10;
    if (days >= 11 && days <= 19) return 'дней';
    if (lastDigit === 1) return 'день';
    if (lastDigit >= 2 && lastDigit <= 4) return 'дня';
    return 'дней';
}
