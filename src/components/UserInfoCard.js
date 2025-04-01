import React from 'react';

/**
 * Компонент карточки информации о пользователе Telegram
 * @param {Object} props - Свойства компонента
 * @param {Object} props.user - Данные пользователя Telegram
 * @param {boolean} props.isDevelopment - Флаг режима разработки
 * @returns {JSX.Element} Карточка пользователя
 */
const UserInfoCard = ({ user, isDevelopment }) => {
    if (!user) return null;

    // Получаем инициалы или первую букву имени для аватара
    const getInitials = () => {
        if (user.first_name) {
            const firstLetter = user.first_name.charAt(0).toUpperCase();
            const secondLetter = user.last_name ? user.last_name.charAt(0).toUpperCase() : '';
            return secondLetter ? `${firstLetter}${secondLetter}` : firstLetter;
        }
        return 'T';
    };

    // Случайные цвета для аватара на основе ID пользователя
    const getRandomColor = () => {
        const colors = [
            '#FF6B6B', '#FF9E7D', '#6BCB77', '#4D96FF', '#9C6BFF',
            '#FFA7A7', '#FFCF7D', '#88E0D0', '#7DA8FF', '#C8A8FF'
        ];

        const index = user.id ? Math.abs(user.id) % colors.length : 0;
        return colors[index];
    };

    return (
        <div className="telegram-user-info">
            <div
                className="tg-user-avatar"
                style={{ background: `linear-gradient(135deg, ${getRandomColor()}, ${getRandomColor()}88)` }}
            >
                {getInitials()}
            </div>
            <div className="tg-user-details">
                <p>{user.first_name} {user.last_name || ''}</p>
                <p className="tg-user-id">
                    {user.username ? `@${user.username}` : `Telegram ID: ${user.id}`}
                </p>
            </div>
            {isDevelopment && user.is_dev_mode && (
                <span className="dev-mode-tag">DEV</span>
            )}
        </div>
    );
};

export default UserInfoCard;
