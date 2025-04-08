import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../utils/dateUtils';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import '../styles/AdminChat.css';

const AdminSupportChat = ({ chat, messages, onSendMessage, onClose }) => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim()) {
            onSendMessage(newMessage);
            setNewMessage('');
        }
    };

    const handleEndChat = async () => {
        try {
            const chatRef = doc(db, 'chats', chat.id);
            await updateDoc(chatRef, {
                status: 'resolved',
                resolvedAt: serverTimestamp(),
                waitingForRating: true
            });

            // Добавляем системное сообщение о завершении чата
            await addDoc(collection(db, 'chats', chat.id, 'messages'), {
                type: 'system',
                text: 'Обращение закрыто специалистом поддержки',
                createdAt: serverTimestamp()
            });

            // Добавляем сообщение с запросом оценки
            await addDoc(collection(db, 'chats', chat.id, 'messages'), {
                type: 'rating_request',
                text: 'Пожалуйста, оцените качество поддержки от 1 до 5 звезд',
                createdAt: serverTimestamp()
            });

            navigate('/admin');
        } catch (error) {
            console.error('Error ending chat:', error);
        }
    };

    return (
        <div className="admin-support-chat">
            <div className="admin-chat-header">
                <div className="chat-info">
                    <div className="chat-number">
                        {chat.number || '#'}
                    </div>
                    <div className="chat-details">
                        <h2>Поддержка</h2>
                        <div className="chat-date">
                            Чат создан: {formatDate(chat.createdAt)}
                        </div>
                    </div>
                </div>
                <div className="header-actions">
                    <button 
                        className="end-chat-button admin"
                        onClick={handleEndChat}
                    >
                        <svg 
                            width="20" 
                            height="20" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="1.75" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                        >
                            <path d="M5 13l4 4L19 7"/>
                        </svg>
                        <span>Завершить обращение</span>
                    </button>
                    <button 
                        className="back-to-panel"
                        onClick={() => navigate('/admin')}
                    >
                        Назад в Панель
                    </button>
                </div>
            </div>

            <div className="admin-chat-messages">
                {messages.map((message, index) => (
                    <div 
                        key={message.id || index}
                        className={`message ${
                            message.type === 'system' ? 'system' : 
                            message.type === 'rating_request' ? 'system rating-request' :
                            message.senderId === chat.userId ? 'user' : 'admin'
                        }`}
                    >
                        <div className="message-content">
                            {message.type !== 'system' && message.type !== 'rating_request' && (
                                <div className="message-sender">
                                    {message.senderId === chat.userId ? 'Пользователь' : 'Поддержка'}
                                </div>
                            )}
                            <div className="message-text">{message.text}</div>
                            {message.type !== 'rating_request' && (
                                <div className="message-time">
                                    {formatDate(message.createdAt, true)}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form className="admin-chat-input" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Введите сообщение..."
                />
                <button 
                    type="submit" 
                    className="send-button"
                    disabled={!newMessage.trim()}
                >
                    <svg 
                        width="24" 
                        height="24" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                    >
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                    </svg>
                </button>
            </form>
        </div>
    );
};

export default AdminSupportChat; 