import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserChats } from '../utils/chatService';
import '../styles/ChatsList.css';

const ChatsList = ({ user }) => {
    const [chats, setChats] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Загрузка списка чатов
    useEffect(() => {
        const loadChats = async () => {
            if (!user || !user.telegramId) return;

            try {
                setIsLoading(true);
                setError(null);

                const userChats = await getUserChats(user.telegramId);
                setChats(userChats);
                setIsLoading(false);
            } catch (err) {
                console.error("Ошибка при загрузке списка чатов:", err);
                setError('Не удалось загрузить список чатов');
                setIsLoading(false);
            }
        };

        loadChats();

        // Обновляем список чатов каждые 30 секунд
        const interval = setInterval(loadChats, 30000);

        return () => clearInterval(interval);
    }, [user]);

    // Переход к чату
    const goToChat = (chatId) => {
        navigate(`/chat/${chatId}`);
    };

    // Переход к поиску нового собеседника
    const findNewChat = () => {
        // Устанавливаем флаг для предотвращения обратного перенаправления
        sessionStorage.setItem('redirectedFromChats', 'true');
        navigate('/random-chat');
    };

    // Форматирование времени последнего сообщения
    const formatLastMessageTime = (timestamp) => {
        if (!timestamp) return '';

        const date = new Date(timestamp);
        const now = new Date();

        // Если сообщение было сегодня, показываем только время
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        // Если сообщение было вчера
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return 'Вчера';
        }

        // Иначе показываем дату
        return date.toLocaleDateString();
    };

    // Если загрузка
    if (isLoading) {
        return <div className="chats-loading">Загрузка чатов...</div>;
    }

    // Если ошибка
    if (error) {
        return <div className="chats-error">
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Попробовать снова</button>
        </div>;
    }

    return (
        <div className="chats-list-container">
            <h2 className="chats-list-title">Ваши чаты</h2>

            {chats.length === 0 ? (
                <div className="no-chats">
                    <p>У вас пока нет активных чатов</p>
                    <button
                        className="find-chat-button"
                        onClick={findNewChat}
                    >
                        Найти собеседника
                    </button>
                </div>
            ) : (
                <>
                    <div className="chats-list">
                        {chats.map((chat) => (
                            <div
                                key={chat.id}
                                className="chat-item"
                                onClick={() => goToChat(chat.id)}
                            >
                                <div className="chat-avatar">
                                    {/* Можно показать аватар или просто иконку */}
                                    <span className="avatar-placeholder">
                                        {chat.partnerId ? chat.partnerId.substring(0, 2).toUpperCase() : '??'}
                                    </span>
                                </div>
                                <div className="chat-details">
                                    <div className="chat-name-time">
                                        <h3 className="chat-name">Собеседник</h3>
                                        {chat.lastMessage && (
                                            <span className="last-message-time">
                                                {formatLastMessageTime(chat.lastMessage.timestamp)}
                                            </span>
                                        )}
                                    </div>
                                    <p className="last-message">
                                        {chat.lastMessage
                                            ? chat.lastMessage.text
                                            : 'Нет сообщений'}
                                    </p>
                                </div>
                                {chat.unreadCount > 0 && (
                                    <div className="unread-badge">
                                        {chat.unreadCount}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="new-chat-section">
                        <button
                            className="find-new-chat-button"
                            onClick={findNewChat}
                        >
                            Найти нового собеседника
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ChatsList;
