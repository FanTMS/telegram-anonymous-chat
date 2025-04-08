import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChatById, sendChatMessage, subscribeToChatUpdates, endChat } from '../utils/chatService';
import { useAuth } from '../hooks/useAuth';
import ChatHeader from './ChatHeader';
import { db } from '../firebase';
import { doc, updateDoc, getDoc, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, limit, where } from 'firebase/firestore';
import DatabaseLoadingIndicator from './DatabaseLoadingIndicator';
import '../styles/Chat.css';
import styled from 'styled-components';
import Message from './Message';
import ChatInput from './ChatInput';

const ChatContainer = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 100%;
    overflow: hidden;
    background-color: var(--tg-theme-bg-color);
`;

const MessagesContainer = styled.div`
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: var(--app-spacing-sm);
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-y: contain;
    scroll-behavior: smooth;
    
    /* Hide scrollbar for Chrome, Safari and Opera */
    &::-webkit-scrollbar {
        display: none;
    }
    
    /* Hide scrollbar for IE, Edge and Firefox */
    -ms-overflow-style: none;
    scrollbar-width: none;
`;

const InputWrapper = styled.div`
    padding: var(--app-spacing-sm);
    background-color: var(--tg-theme-bg-color);
    border-top: 1px solid var(--tg-theme-secondary-bg-color);
    position: relative;
    z-index: 2;
    flex-shrink: 0;
`;

const RatingMessage = ({ onRate }) => {
    return (
        <div className="message system rating-request">
            <div className="message-content">
                <div className="message-text">
                    Пожалуйста, оцените качество поддержки
                </div>
                <div className="rating-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            className="rating-star"
                            onClick={() => onRate(star)}
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
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const Chat = () => {
    const { chatId } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated, isAdmin } = useAuth();
    const userId = user?.uid || user?.id;
    
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
    
    // Определяем, является ли чат чатом технической поддержки
    const isSupportChat = chat?.type === 'support';

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
                if (!chatData.participants.includes(userId)) {
                    setError('У вас нет доступа к этому чату');
                    setLoading(false);
                    return;
                }

                setChat(chatData);
                
                // Получение информации о собеседнике
                const partnerId = chatData.participants.find(id => id !== userId);
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
    }, [chatId, user, isAuthenticated, dbLoading, userId]);

    // Подписка на обновления сообщений
    useEffect(() => {
        if (!chatId || !isAuthenticated || dbLoading) return;

        // Запрос на получение сообщений, отсортированных по времени
        const messagesQuery = query(
            collection(db, "messages"),
            where("chatId", "==", chatId),
            orderBy('timestamp', 'desc'),
            limit(100)
        );

        // Создаем подписку на обновления сообщений
        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            const newMessages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate() || doc.data().clientTimestamp || new Date()
            })).sort((a, b) => a.timestamp - b.timestamp); // Сортируем по времени
            
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
                    readStatus[userId] = new Date();
                    
                    await updateDoc(chatRef, { readStatus });
                }
            } catch (err) {
                console.error('Ошибка при обновлении статуса прочтения:', err);
            }
        };
        
        updateReadStatus();
        
        // Очистка подписки при размонтировании компонента
        return () => unsubscribe();
    }, [chatId, user, isAuthenticated, dbLoading, userId]);

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
            
            // Используем функцию sendChatMessage из chatService
            await sendChatMessage(chatId, userId, messageText);
            
            // После успешной отправки очищаем поле ввода
            setNewMessage('');
            setIsSending(false);
            
            // Устанавливаем фокус на поле ввода после отправки
            if (inputRef.current) {
                inputRef.current.focus();
            }
            
            // Прокручиваем чат вниз к последнему сообщению
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        } catch (err) {
            console.error('Ошибка при отправке сообщения:', err);
            setIsSending(false);
        }
    };

    // Завершение чата
    const handleEndChat = async () => {
        try {
            // Для обычных чатов - стандартное завершение
            if (!isSupportChat) {
                await endChat(chatId);
                navigate('/chats');
                return;
            }

            // Для чата поддержки - только админ может завершить
            if (isSupportChat && isAdmin) {
                const chatRef = doc(db, 'chats', chatId);
                await updateDoc(chatRef, {
                    status: 'resolved',
                    resolvedAt: serverTimestamp(),
                    resolvedBy: userId
                });

                // Добавляем системное сообщение о завершении
                await addDoc(collection(db, 'chats', chatId, 'messages'), {
                    type: 'system',
                    text: 'Обращение закрыто специалистом поддержки',
                    createdAt: serverTimestamp()
                });
            }
        } catch (error) {
            console.error('Error ending chat:', error);
            setError('Не удалось завершить чат. Попробуйте позже.');
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
                typingStatus[userId] = true;
                
                updateDoc(chatRef, { 
                    typingStatus: typingStatus,
                    typingTimestamp: serverTimestamp()
                });
                
                // Сбрасываем статус через 2 секунды после остановки набора
                setTimeout(() => {
                    updateDoc(chatRef, { 
                        [`typingStatus.${userId}`]: false
                    });
                }, 2000);
            } catch (err) {
                console.error('Ошибка при обновлении статуса печати:', err);
            }
        }
    };

    const handleRating = async (rating) => {
        try {
            const chatRef = doc(db, 'chats', chatId);
            await updateDoc(chatRef, {
                rating,
                waitingForRating: false,
                ratedAt: serverTimestamp()
            });

            // Добавляем сообщение с оценкой
            await addDoc(collection(db, 'chats', chatId, 'messages'), {
                type: 'system',
                text: `Вы оценили качество поддержки на ${rating} ${rating === 1 ? 'звезду' : 
                    rating < 5 ? 'звезды' : 'звёзд'}`,
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error rating chat:', error);
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
        <ChatContainer ref={chatContainerRef}>
            <ChatHeader
                partnerInfo={partnerInfo}
                isPartnerTyping={isPartnerTyping}
                isSupportChat={isSupportChat}
                onEndChat={handleEndChat}
                isAdmin={isAdmin}
            />

            <MessagesContainer>
                {messages.length === 0 ? (
                    <div className="no-messages">
                        <div className="no-messages-icon">💬</div>
                        <p>Нет сообщений. Начните общение прямо сейчас!</p>
                    </div>
                ) : (
                    messages.map((message, index) => {
                        if (message.type === 'rating_request' && chat?.waitingForRating) {
                            return <RatingMessage key={message.id || index} onRate={handleRating} />;
                        }

                        return (
                            <Message
                                key={message.id || index}
                                message={message}
                                isLastMessage={index === messages.length - 1}
                            />
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </MessagesContainer>

            <InputWrapper>
                <ChatInput
                    onSendMessage={handleSendMessage}
                    onMessageInput={handleMessageInput}
                    newMessage={newMessage}
                    isSending={isSending}
                    isDisabled={!chat || !chat.isActive}
                />
            </InputWrapper>
        </ChatContainer>
    );
};

export default Chat;
