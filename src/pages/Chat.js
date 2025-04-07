import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
    getChatById,
    getChatMessages,
    sendChatMessage,
    checkChatMatchStatus
} from '../utils/chatService';
import { addSupportChat } from '../utils/supportService';
import UserStatus from '../components/UserStatus';
import { useToast } from '../components/Toast';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import '../styles/Chat.css';

const Chat = () => {
    const { chatId } = useParams();
    const { user } = useAuth();
    const { showToast } = useToast();

    const [chat, setChat] = useState(null);
    const [partnerInfo, setPartnerInfo] = useState({});
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState(null);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isPartnerTyping, setIsPartnerTyping] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    // Форматирование времени с учетом возможных проблем с датами
    const formatMessageTime = (timestamp) => {
        if (!timestamp) return '';
        
        try {
            let date;
            
            // Обработка разных форматов времени
            if (timestamp.toDate) {
                // Если это объект Firestore Timestamp
                date = timestamp.toDate();
            } else if (timestamp instanceof Date) {
                date = timestamp;
            } else if (typeof timestamp === 'string') {
                date = new Date(timestamp);
            } else if (typeof timestamp === 'number') {
                date = new Date(timestamp);
            } else {
                // Если не удалось определить формат
                return 'Недавно';
            }
            
            // Проверяем валидность даты
            if (isNaN(date.getTime())) {
                return 'Недавно';
            }
            
            // Форматируем время
            return date.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            console.error('Ошибка при форматировании времени:', error);
            return 'Недавно';
        }
    };

    const getInitials = (name) => {
        if (!name) return '';
        return name
            .split(' ')
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    useEffect(() => {
        const loadChatDetails = async () => {
            try {
                if (!chatId || !user) return;

                setIsLoading(true);
                setError(null);

                // Сначала проверяем статус чата для получения подробной информации о партнере
                const chatStatus = await checkChatMatchStatus(user.id);
                let chatDetails;
                
                if (chatStatus && chatStatus.id === chatId) {
                    // Используем данные из checkChatMatchStatus, которые содержат информацию о партнере
                    chatDetails = chatStatus;
                    
                    // Если есть информация о партнере, обрабатываем её
                    if (chatStatus.partner) {
                        const partnerData = chatStatus.partner;
                        setPartnerInfo({
                            id: partnerData.id,
                            name: partnerData.name || 'Собеседник',
                            platform: partnerData.platform || 'unknown',
                            telegramData: partnerData.telegramData || null,
                            profilePicture: null, // Можно добавить аватар из telegramData если доступен
                            isOnline: true, // Можно обновить на основе статуса партнера
                            lastSeen: null
                        });
                        
                        console.log('Информация о партнере:', partnerData);
                    }
                } else {
                    // Если не получили данные из checkChatMatchStatus, используем обычный getChatById
                    chatDetails = await getChatById(chatId);
                    
                    if (chatDetails.type === 'support') {
                        setPartnerInfo({
                            name: 'Техническая поддержка',
                            isOnline: true,
                            profilePicture: null,
                            lastSeen: null,
                            isSupportChat: true
                        });
                    } else if (chatDetails.participants && chatDetails.participants.length > 0) {
                        // Находим ID партнера
                        const partnerId = chatDetails.participants.find(id => id !== user.id);
                        
                        if (partnerId && chatDetails.participantsData && chatDetails.participantsData[partnerId]) {
                            const partner = chatDetails.participantsData[partnerId];
                            setPartnerInfo({
                                id: partnerId,
                                name: partner.name || 'Собеседник',
                                platform: partner.platform || 'unknown',
                                telegramData: partner.telegramData || null,
                                profilePicture: null,
                                isOnline: true,
                                lastSeen: null
                            });
                        }
                    }
                }
                
                setChat(chatDetails);

                const chatMessages = await getChatMessages(chatId);
                setMessages(chatMessages);

                setTimeout(() => {
                    scrollToBottom(true);
                }, 100);

            } catch (err) {
                console.error("Ошибка при загрузке чата:", err);
                setError("Не удалось загрузить чат");
            } finally {
                setIsLoading(false);
            }
        };

        loadChatDetails();
        
        // Создаем интервал для обновления сообщений
        const messageInterval = setInterval(() => {
            loadMessages();
        }, 5000); // Обновляем каждые 5 секунд
        
        return () => {
            clearInterval(messageInterval);
        };
    }, [chatId, user]);

    const loadMessages = async () => {
        try {
            if (!chatId) return;
            
            const messagesCollection = collection(db, 'chats', chatId, 'messages');
            const q = query(
                messagesCollection,
                orderBy('timestamp', 'desc'),
                limit(50)
            );

            const snapshot = await getDocs(q);
            const fetchedMessages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Переворачиваем, чтобы последние сообщения были внизу
            const sortedMessages = fetchedMessages.reverse();
            
            // Обновляем только если получены новые сообщения
            if (sortedMessages.length !== messages.length || 
                (sortedMessages.length > 0 && messages.length > 0 && 
                 sortedMessages[sortedMessages.length - 1].id !== messages[messages.length - 1].id)) {
                setMessages(sortedMessages);
                
                // Прокручиваем вниз только если пользователь уже находится внизу чата
                const container = messagesContainerRef.current;
                if (container) {
                    const { scrollHeight, scrollTop, clientHeight } = container;
                    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
                    
                    if (isNearBottom) {
                        setTimeout(() => scrollToBottom(true), 100);
                    }
                }
            }
        } catch (error) {
            console.error('Ошибка при загрузке сообщений:', error);
        }
    };

    const scrollToBottom = (smooth = false) => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
                behavior: smooth ? 'smooth' : 'auto'
            });
        }
    };

    const checkScrollPosition = () => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const { scrollHeight, scrollTop, clientHeight } = container;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

        setShowScrollButton(!isNearBottom);
    };

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (container) {
            container.addEventListener('scroll', checkScrollPosition);
            return () => container.removeEventListener('scroll', checkScrollPosition);
        }
    }, []);

    const handleBackClick = () => {
        navigate(-1);
    };

    const handleSendMessage = async () => {
        const messageText = inputMessage.trim();
        if (!messageText || !chatId || !user?.id || isSending) return;

        setIsSending(true);
        setInputMessage('');

        try {
            // Добавляем сообщение локально для мгновенного отображения
            const tempMessage = {
                id: `temp-${Date.now()}`,
                senderId: user.id,
                senderName: user.name || "Вы",
                text: messageText,
                timestamp: new Date(),
                pending: true
            };

            setMessages(prevMessages => [...prevMessages, tempMessage]);
            scrollToBottom(true);

            // Отправляем сообщение на сервер
            await sendChatMessage(chatId, user.id, messageText);

            // Обновляем список сообщений
            loadMessages();
        } catch (error) {
            console.error("Ошибка при отправке сообщения:", error);
            setError(error.message || "Не удалось отправить сообщение");
            showToast("Не удалось отправить сообщение", "error");

            // Убираем временное сообщение при ошибке
            setMessages(prevMessages =>
                prevMessages.filter(msg => !msg.id.startsWith('temp-'))
            );
        } finally {
            setIsSending(false);
            // Фокусируем ввод снова
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }
    };
    
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="chat-container telegram-chat">
            <div className="chat-header">
                <button className="back-button" onClick={handleBackClick}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
                <div className="partner-info">
                    <div className="partner-avatar">
                        {chat?.type === 'support' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12h-8v8h8v-8z"></path>
                                <path d="M3 12h8V4H3v8z"></path>
                                <path d="M3 20h8v-4H3v4z"></path>
                                <path d="M17 4h4v4h-4V4z"></path>
                            </svg>
                        ) : (
                            partnerInfo.profilePicture ? 
                            <img src={partnerInfo.profilePicture} alt={partnerInfo.name} /> :
                            <div className="partner-initials">{getInitials(partnerInfo.name)}</div>
                        )}
                    </div>
                    <div className="partner-details">
                        <h2>
                            {chat?.type === 'support' ? 'Техническая поддержка' : partnerInfo.name}
                        </h2>
                        <UserStatus
                            isOnline={partnerInfo.isOnline}
                            lastSeen={partnerInfo.lastSeen}
                            isSupportChat={chat?.type === 'support'}
                        />
                        {isPartnerTyping && (
                            <div className="partner-typing">печатает...</div>
                        )}
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="chat-loading">
                    <div className="chat-loading-spinner"></div>
                    <p>Загрузка чата...</p>
                </div>
            ) : error ? (
                <div className="chat-error">
                    <div className="error-icon">!</div>
                    <p>{error}</p>
                    <button className="error-back-button" onClick={handleBackClick}>
                        Вернуться к чатам
                    </button>
                </div>
            ) : (
                <>
                    <div className="chat-messages" ref={messagesContainerRef}>
                        {messages.length === 0 ? (
                            <div className="no-messages">
                                <div className="no-messages-icon">💬</div>
                                <p>Начните общение! Отправьте первое сообщение, чтобы завести беседу.</p>
                            </div>
                        ) : (
                            <>
                                {messages.map((message, index) => {
                                    const isOutgoing = message.senderId === user.id;
                                    const showSenderInfo = !isOutgoing && 
                                                          (index === 0 || 
                                                           messages[index - 1].senderId !== message.senderId);
                                    
                                    return (
                                        <div
                                            key={message.id}
                                            className={`message ${isOutgoing ? 'outgoing' : 'incoming'} ${message.pending ? 'pending' : ''}`}
                                        >
                                            <div className="message-content">
                                                {showSenderInfo && (
                                                    <div className="message-sender">{message.senderName || 'Собеседник'}</div>
                                                )}
                                                <p>{message.text}</p>
                                                <span className="message-time">
                                                    {formatMessageTime(message.timestamp)}
                                                    {isOutgoing && (
                                                        <span className={`message-status ${message.read ? 'read' : ''}`}>
                                                            {message.pending ? 
                                                                <span className="sending-indicator">⌛</span> : 
                                                                message.read ? 
                                                                    <span className="read-indicator">✓✓</span> : 
                                                                    <span className="sent-indicator">✓</span>
                                                            }
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    <div className="message-input">
                        <input
                            type="text"
                            placeholder="Введите сообщение..."
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            ref={inputRef}
                            disabled={isSending}
                        />
                        <button 
                            onClick={handleSendMessage} 
                            disabled={!inputMessage.trim() || isSending}
                            className={isSending ? 'sending' : ''}
                        >
                            {isSending ? (
                                <div className="send-loader"></div>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                </svg>
                            )}
                        </button>
                    </div>

                    {showScrollButton && (
                        <button className="scroll-bottom-btn" onClick={() => scrollToBottom(true)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="8 12 12 16 16 12"></polyline>
                                <line x1="12" y1="8" x2="12" y2="16"></line>
                            </svg>
                        </button>
                    )}
                </>
            )}
        </div>
    );
};

export default Chat;
