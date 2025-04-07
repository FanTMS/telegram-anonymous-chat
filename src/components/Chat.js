import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChatById, sendMessage, subscribeToChatUpdates, endChat } from '../utils/chatService';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase';
import { doc, updateDoc, getDoc, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import DatabaseLoadingIndicator from './DatabaseLoadingIndicator';
import '../styles/Chat.css';

const Chat = () => {
    const { chatId } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    
    const [chat, setChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [partnerInfo, setPartnerInfo] = useState({ name: 'Собеседник' });
    const [isPartnerTyping, setIsPartnerTyping] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [dbLoading, setDbLoading] = useState(true);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const chatContainerRef = useRef(null);
    
    // Проверка соединения с базой данных
    useEffect(() => {
        const checkDbConnection = async () => {
            try {
                // Устанавливаем таймаут для проверки
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Таймаут соединения с базой данных')), 10000);
                });

                // Запрос к базе данных
                const dbCheckPromise = getDoc(doc(db, 'system', 'config'));

                // Ждем результат с таймаутом
                await Promise.race([timeoutPromise, dbCheckPromise]);
                setDbLoading(false);
            } catch (error) {
                console.error('Ошибка при проверке подключения к БД:', error);
                setDbLoading(false);
                setError('Ошибка подключения к базе данных. Пожалуйста, проверьте соединение с интернетом и перезагрузите страницу.');
            }
        };

        checkDbConnection();
    }, []);

    // Обработчик завершения загрузки базы данных
    const handleDbLoadComplete = () => {
        setDbLoading(false);
    };

    // Загрузка данных чата
    useEffect(() => {
        const loadChat = async () => {
            if (!isAuthenticated || !user) {
                setError('Необходимо авторизоваться');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                
                // Получение данных чата
                const chatData = await getChatById(chatId);
                
                if (!chatData) {
                    setError('Чат не найден');
                    setLoading(false);
                    return;
                }
                
                // Проверка, является ли пользователь участником чата
                if (!chatData.participants.includes(user.id)) {
                    setError('У вас нет доступа к этому чату');
                    setLoading(false);
                    return;
                }

                setChat(chatData);
                
                // Получение информации о собеседнике
                const partnerId = chatData.participants.find(id => id !== user.id);
                if (partnerId) {
                    try {
                        const partnerRef = doc(db, "users", partnerId);
                        const partnerDoc = await getDoc(partnerRef);
                        
                        if (partnerDoc.exists()) {
                            const partnerData = partnerDoc.data();
                            setPartnerInfo({
                                id: partnerId,
                                name: partnerData.displayName || 'Собеседник',
                                avatar: partnerData.photoURL,
                                lastSeen: partnerData.lastSeen
                            });
                        }
                    } catch (err) {
                        console.error('Ошибка при получении данных собеседника:', err);
                    }
                }
                
                setLoading(false);
            } catch (err) {
                console.error('Ошибка при загрузке чата:', err);
                setError('Не удалось загрузить чат');
                setLoading(false);
            }
        };

        if (!dbLoading) {
            loadChat();
        }
    }, [chatId, user, isAuthenticated, dbLoading]);

    // Подписка на обновления сообщений
    useEffect(() => {
        if (!chatId || !isAuthenticated || dbLoading) return;

        // Запрос на получение сообщений, отсортированных по времени
        const messagesQuery = query(
            collection(db, `chats/${chatId}/messages`),
            orderBy('timestamp', 'asc'),
            limit(100)
        );

        // Создаем подписку на обновления сообщений
        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            const newMessages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate() || new Date()
            }));
            
            setMessages(newMessages);

            // Прокручиваем вниз к последнему сообщению
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        }, (err) => {
            console.error('Ошибка при получении сообщений:', err);
            setError('Не удалось загрузить сообщения');
        });
        
        // Обновляем статус прочтения
        const updateReadStatus = async () => {
            try {
                const chatRef = doc(db, 'chats', chatId);
                const chatDoc = await getDoc(chatRef);
                
                if (chatDoc.exists()) {
                    const chatData = chatDoc.data();
                    const readStatus = chatData.readStatus || {};
                    
                    // Обновляем статус "прочитано" для текущего пользователя
                    readStatus[user.id] = new Date();
                    
                    await updateDoc(chatRef, { readStatus });
                }
            } catch (err) {
                console.error('Ошибка при обновлении статуса прочтения:', err);
            }
        };
        
        updateReadStatus();
        
        // Очистка подписки при размонтировании компонента
        return () => unsubscribe();
    }, [chatId, user, isAuthenticated, dbLoading]);

    // Автопрокрутка при получении новых сообщений
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Отправка сообщения
    const handleSendMessage = async (e) => {
        e.preventDefault();
        
        const messageText = newMessage.trim();
        if (!messageText || !isAuthenticated || !chat || isSending) return;
        
        try {
            setIsSending(true);
            
            // Добавляем сообщение в коллекцию messages для текущего чата
            await addDoc(collection(db, `chats/${chatId}/messages`), {
                text: messageText,
                userId: user.id,
                timestamp: serverTimestamp(),
                isRead: false
            });
            
            // Обновляем данные чата (последнее сообщение, счетчик и т.д.)
            await updateDoc(doc(db, 'chats', chatId), {
                lastMessage: {
                    text: messageText,
                    senderId: user.id,
                    timestamp: serverTimestamp()
                },
                updatedAt: serverTimestamp()
            });
            
            setNewMessage('');
            setIsSending(false);
            
            // Устанавливаем фокус на поле ввода после отправки
            if (inputRef.current) {
                inputRef.current.focus();
            }
        } catch (err) {
            console.error('Ошибка при отправке сообщения:', err);
            setIsSending(false);
        }
    };

    // Завершение чата
    const handleEndChat = async () => {
        if (!chatId || !isAuthenticated) return;

        try {
            await endChat(chatId);
            
            // Обновляем статус чата в Firebase
            await updateDoc(doc(db, 'chats', chatId), {
                isActive: false,
                endedAt: serverTimestamp(),
                endedBy: user.id
            });
            
            navigate('/'); // Переходим на главную страницу
        } catch (err) {
            console.error("Ошибка при завершении чата:", err);
            setError('Не удалось завершить чат');
        }
    };

    // Обработчик ввода сообщения (с отправкой статуса "печатает")
    const handleMessageInput = (e) => {
        setNewMessage(e.target.value);
        
        // Обновляем статус "печатает" в базе данных
        if (chatId && isAuthenticated) {
            try {
                const chatRef = doc(db, 'chats', chatId);
                const typingStatus = {};
                typingStatus[user.id] = true;
                
                updateDoc(chatRef, { 
                    typingStatus: typingStatus,
                    typingTimestamp: serverTimestamp()
                });
                
                // Сбрасываем статус через 2 секунды после остановки набора
                setTimeout(() => {
                    updateDoc(chatRef, { 
                        [`typingStatus.${user.id}`]: false
                    });
                }, 2000);
            } catch (err) {
                console.error('Ошибка при обновлении статуса печати:', err);
            }
        }
    };

    // Отображаем индикатор загрузки базы данных
    if (dbLoading) {
        return <DatabaseLoadingIndicator onComplete={handleDbLoadComplete} />;
    }

    if (loading) {
        return (
            <div className="chat-loading">
                <div className="chat-loading-spinner"></div>
                <p>Загрузка чата...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="chat-error">
                <div className="error-icon">⚠️</div>
                <p>{error}</p>
                <button className="error-back-button" onClick={() => navigate('/')}>
                    Вернуться на главную
                </button>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="chat-error">
                <div className="error-icon">🔒</div>
                <p>Необходимо авторизоваться для доступа к чату</p>
                <button className="error-back-button" onClick={() => navigate('/login')}>
                    Авторизоваться
                </button>
            </div>
        );
    }

    return (
        <div className="chat-container" ref={chatContainerRef}>
            <div className="chat-header">
                <div className="partner-info">
                    <div className="partner-avatar">
                        {partnerInfo.avatar ? (
                            <img src={partnerInfo.avatar} alt="Аватар собеседника" />
                        ) : (
                            <div className="partner-initials">
                                {partnerInfo.name.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="partner-details">
                        <h2>{partnerInfo.name}</h2>
                        {isPartnerTyping ? (
                            <span className="partner-typing">печатает...</span>
                        ) : partnerInfo.lastSeen && (
                            <span className="partner-status">
                                {typeof partnerInfo.lastSeen === 'object' && partnerInfo.lastSeen.seconds
                                    ? `был(а) онлайн ${new Date(partnerInfo.lastSeen.seconds * 1000).toLocaleString()}`
                                    : 'в сети'}
                            </span>
                        )}
                    </div>
                </div>
                <div className="chat-actions">
                    <button className="end-chat-btn" onClick={handleEndChat}>
                        Завершить диалог
                    </button>
                </div>
            </div>

            <div className="chat-messages">
                {messages.length === 0 ? (
                    <div className="no-messages">
                        <div className="no-messages-icon">💬</div>
                        <p>Нет сообщений. Начните общение прямо сейчас!</p>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div
                            key={msg.id || index}
                            className={`message ${msg.userId === user.id ? 'outgoing' : 'incoming'}`}
                        >
                            <div className="message-content">
                                <p>{msg.text}</p>
                                <span className="message-time">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="message-input" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    ref={inputRef}
                    value={newMessage}
                    onChange={handleMessageInput}
                    placeholder="Напишите сообщение..."
                    disabled={!chat || !chat.isActive}
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim() || !chat || !chat.isActive || isSending}
                >
                    {isSending ? (
                        <span className="send-loader"></span>
                    ) : (
                        <span className="send-icon">➤</span>
                    )}
                </button>
            </form>
        </div>
    );
};

export default Chat;
