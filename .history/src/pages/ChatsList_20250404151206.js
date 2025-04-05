import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserChats, getChatById, getSupportChatId } from '../utils/chatService';
import { safeHapticFeedback } from '../utils/telegramUtils';
import useAuth from '../hooks/useAuth';
import '../styles/ChatsList.css';

const ChatsList = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [chats, setChats] = useState([]);
    const [filteredChats, setFilteredChats] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [lastRefreshed, setLastRefreshed] = useState(null);

    // Загрузка чатов
    useEffect(() => {
        const loadChats = async () => {
            if (!user || !user.telegramId) return;

            try {
                setIsLoading(true);
                const userChats = await getUserChats(user.telegramId);

                // Сортировка чатов по времени последнего сообщения (от новых к старым)
                userChats.sort((a, b) => {
                    if (!a.lastActivity && !b.lastActivity) return 0;
                    if (!a.lastActivity) return 1;
                    if (!b.lastActivity) return -1;
                    return b.lastActivity - a.lastActivity;
                });

                setChats(userChats);
                setFilteredChats(userChats);
                setLastRefreshed(new Date());
            } catch (err) {
                console.error("Ошибка при загрузке чатов:", err);
                setError("Не удалось загрузить список чатов");
            } finally {
                setIsLoading(false);
            }
        };

        loadChats();
    }, [user]);

    // Фильтрация чатов при изменении поискового запроса
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredChats(chats);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = chats.filter(chat =>
            chat.name && chat.name.toLowerCase().includes(query)
        );

        setFilteredChats(filtered);
    }, [searchQuery, chats]);

    // Обработчики навигации
    const handleChatClick = (chatId) => {
        safeHapticFeedback('selection');
        navigate(`/chat/${chatId}`);
    };

    const handleNewChatClick = () => {
        safeHapticFeedback('impact', 'light');
        navigate('/random-chat');
    };

    const handleSupportChatClick = async () => {
        safeHapticFeedback('impact', 'light');

        try {
            // Получаем ID существующего или создаем новый чат поддержки
            const supportChatId = await getSupportChatId(user.telegramId);
            navigate(`/chat/${supportChatId}`);
        } catch (err) {
            console.error("Ошибка при открытии чата поддержки:", err);
            setError("Не удалось открыть чат поддержки");
        }
    };

    return (
        <div className="chats-list-container">
            <div className="chats-header">
                <h1>Чаты</h1>
                <div className="chats-actions">
                    <button
                        className="new-chat-button"
                        onClick={handleNewChatClick}
                        aria-label="Новый чат"
                    >
                        <span>+</span>
                    </button>
                </div>
            </div>

            <div className="search-container">
                <input
                    type="text"
                    placeholder="Поиск..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
                {searchQuery && (
                    <button
                        className="clear-search"
                        onClick={() => setSearchQuery('')}
                        aria-label="Очистить"
                    >
                        ×
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Загрузка чатов...</p>
                </div>
            ) : error ? (
                <div className="error-container">
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()}>
                        Попробовать снова
                    </button>
                </div>
            ) : filteredChats.length === 0 ? (
                <div className="empty-state">
                    {searchQuery ? (
                        <p>Чаты не найдены</p>
                    ) : (
                        <>
                            <p>У вас пока нет активных чатов</p>
                            <button
                                className="start-chat-button"
                                onClick={handleNewChatClick}
                            >
                                Начать новый чат
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <div className="chats-list">
                    {filteredChats.map(chat => (
                        <div
                            key={chat.id}
                            className="chat-item"
                            onClick={() => handleChatClick(chat.id)}
                        >
                            <div className={`chat-avatar ${chat.isSupportChat ? 'support-avatar' : ''}`}>
                                {chat.isSupportChat ? (
                                    <svg className="support-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 12h-8v8h8v-8z"></path>
                                        <path d="M3 12h8V4H3v8z"></path>
                                        <path d="M3 20h8v-4H3v4z"></path>
                                        <path d="M17 4h4v4h-4V4z"></path>
                                    </svg>
                                ) : (
                                    (chat.name || 'Аноним').substring(0, 2).toUpperCase()
                                )}
                            </div>
                            <div className="chat-details">
                                <div className="chat-name-row">
                                    <h3 className="chat-name">
                                        {chat.isSupportChat ? 'Техническая поддержка' : (chat.name || 'Аноним')}
                                    </h3>
                                    <span className="chat-time">
                                        {chat.lastActivity ? new Date(chat.lastActivity).toLocaleDateString() : ''}
                                    </span>
                                </div>
                                <p className="chat-last-message">
                                    {chat.lastMessage?.text || 'Нет сообщений'}
                                </p>
                                {chat.unreadCount > 0 && (
                                    <div className="unread-badge">{chat.unreadCount}</div>
                                )}
                            </div>
                        </div>
                    ))}

                    <div className="support-chat-button" onClick={handleSupportChatClick}>
                        <svg className="support-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12h-8v8h8v-8z"></path>
                            <path d="M3 12h8V4H3v8z"></path>
                            <path d="M3 20h8v-4H3v4z"></path>
                            <path d="M17 4h4v4h-4V4z"></path>
                        </svg>
                        <span>Техническая поддержка</span>
                    </div>
                </div>
            )}

            {lastRefreshed && (
                <div className="last-refreshed">
                    Обновлено: {lastRefreshed.toLocaleTimeString()}
                </div>
            )}
        </div>
    );
};

export default ChatsList;
