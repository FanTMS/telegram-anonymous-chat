import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChatById, sendChatMessage, subscribeToChatUpdates, endChat } from '../utils/chatService';
import { useAuth } from '../hooks/useAuth';
import ChatHeader from './ChatHeader';
import { db } from '../firebase';
import { doc, updateDoc, getDoc, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, limit, where } from 'firebase/firestore';
import DatabaseLoadingIndicator from './DatabaseLoadingIndicator';
import ChatMessage from './ChatMessage';
import MessageInput from './MessageInput';
import styled, { keyframes } from 'styled-components';
import '../styles/Chat.css';

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: relative;
  background-color: var(--tg-theme-bg-color, #ffffff);
  animation: ${fadeIn} 0.3s ease;
  width: 100%;
  max-width: 768px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    width: 100%;
    max-width: 768px;
    margin: 0 auto;
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
  padding-top: 76px; /* Account for header height */
  padding-bottom: 70px;
  scroll-behavior: smooth;
  background-color: #f5f7fb;
  background-image: ${props => props.isSupportChat ? 
    `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%233390ec' fill-opacity='0.02' fill-rule='evenodd'/%3E%3C/svg%3E")` : 
    'none'};
  height: 100%;
  width: 100%;
  max-width: 768px;
  margin: 0 auto;
  
  &::-webkit-scrollbar {
    width: 5px;
  }
  
  &::-webkit-scrollbar-track {
    background-color: rgba(0, 0, 0, 0.05);
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: var(--tg-theme-button-color, rgba(0, 0, 0, 0.2));
    border-radius: 3px;
  }
  
  @media (max-width: 767px) {
    width: 100%;
    max-width: 768px;
  }
`;

const ChatEndedWrapper = styled.div`
  background-color: rgba(51, 144, 236, 0.08);
  padding: 10px 0;
  margin: 15px 0;
  border-radius: 10px;
  text-align: center;
  animation: ${fadeIn} 0.5s ease;
  max-width: 90%;
  margin-left: auto;
  margin-right: auto;
`;

const NoMessages = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50%;
  color: var(--tg-theme-hint-color, #999);
  text-align: center;
  padding: 20px;
  animation: ${fadeIn} 0.5s ease;
`;

const NoMessagesIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.6;
`;

const ErrorView = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
  padding: 20px;
  color: var(--tg-theme-text-color, #333);
  animation: ${fadeIn} 0.3s ease;
`;

const ErrorIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const ErrorButton = styled.button`
  margin-top: 20px;
  padding: 10px 20px;
  background-color: var(--tg-theme-button-color, #3390EC);
  color: var(--tg-theme-button-text-color, #fff);
  border: none;
  border-radius: 10px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: var(--tg-theme-button-color, #2980b9);
  }
`;

const LoadingView = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
  color: var(--tg-theme-text-color, #333);
  animation: ${fadeIn} 0.3s ease;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  margin-bottom: 20px;
  border: 4px solid var(--tg-theme-bg-color, rgba(0, 0, 0, 0.1));
  border-radius: 50%;
  border-top-color: var(--tg-theme-button-color, #3390EC);
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const RatingMessage = ({ onRate }) => {
    return (
        <ChatMessage 
            message={{
                id: 'rating-request',
                text: 'Пожалуйста, оцените качество поддержки',
                timestamp: new Date(),
                isSystem: true
            }}
            isOutgoing={false}
        />
    );
};

const DateSeparator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px 0 10px;
  color: #8e9398;
  font-size: 13px;
  position: relative;
  
  &:before {
    content: "";
    position: absolute;
    height: 1px;
    background-color: rgba(0, 0, 0, 0.1);
    width: 100%;
    top: 50%;
    z-index: 1;
  }
  
  span {
    background-color: #f5f7fb;
    padding: 0 10px;
    position: relative;
    z-index: 2;
    font-weight: 500;
  }
`;

const Chat = () => {
    const { chatId } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated, isAdmin } = useAuth();
    const userId = user?.uid || user?.id;
    
    const [chat, setChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [partnerInfo, setPartnerInfo] = useState({ name: 'Собеседник' });
    const [isPartnerTyping, setIsPartnerTyping] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [dbLoading, setDbLoading] = useState(true);
    const [chatEnded, setChatEnded] = useState(false);

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    
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
                
                // Проверяем, завершен ли чат
                if (chatData.status === 'ended' || chatData.status === 'resolved') {
                    setChatEnded(true);
                }
                
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

            // Проверка на системные сообщения о завершении чата
            const endedMessages = newMessages.filter(
                msg => msg.type === 'system' && 
                (msg.text.includes('Чат был завершен') || msg.text.includes('закрыто специалистом'))
            );
            
            if (endedMessages.length > 0) {
                setChatEnded(true);
            }

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
    const handleSendMessage = async (messageText) => {
        if (!messageText || !isAuthenticated || !chat || isSending || chatEnded) return;
        
        try {
            setIsSending(true);
            
            // Используем функцию sendChatMessage из chatService
            await sendChatMessage(chatId, userId, messageText);
            
            setIsSending(false);
            
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
                
                setChatEnded(true);
            }
        } catch (error) {
            console.error('Error ending chat:', error);
            setError('Не удалось завершить чат. Попробуйте позже.');
        }
    };

    // Обработчик статуса набора текста
    const handleTypingStatus = (isTyping) => {
        // Обновляем статус "печатает" в базе данных
        if (chatId && isAuthenticated) {
            try {
                const chatRef = doc(db, 'chats', chatId);
                const typingStatus = {};
                typingStatus[userId] = isTyping;
                
                updateDoc(chatRef, { 
                    typingStatus: typingStatus,
                    typingTimestamp: serverTimestamp()
                });
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
    
    // Группировка сообщений по дате
    const groupMessagesByDate = () => {
        const groups = [];
        let currentDate = null;
        let currentGroup = [];
        
        messages.forEach(message => {
            const messageDate = new Date(message.timestamp);
            const dateStr = messageDate.toDateString();
            
            if (currentDate !== dateStr) {
                if (currentGroup.length > 0) {
                    groups.push({
                        date: currentDate,
                        messages: currentGroup
                    });
                }
                currentDate = dateStr;
                currentGroup = [message];
            } else {
                currentGroup.push(message);
            }
        });
        
        if (currentGroup.length > 0) {
            groups.push({
                date: currentDate,
                messages: currentGroup
            });
        }
        
        return groups;
    };
    
    // Форматирование даты для разделителя
    const formatDateSeparator = (dateStr) => {
        const date = new Date(dateStr);
        const now = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === now.toDateString()) {
            return 'Сегодня';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Вчера';
        } else {
            const options = { day: 'numeric', month: 'long', year: 'numeric' };
            return date.toLocaleDateString('ru-RU', options);
        }
    };

    // Отображаем индикатор загрузки базы данных
    if (dbLoading) {
        return <DatabaseLoadingIndicator onComplete={handleDbLoadComplete} />;
    }

    if (loading) {
        return (
            <LoadingView>
                <LoadingSpinner />
                <p>Загрузка чата...</p>
            </LoadingView>
        );
    }

    if (error) {
        return (
            <ErrorView>
                <ErrorIcon>⚠️</ErrorIcon>
                <p>{error}</p>
                <ErrorButton onClick={() => navigate('/')}>
                    Вернуться на главную
                </ErrorButton>
            </ErrorView>
        );
    }

    if (!isAuthenticated) {
        return (
            <ErrorView>
                <ErrorIcon>🔒</ErrorIcon>
                <p>Необходимо авторизоваться для доступа к чату</p>
                <ErrorButton onClick={() => navigate('/login')}>
                    Авторизоваться
                </ErrorButton>
            </ErrorView>
        );
    }
    
    const messageGroups = groupMessagesByDate();

    return (
        <ChatContainer>
            <ChatHeader
                partnerInfo={partnerInfo}
                isPartnerTyping={isPartnerTyping}
                isSupportChat={isSupportChat}
                onEndChat={handleEndChat}
                isAdmin={isAdmin}
                chatEnded={chatEnded}
            />

            <MessagesContainer ref={messagesContainerRef} isSupportChat={isSupportChat}>
                {messages.length === 0 ? (
                    <NoMessages>
                        <NoMessagesIcon>💬</NoMessagesIcon>
                        <p>Нет сообщений. Начните общение прямо сейчас!</p>
                    </NoMessages>
                ) : (
                    <>
                        {messageGroups.map((group, groupIndex) => (
                            <React.Fragment key={`group-${groupIndex}`}>
                                <DateSeparator>
                                    <span>{formatDateSeparator(group.date)}</span>
                                </DateSeparator>
                                
                                {group.messages.map((message, index) => {
                                    if (message.type === 'rating_request' && chat?.waitingForRating) {
                                        return <RatingMessage key={message.id || index} onRate={handleRating} />;
                                    }

                                    const isOutgoing = message.senderId === userId;
                                    const messageStatus = isOutgoing ? 
                                        (message.isRead ? 'read' : message.isDelivered ? 'delivered' : 'sent') : 
                                        null;
                                        
                                    if (message.type === 'system' && 
                                        (message.text.includes('Чат был завершен') || message.text.includes('закрыто специалистом'))) {
                                        return (
                                            <ChatEndedWrapper key={message.id || index}>
                                                <ChatMessage
                                                    message={{
                                                        id: message.id || index,
                                                        text: message.text,
                                                        timestamp: message.timestamp || message.createdAt || message.clientTimestamp || new Date(),
                                                        isSystem: true
                                                    }}
                                                    isOutgoing={false}
                                                />
                                            </ChatEndedWrapper>
                                        );
                                    }

                                    return (
                                        <ChatMessage
                                            key={message.id || index}
                                            message={{
                                                id: message.id || index,
                                                text: message.text,
                                                imageUrl: message.imageUrl,
                                                timestamp: message.timestamp || message.createdAt || message.clientTimestamp || new Date(),
                                                isSticker: message.isSticker,
                                                isSystem: message.type === 'system'
                                            }}
                                            isOutgoing={isOutgoing}
                                            status={messageStatus}
                                        />
                                    );
                                })}
                            </React.Fragment>
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </MessagesContainer>

            <MessageInput
                onSendMessage={handleSendMessage}
                disabled={!chat || !chat.isActive || chatEnded}
                placeholder={chatEnded ? "Чат завершен" : "Напишите сообщение..."}
                onTyping={handleTypingStatus}
            />
        </ChatContainer>
    );
};

export default Chat;
