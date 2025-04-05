import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserChats } from '../utils/chatService';
import { safeHapticFeedback, safeShowPopup } from '../utils/telegramWebAppUtils';
import '../styles/ChatsList.css';

const ChatsList = ({ user }) => {
    const [chats, setChats] = useState([]);
    const [filteredChats, setFilteredChats] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState(new Date());
    const navigate = useNavigate();
    const searchInputRef = useRef(null);

    // Загрузка списка чатов
    const loadChats = useCallback(async (showLoadingIndicator = true) => {
        if (!user || !user.telegramId) return;

        try {
            if (showLoadingIndicator) setIsLoading(true);
            setError(null);

            const userChats = await getUserChats(user.telegramId);
            setChats(userChats);
            setFilteredChats(userChats);
            setLastRefreshed(new Date());
            setIsLoading(false);
        } catch (err) {
            console.error("Ошибка при загрузке списка чатов:", err);
            setError('Не удалось загрузить список чатов. Проверьте подключение к интернету и попробуйте снова.');
            setIsLoading(false);
        }
    }, [user]);

    // Первоначальная загрузка и периодическое обновление
    useEffect(() => {
        loadChats();

        // Обновляем список чатов каждые 60 секунд
        const interval = setInterval(() => {
            loadChats(false);
        }, 60000);

        return () => clearInterval(interval);
    }, [loadChats]);

    // Обработка обновления через pull-to-refresh
    const handleRefresh = async () => {
        if (refreshing) return;

        setRefreshing(true);
        
        // Вибрация
        safeHapticFeedback('impact', 'light');

        try {
            await loadChats(false);
            
            // Показать уведомление об успешном обновлении
            safeShowPopup({
                title: 'Обновлено',
                message: 'Список чатов обновлен',
                buttons: [{ text: "ОК" }]
            });
            
        } catch (err) {
            console.error("Ошибка при обновлении:", err);
        } finally {
            setRefreshing(false);
        }
    };

    // Переход к чату
    const goToChat = (chatId) => {
        // Вибрация
        safeHapticFeedback('selection');
        navigate(`/chat/${chatId}`);
    };

    // Переход к поиску нового собеседника
    const findNewChat = () => {
        // Вибрация
        safeHapticFeedback('impact', 'medium');
        
        // Устанавливаем флаг для предотвращения обратного перенаправления
        sessionStorage.setItem('redirectedFromChats', 'true');
        navigate('/random-chat');
    };

    // Обработка поиска
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

    // Очистка поиска
    const clearSearch = () => {
        setSearchQuery('');
        setFilteredChats(chats);
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    };

    // Форматирование времени последнего сообщения
    const formatLastMessageTime = (timestamp) => {
        if (!timestamp) return '';

        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        // Меньше дня - показываем время
        if (diff < 24 * 60 * 60 * 1000) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        // Меньше недели - показываем день недели
        if (diff < 7 * 24 * 60 * 60 * 1000) {
            const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
            return days[date.getDay()];
        }
        
        // Иначе показываем дату
        return date.toLocaleDateString([], { day: 'numeric', month: 'numeric' });
    };

    // Получение инициалов собеседника для аватара
    const getInitials = (chatId) => {
        if (!chatId) return '??';
        
        // Извлекаем первые 2 символа из идентификатора чата или партнера
        return chatId.toString().substring(0, 2).toUpperCase();
    };

    // Отрисовка списка чатов
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
                        {getInitials(chat.partnerId)}
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
                        <p className={`last-message ${isUnread ? 'unread' : ''}`}>
                            {chat.lastMessage
                                ? chat.lastMessage.text
                                : 'Нет сообщений'}
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

    // Форматирование времени последнего обновления
    const formatLastRefreshed = () => {
        return lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
            <div className="chats-list-header">
                <h2 className="chats-list-title">Ваши чаты</h2>
                {refreshing && (
                    <div className="pull-to-refresh">
                        <div className="pull-to-refresh-spinner"></div>
                        <span>Обновление...</span>
                    </div>
                )}
            </div>

            {chats.length > 3 && (
                <div className="search-bar">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Поиск по сообщениям..."
                        value={searchQuery}
                        onChange={handleSearch}
                        ref={searchInputRef}
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
