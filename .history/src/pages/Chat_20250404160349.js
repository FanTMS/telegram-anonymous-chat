import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { safeHapticFeedback } from '../utils/telegramUtils';
import useAuth from '../hooks/useAuth';
import { getChatDetails, getChatMessages, sendChatMessage, reportUser, blockUser, addSupportChat } from '../utils/chatService';
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
    const [sendingMessage, setSendingMessage] = useState(false);

    const messagesContainerRef = useRef(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const loadChatDetails = async () => {
            try {
                if (!chatId || !user) return;
                
                setIsLoading(true);
                setError(null);
                
                const chatDetails = await getChatDetails(chatId);
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

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
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
                {chat?.isSupportChat || chat?.type === 'support' ? (
                    <>
                        <svg className="support-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12h-8v8h8v-8z"></path>
                            <path d="M3 12h8V4H3v8z"></path>
                            <path d="M3 20h8v-4H3v4z"></path>
                            <path d="M17 4h4v4h-4V4z"></path>
                        </svg>
                        Техническая поддержка
                    </>
                ) : (
                    partnerInfo.name
                )}
            </div>
            <div className="messages-container" ref={messagesContainerRef}>
                {messages.length === 0 ? (
                    <div className="no-messages">
                        <div className="no-messages-icon">💬</div>
                        <p>Напишите первое сообщение, чтобы начать общение</p>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`message ${msg.senderId === user.telegramId ? 'my-message' : 'partner-message'} ${msg.senderId === 'support' ? 'support-message' : ''}`}
                        >
                            <div className="message-bubble">
                                <p className="message-text">{msg.text}</p>
                                <span className="message-time">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

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
                    />
                    <button
                        type="submit"
                        className="send-button"
                        disabled={!inputMessage.trim()}
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
