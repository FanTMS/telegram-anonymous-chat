import React, { useState, useEffect, useCallback } from 'react';
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

    const loadChats = useCallback(async (showLoadingIndicator = true) => {
        if (!user || !user.telegramId) return;

        try {
            if (showLoadingIndicator) setIsLoading(true);
            setError(null);

            const userChats = await getUserChats(user.telegramId);

            const supportChatId = await getSupportChatId(user.telegramId);

            if (supportChatId) {
                const supportChatData = await getChatById(supportChatId);

                if (supportChatData) {
                    userChats.push({
                        ...supportChatData,
                        id: supportChatId,
                        isSupport: true
                    });
                }
            }

            const sortedChats = userChats.sort((a, b) => {
                const timeA = a.lastMessageTime instanceof Date ? a.lastMessageTime : new Date(a.lastMessageTime?.seconds * 1000 || 0);
                const timeB = b.lastMessageTime instanceof Date ? b.lastMessageTime : new Date(b.lastMessageTime?.seconds * 1000 || 0);
                return timeB - timeA;
            });

            setChats(sortedChats);
            setFilteredChats(sortedChats);
            setLastRefreshed(new Date());
            setIsLoading(false);
        } catch (err) {
            console.error("Ошибка при загрузке списка чатов:", err);
            setError('Не удалось загрузить список чатов. Проверьте подключение к интернету и попробуйте снова.');
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadChats();

        const interval = setInterval(() => {
            loadChats(false);
        }, 60000);

        return () => clearInterval(interval);
    }, [loadChats]);

    const handleRefresh = () => {
        setIsLoading(true);
        loadChats(false);
        safeHapticFeedback('impact', 'light');
    };

    const goToChat = (chatId) => {
        safeHapticFeedback('selection');
        navigate(`/chat/${chatId}`);
    };

    const findNewChat = () => {
        safeHapticFeedback('impact', 'medium');
        sessionStorage.setItem('redirectedFromChats', 'true');
        navigate('/random-chat');
    };

    const handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);

        if (!query.trim()) {
            setFilteredChats(chats);
            return;
        }

        const filtered = chats.filter(chat => {
            const lastMessageText = chat.lastMessage?.text?.toLowerCase() || '';
            return lastMessageText.includes(query);
        });

        setFilteredChats(filtered);
    };

    const clearSearch = () => {
        setSearchQuery('');
        setFilteredChats(chats);
    };

    const formatLastMessageTime = (timestamp) => {
        if (!timestamp) return '';

        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 24 * 60 * 60 * 1000) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        if (diff < 7 * 24 * 60 * 60 * 1000) {
            const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
            return days[date.getDay()];
        }

        return date.toLocaleDateString([], { day: 'numeric', month: 'numeric' });
    };

    const formatLastRefreshed = () => {
        if (!lastRefreshed) return '';
        return `Обновлено: ${lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    };

    const getInitials = (chatId) => {
        if (!chatId) return '??';
        return chatId.toString().substring(0, 2).toUpperCase();
    };

    const renderChatsList = () => {
        if (filteredChats.length === 0 && searchQuery) {
            return (
                <div className="empty-list-message">
                    <div>По запросу "{searchQuery}" ничего не найдено</div>
                </div>
            );
        }

        return filteredChats.map((chat) => {
            const isUnread = chat.unreadCount > 0;

            return (
                <div
                    key={chat.id}
                    className="chat-item"
                    onClick={() => goToChat(chat.id)}
                >
                    <div className={`chat-avatar ${chat.isOnline ? 'online' : ''}`}>
                        {chat.isSupport ? (
                            <div className="support-avatar">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 12h-8v8h8v-8z"></path>
                                    <path d="M3 12h8V4H3v8z"></path>
                                    <path d="M3 20h8v-4H3v4z"></path>
                                    <path d="M17 4h4v4h-4V4z"></path>
                                </svg>
                            </div>
                        ) : (
                            getInitials(chat.partnerId)
                        )}
                    </div>
                    <div className="chat-details">
                        <div className="chat-name-time">
                            <h3 className="chat-name">{chat.isSupport ? 'Техническая поддержка' : 'Собеседник'}</h3>
                            {chat.lastMessageTime && (
                                <span className="last-message-time">
                                    {formatLastMessageTime(chat.lastMessageTime)}
                                </span>
                            )}
                        </div>
                        <p className={`last-message ${isUnread ? 'unread' : ''}`}>
                            {chat.lastMessage || 'Нет сообщений'}
                        </p>
                    </div>
                    {isUnread && (
                        <div className="unread-badge">
                            {chat.unreadCount}
                        </div>
                    )}
                </div>
            );
        });
    };

    if (isLoading) {
        return (
            <div className="chats-list-container">
                <h2 className="chats-list-title">Ваши чаты</h2>
                <div className="chats-loading">
                    <div className="chats-loading-indicator"></div>
                    <p>Загрузка чатов...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="chats-list-container">
                <h2 className="chats-list-title">Ваши чаты</h2>
                <div className="chats-error">
                    <div className="chats-error-icon">⚠️</div>
                    <p>{error}</p>
                    <button onClick={() => loadChats()}>Повторить</button>
                </div>
            </div>
        );
    }

    return (
        <div className="chats-list-container">
            <div className="chats-header">
                <h2 className="chats-list-title">Ваши чаты</h2>
                <button
                    className="refresh-button"
                    onClick={handleRefresh}
                    disabled={isLoading}
                    aria-label="Обновить список чатов"
                >
                    <svg className={`refresh-icon ${isLoading ? 'rotating' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 4v6h-6"></path>
                        <path d="M1 20v-6h6"></path>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
                        <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"></path>
                    </svg>
                </button>
            </div>

            {lastRefreshed && (
                <div className="last-refreshed">
                    {formatLastRefreshed()}
                </div>
            )}

            {chats.length > 3 && (
                <div className="search-bar">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Поиск по сообщениям..."
                        value={searchQuery}
                        onChange={handleSearch}
                    />
                    {searchQuery && (
                        <button className="search-clear" onClick={clearSearch}>
                            ✕
                        </button>
                    )}
                </div>
            )}

            {chats.length === 0 ? (
                <div className="no-chats">
                    <div className="no-chats-icon">💬</div>
                    <p>У вас пока нет активных чатов. Начните общение прямо сейчас!</p>
                    <button
                        className="find-new-chat-button"
                        onClick={findNewChat}
                    >
                        Найти собеседника
                    </button>
                </div>
            ) : (
                <>
                    <div className="chats-list">
                        {renderChatsList()}
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

            <div className="floating-action-button" onClick={findNewChat}></div>
        </div>
    );
};

export default ChatsList;
