import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserChats, getSupportChatId, getChatById } from '../utils/chatService';
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

            // Проверяем наличие чата с поддержкой
            const supportChatId = await getSupportChatId(user.telegramId);

            // Если чат с поддержкой существует
            if (supportChatId) {
                // Получаем полную информацию о чате поддержки
                const supportChatData = await getChatById(supportChatId);

                if (supportChatData) {
                    // Добавляем чат поддержки в список чатов
                    userChats.push({
                        ...supportChatData,
                        id: supportChatId,
                        isSupport: true // Добавляем флаг, что это чат поддержки
                    });
                }
            }

            // Сортируем чаты по времени последнего сообщения
            const sortedChats = userChats.sort((a, b) => {
                const timeA = a.lastMessageTime instanceof Date ? a.lastMessageTime : new Date(a.lastMessageTime?.seconds * 1000 || 0);
                const timeB = b.lastMessageTime instanceof Date ? b.lastMessageTime : new Date(b.lastMessageTime?.seconds * 1000 || 0);
                return timeB - timeA; // От новых к старым
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
    const handleRefresh = () => {
        setIsLoading(true);
        loadChats(false);
        // Добавляем тактильный отклик при обновлении
        safeHapticFeedback('impact', 'light');
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

    // Форматирование времени последнего обновления
    const formatLastRefreshed = () => {
        if (!lastRefreshed) return '';
        return `Обновлено: ${lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
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
