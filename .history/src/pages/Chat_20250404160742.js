import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { 
  getChatById, 
  getChatMessages, 
  sendChatMessage, 
  addSupportChat 
} from '../utils/chatService';
import UserStatus from '../components/UserStatus';
import '../styles/Chat.css';

const Chat = () => {
    const { chatId } = useParams();
    const { user } = useAuth();
    
    const [chat, setChat] = useState(null);
    const [partnerInfo, setPartnerInfo] = useState({});
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState(null);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [showActionsMenu, setShowActionsMenu] = useState(false);
    const [isPartnerTyping, setIsPartnerTyping] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const inputRef = useRef(null);
    const navigate = useNavigate();

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
                
                const chatDetails = await getChatById(chatId);
                setChat(chatDetails);
                
                if (chatDetails.type === 'support') {
                    setPartnerInfo({
                        name: 'Техническая поддержка',
                        isOnline: true,
                        profilePicture: null,
                        lastSeen: null,
                        isSupportChat: true
                    });
                } else {
                    // Для обычных чатов - получаем информацию о собеседнике
                }
                
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
    }, [chatId, user]);

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

    const toggleActionsMenu = () => {
        setShowActionsMenu(prev => !prev);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || !chatId || !user) return;

        try {
            setSendingMessage(true);
            
            const tempMessage = {
                id: `temp-${Date.now()}`,
                text: inputMessage.trim(),
                senderId: user.telegramId || user.id,
                timestamp: Date.now(),
                isTemp: true
            };
            
            setMessages(prev => [...prev, tempMessage]);
            setInputMessage('');
            scrollToBottom();
            
            const isSupportChat = chat?.type === 'support';
            
            if (isSupportChat) {
                await addSupportChat(user.telegramId || user.id, tempMessage.text);
            } else {
                await sendChatMessage(chatId, user.telegramId || user.id, tempMessage.text);
            }
            
            const updatedMessages = await getChatMessages(chatId);
            setMessages(updatedMessages);
            
        } catch (error) {
            console.error('Ошибка при отправке сообщения:', error);
            setMessages(prev => prev.filter(msg => !msg.isTemp));
            alert('Не удалось отправить сообщение. Пожалуйста, попробуйте еще раз.');
        } finally {
            setSendingMessage(false);
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <button className="back-button" onClick={handleBackClick}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
                <div className="partner-avatar">
                    {chat?.type === 'support' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12h-8v8h8v-8z"></path>
                            <path d="M3 12h8V4H3v8z"></path>
                            <path d="M3 20h8v-4H3v4z"></path>
                            <path d="M17 4h4v4h-4V4z"></path>
                        </svg>
                    ) : (
                        getInitials(partnerInfo.name)
                    )}
                </div>
                <div className="partner-info">
                    <h2 className="partner-name">
                        {chat?.type === 'support' ? 'Техническая поддержка' : partnerInfo.name}
                    </h2>
                    <div className="partner-status">
                        <UserStatus 
                            isOnline={partnerInfo.isOnline} 
                            lastSeen={partnerInfo.lastSeen}
                            isSupportChat={chat?.type === 'support'} 
                        />
                    </div>
                </div>
                <div className="chat-actions">
                    <button className="chat-actions-button" onClick={toggleActionsMenu}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="1"></circle>
                            <circle cx="12" cy="5" r="1"></circle>
                            <circle cx="12" cy="19" r="1"></circle>
                        </svg>
                    </button>
                </div>
            </div>

            <div className="messages-container" ref={messagesContainerRef}>
                {messages.length === 0 ? (
                    <div className="no-messages">
                        <span className="no-messages-icon">💬</span>
                        <p>Нет сообщений. Начните общение прямо сейчас!</p>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div
                            key={msg.id || `msg-${index}`}
                            className={`message ${msg.senderId === user.telegramId ? 'my-message' : 'partner-message'} ${msg.isFromSupport || msg.senderId === 'support' ? 'support-message' : ''}`}
                        >
                            <div className="message-bubble">
                                {(msg.isFromSupport || msg.senderId === 'support') && (
                                    <div className="message-sender">
                                        <svg className="support-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 12h-8v8h8v-8z"></path>
                                            <path d="M3 12h8V4H3v8z"></path>
                                            <path d="M3 20h8v-4H3v4z"></path>
                                            <path d="M17 4h4v4h-4V4z"></path>
                                        </svg>
                                        Техническая поддержка
                                    </div>
                                )}
                                <p className="message-text">{msg.text}</p>
                                <span className="message-time">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))
                )}
                {isPartnerTyping && (
                    <div className={`typing-indicator ${chat?.type === 'support' ? 'support-typing' : ''}`}>
                        {chat?.type === 'support' ? 'Техническая поддержка' : partnerInfo.name} печатает
                        <div className="typing-dots">
                            <span className="typing-dot"></span>
                            <span className="typing-dot"></span>
                            <span className="typing-dot"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {showScrollButton && (
                <div className="scrollToBottom" onClick={() => scrollToBottom(true)}></div>
            )}

            <form className="message-input-form" onSubmit={handleSendMessage}>
                <div className="message-input-container">
                    <input
                        type="text"
                        ref={inputRef}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Введите сообщение..."
                        className="message-input"
                        autoComplete="off"
                        onFocus={() => setIsInputFocused(true)}
                        onBlur={() => setIsInputFocused(false)}
                    />
                    <button
                        type="submit"
                        className="send-button"
                        disabled={!inputMessage.trim() || sendingMessage}
                        aria-label="Отправить сообщение"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Chat;
