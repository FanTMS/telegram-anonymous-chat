import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserChats, getChatById, getSupportChatId, createSupportChat } from '../utils/chatService';
import { safeHapticFeedback } from '../utils/telegramUtils';
import { useAuth } from '../hooks/useAuth';
import '../styles/ChatsList.css';

const ChatsList = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [chats, setChats] = useState([]);
    const [filteredChats, setFilteredChats] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [lastRefreshed, setLastRefreshed] = useState(new Date());
    const [supportChatId, setSupportChatId] = useState(null);

    // Загрузка чатов
    useEffect(() => {
        const loadChats = async () => {
            if (!user) {
                console.error('Пользователь не авторизован');
                setIsLoading(false);
                return;
            }
            
            // Получаем userId для запросов
            const userId = getUserId(user);
            if (!userId) {
                console.error('Не удалось определить ID пользователя');
                setError("Ошибка аутентификации. Пожалуйста, войдите снова.");
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);
                
                console.log('Загрузка чатов для пользователя:', userId);

                // Получаем список чатов пользователя
                const userChats = await getUserChats(userId);
                console.log('Получены чаты пользователя:', userChats);

                // Проверяем наличие чата поддержки
                let hasSupportChat = false;
                let supportChat = null;
                
                // Ищем чат поддержки в полученных чатах
                for (const chat of userChats) {
                    if (chat.type === 'support' || chat.isSupportChat) {
                        hasSupportChat = true;
                        supportChat = chat;
                        setSupportChatId(chat.id);
                        break;
                    }
                }
                
                // Если чат поддержки не найден, создаем его
                if (!hasSupportChat) {
                    console.log('Чат поддержки не найден, создаем новый');
                    try {
                        const newSupportChatId = await createSupportChat(userId);
                        console.log('Создан новый чат поддержки:', newSupportChatId);
                        
                        if (newSupportChatId) {
                            setSupportChatId(newSupportChatId);
                            
                            // Получаем данные нового чата поддержки
                            const supportChatData = await getChatById(newSupportChatId);
                            console.log('Получены данные чата поддержки:', supportChatData);
                            
                            if (supportChatData) {
                                // Добавляем чат поддержки к списку чатов
                                userChats.push({
                                    ...supportChatData,
                                    id: newSupportChatId,
                                    isSupportChat: true,
                                    pinned: true,
                                    name: 'Техническая поддержка',
                                    lastActivity: supportChatData.lastMessageTime?.toDate() || new Date(),
                                    lastMessageTime: supportChatData.lastMessageTime?.toDate() || new Date()
                                });
                            }
                        }
                    } catch (supportError) {
                        console.error("Ошибка при создании чата поддержки:", supportError);
                    }
                }

                // Сортировка чатов: сначала закрепленные, затем по времени
                userChats.sort((a, b) => {
                    // Если один чат закреплен, а другой нет
                    if (a.pinned && !b.pinned) return -1;
                    if (!a.pinned && b.pinned) return 1;
                    
                    // Если оба закреплены или оба не закреплены, сортируем по времени
                    const timeA = a.lastMessageTime ? (a.lastMessageTime instanceof Date ? a.lastMessageTime : new Date(a.lastMessageTime)) : new Date(0);
                    const timeB = b.lastMessageTime ? (b.lastMessageTime instanceof Date ? b.lastMessageTime : new Date(b.lastMessageTime)) : new Date(0);
                    
                    return timeB.getTime() - timeA.getTime();
                });

                console.log('Отсортированные чаты:', userChats);
                setChats(userChats);
                setFilteredChats(userChats);
                setLastRefreshed(new Date());
                setIsLoading(false);
            } catch (err) {
                console.error("Ошибка при загрузке чатов:", err);
                setError("Не удалось загрузить список чатов. Пожалуйста, попробуйте позже.");
                setIsLoading(false);
            }
        };

        loadChats();

        // Обновление чатов каждую минуту
        const interval = setInterval(() => {
            loadChats();
        }, 60000);

        return () => clearInterval(interval);
    }, [user]);

    // Получение ID пользователя для работы с чатами
    const getUserId = (user) => {
        if (!user) return null;
        
        // Приоритетно используем telegramId из telegramData
        if (user.telegramData && user.telegramData.telegramId) {
            return user.telegramData.telegramId;
        }
        
        // Используем telegramId напрямую, если есть
        if (user.telegramId) {
            return user.telegramId;
        }
        
        // В последнюю очередь используем id пользователя
        if (user.id) {
            return user.id;
        }
        
        // Пытаемся получить ID из localStorage как последний вариант
        const savedUserId = localStorage.getItem('current_user_id');
        if (savedUserId) {
            return savedUserId;
        }
        
        return null;
    };

    // Фильтрация чатов при изменении поискового запроса
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredChats(chats);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = chats.filter(chat => {
            // Поиск по имени чата
            const chatName = chat.isSupportChat ? 'Техническая поддержка' : (chat.name || 'Собеседник');
            // Поиск и по имени, и по последнему сообщению
            const lastMessageText = chat.lastMessage?.text?.toLowerCase() || '';
            return chatName.toLowerCase().includes(query) || lastMessageText.includes(query);
        });

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
        console.log('Нажатие на кнопку поддержки. Текущий ID чата поддержки:', supportChatId);

        try {
            setIsLoading(true);
            
            // Получаем userId для запросов
            const userId = getUserId(user);
            if (!userId) {
                throw new Error("Не удалось определить ID пользователя");
            }
            
            // Проверяем, есть ли уже известный ID чата поддержки
            if (supportChatId) {
                console.log('Переходим к существующему чату поддержки:', supportChatId);
                navigate(`/chat/${supportChatId}`);
                return;
            }
            
            // Пробуем получить ID существующего чата поддержки
            let chatId = await getSupportChatId(userId);
            console.log('Получен ID чата поддержки:', chatId);
            
            // Если чат не найден, создаем новый
            if (!chatId) {
                console.log('Создаем новый чат поддержки для пользователя:', userId);
                chatId = await createSupportChat(userId);
                console.log('Создан новый чат поддержки:', chatId);
            }
            
            if (chatId) {
                setSupportChatId(chatId);
                navigate(`/chat/${chatId}`);
            } else {
                throw new Error("Не удалось получить или создать чат поддержки");
            }
        } catch (err) {
            console.error("Ошибка при открытии чата поддержки:", err);
            setError("Не удалось открыть чат поддержки. Пожалуйста, попробуйте позже.");
        } finally {
            setIsLoading(false);
        }
    };

    // Форматирование для времени последнего сообщения
    const formatLastMessageTime = (timestamp) => {
        if (!timestamp) return '';

        const date = new Date(timestamp);
        const now = new Date();

        const isToday = now.toDateString() === date.toDateString();
        if (isToday) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }

        const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();
        if (isYesterday) {
            return 'Вчера';
        }

        return date.toLocaleDateString();
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
                            
                            <div className="support-chat-button" onClick={handleSupportChatClick}>
                                <svg className="support-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"></path>
                                    <path d="M12 16v2"></path>
                                    <path d="M12 8a2.5 2.5 0 0 0-2.5 2.5v1.5a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1.5A2.5 2.5 0 0 0 12 8z"></path>
                                </svg>
                                <span>Техническая поддержка</span>
                            </div>
                        </>
                    )}
                </div>
            ) : (
                <div className="chats-list">
                    {filteredChats.map(chat => {
                        // Determine if the chat has unread messages
                        const isUnread = chat.unreadByUser === true || 
                                       (chat.unreadBy && chat.unreadBy[user?.uid] === true) ||
                                       (chat.type === 'support' && chat.unreadByUser === true);

                        console.log(`Chat ${chat.id}: unreadByUser=${chat.unreadByUser}, unreadBy=${JSON.stringify(chat.unreadBy)}, isUnread=${isUnread}`);

                        return (
                            <div
                                key={chat.id}
                                className={`chat-item ${chat.pinned ? 'pinned' : ''} ${isUnread ? 'unread' : ''}`}
                                onClick={() => handleChatClick(chat.id)}
                            >
                                {chat.pinned && <div className="pin-indicator"></div>}
                                <div className={`chat-avatar ${chat.isOnline ? 'online' : ''} ${chat.isSupportChat ? 'support-avatar' : ''}`}>
                                    {chat.isSupportChat ? (
                                        <svg className="support-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"></path>
                                            <path d="M12 16v2"></path>
                                            <path d="M12 8a2.5 2.5 0 0 0-2.5 2.5v1.5a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1.5A2.5 2.5 0 0 0 12 8z"></path>
                                        </svg>
                                    ) : (
                                        (chat.name || 'Аноним').substring(0, 2).toUpperCase()
                                    )}
                                    {chat.unreadCount > 0 && (
                                        <div className="unread-badge">{chat.unreadCount}</div>
                                    )}
                                </div>
                                <div className="chat-details">
                                    <div className="chat-name-row">
                                        <h3 className="chat-name">
                                            {chat.isSupportChat ? 'Техническая поддержка' : (chat.name || 'Аноним')}
                                        </h3>
                                        <span className="chat-time">
                                            {chat.lastMessageTime ? formatLastMessageTime(chat.lastMessageTime) : 
                                             (chat.lastActivity ? formatLastMessageTime(chat.lastActivity) : '')}
                                        </span>
                                    </div>
                                    <p className="chat-last-message">
                                        {chat.lastMessage || (chat.isSupportChat ? 'Чат с технической поддержкой' : 'Нет сообщений')}
                                    </p>
                                </div>
                                {isUnread && (
                                    <div className="chat-notification-badge"></div>
                                )}
                            </div>
                        );
                    })}
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
