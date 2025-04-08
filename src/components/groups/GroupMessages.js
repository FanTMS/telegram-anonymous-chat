import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { getGroupMessages, sendGroupMessage, joinGroup } from '../../services/groupService';
import { formatMessageTime } from '../../utils/dateUtils';
import connectionService from '../../utils/firebaseConnectionService';

const MessagesContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  background-color: var(--tg-theme-bg-color, #fff);
`;

const MessagesList = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  scroll-behavior: smooth;
  padding-bottom: calc(16px + var(--safe-area-inset-bottom, 0px) + 60px);
  
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--tg-theme-hint-color, rgba(0, 0, 0, 0.2));
    border-radius: 3px;
  }
`;

const InputArea = styled.form`
  display: flex;
  padding: 8px 16px;
  background-color: var(--tg-theme-bg-color, #fff);
  border-top: 1px solid var(--tg-theme-secondary-bg-color, rgba(0, 0, 0, 0.05));
  position: sticky;
  bottom: 0;
  padding-bottom: calc(16px + var(--safe-area-inset-bottom, 0px));
  z-index: 2;
`;

const MessageInput = styled.input`
  flex: 1;
  border: 1px solid var(--tg-theme-hint-color, rgba(0, 0, 0, 0.2));
  border-radius: 18px;
  padding: 10px 16px;
  font-size: 14px;
  background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
  color: var(--tg-theme-text-color, #000);

  &:focus {
    outline: none;
    border-color: var(--tg-theme-button-color, #2481cc);
  }
`;

const SendButton = styled.button`
  background-color: var(--tg-theme-button-color, #2481cc);
  color: var(--tg-theme-button-text-color, #fff);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  margin-left: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const MessageItem = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 80%;
  align-self: ${props => props.$isMine ? 'flex-end' : 'flex-start'};
  background-color: ${props => props.$isMine
        ? 'var(--tg-theme-button-color, #2481cc)'
        : 'var(--tg-theme-secondary-bg-color, #f0f0f0)'};
  color: ${props => props.$isMine
        ? 'var(--tg-theme-button-text-color, #fff)'
        : 'var(--tg-theme-text-color, #000)'};
  border-radius: ${props => props.$isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px'};
  padding: 8px 12px;
  position: relative;
  word-break: break-word;
  margin-bottom: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  opacity: ${props => props.$pending ? 0.7 : 1};
  transition: opacity 0.3s ease;
  
  &::after {
    content: ${props => props.$pending ? '"⌛"' : 'none'};
    position: absolute;
    bottom: 4px;
    right: ${props => props.$isMine ? '-20px' : 'auto'};
    left: ${props => props.$isMine ? 'auto' : '-20px'};
    font-size: 12px;
    opacity: 0.7;
  }
`;

const MessageHeader = styled.div`
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 4px;
  color: ${props => props.$isMine
        ? 'rgba(255, 255, 255, 0.9)'
        : 'var(--tg-theme-accent-color, #2481cc)'};
`;

const MessageText = styled.div`
  font-size: 15px;
  line-height: 1.4;
`;

const MessageTime = styled.div`
  font-size: 11px;
  opacity: 0.7;
  text-align: right;
  margin-top: 4px;
  margin-left: auto;
`;

const SystemMessage = styled.div`
  align-self: center;
  background-color: var(--tg-theme-secondary-bg-color, rgba(0, 0, 0, 0.05));
  color: var(--tg-theme-hint-color, #999);
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 13px;
  max-width: 90%;
  text-align: center;
  margin: 8px 0;
`;

const DateDivider = styled.div`
  display: flex;
  align-items: center;
  margin: 16px 0;
  color: var(--tg-theme-hint-color, #999);
  font-size: 12px;
  text-align: center;
  
  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background-color: var(--tg-theme-hint-color, rgba(0, 0, 0, 0.1));
  }
  
  &::before {
    margin-right: 16px;
  }
  
  &::after {
    margin-left: 16px;
  }
`;

const ErrorContainer = styled.div`
  padding: 16px;
  text-align: center;
  color: var(--tg-theme-destructive-color, #ff3b30);
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: var(--tg-theme-hint-color, #999);
`;

const EmptyMessagesContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 20px;
  color: var(--tg-theme-hint-color, #999);
  text-align: center;
  
  svg {
    width: 64px;
    height: 64px;
    margin-bottom: 16px;
    fill: var(--tg-theme-hint-color, rgba(0, 0, 0, 0.2));
  }
`;

const GroupMessages = ({ groupId, user, isMember }) => {
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const messagesEndRef = useRef(null);

    const formatDateForDivider = (date) => {
        if (!date) return '';

        try {
            let messageDate;
            if (date instanceof Date) {
                messageDate = date;
            } else if (typeof date === 'object' && date.toDate) {
                messageDate = date.toDate();
            } else if (typeof date === 'object' && date.seconds) {
                messageDate = new Date(date.seconds * 1000);
            } else if (typeof date === 'number') {
                messageDate = new Date(date);
            } else if (typeof date === 'string') {
                messageDate = new Date(date);
            } else {
                return '';
            }

            if (isNaN(messageDate.getTime())) return '';

            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            if (messageDate.getDate() === today.getDate() &&
                messageDate.getMonth() === today.getMonth() &&
                messageDate.getFullYear() === today.getFullYear()) {
                return 'Сегодня';
            } else if (messageDate.getDate() === yesterday.getDate() &&
                messageDate.getMonth() === yesterday.getMonth() &&
                messageDate.getFullYear() === yesterday.getFullYear()) {
                return 'Вчера';
            } else {
                const options = { day: 'numeric', month: 'long', year: 'numeric' };
                return messageDate.toLocaleDateString('ru-RU', options);
            }
        } catch (err) {
            console.error('Ошибка форматирования даты:', err);
            return '';
        }
    };

    const getMessagesWithDividers = (messages) => {
        if (!messages || messages.length === 0) return [];

        const result = [];
        let currentDate = null;
        let dividerCounter = 0;

        for (const msg of messages) {
            const messageDate = formatDateForDivider(msg.createdAt);

            if (messageDate && messageDate !== currentDate) {
                currentDate = messageDate;
                dividerCounter++;
                result.push({
                    id: `divider-${currentDate}-${dividerCounter}`,
                    type: 'divider',
                    text: currentDate
                });
            }

            result.push({
                ...msg,
                type: 'message'
            });
        }

        return result;
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadMessages = async () => {
        if (!groupId) return;

        setIsLoading(true);
        setError(null);

        if (!navigator.onLine || !connectionService.isConnected) {
            setError('Нет соединения с интернетом или базой данных. Сообщения могут быть устаревшими.');
            setIsOffline(true);
        }

        try {
            const fetchedMessages = await getGroupMessages(groupId);
            if (Array.isArray(fetchedMessages)) {
                // Sort messages with oldest first
                const sortedMessages = [...fetchedMessages].sort((a, b) => {
                    const getTime = (item) => {
                        if (!item || !item.createdAt) return 0;
                        if (typeof item.createdAt.toMillis === 'function') return item.createdAt.toMillis();
                        if (typeof item.createdAt.getTime === 'function') return item.createdAt.getTime();
                        if (typeof item.createdAt === 'number') return item.createdAt;
                        return 0;
                    };
                    return getTime(a) - getTime(b); // Oldest first
                });
                
                setMessages(sortedMessages);
            } else {
                setMessages([]);
                setError('Не удалось загрузить сообщения. Получен неверный формат данных.');
            }
        } catch (err) {
            console.error('Ошибка при загрузке сообщений группы:', err);
            setError('Не удалось загрузить сообщения. Пожалуйста, попробуйте позже.');
        } finally {
            setIsLoading(false);
            
            // Scroll to bottom after loading messages
            setTimeout(() => {
                scrollToBottom();
            }, 100);
        }
    };

    useEffect(() => {
        const handleConnectionStatus = (status) => {
            setIsOffline(!status.connected);

            if (status.connected) {
                loadMessages();
            }
        };

        connectionService.addConnectionListener(handleConnectionStatus);

        return () => {
            connectionService.removeConnectionListener(handleConnectionStatus);
        };
    }, []);

    useEffect(() => {
        loadMessages();
    }, [groupId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (messageText) => {
        if (!messageText.trim() || !user?.id || !groupId) {
            console.error("Cannot send message: missing required data", { 
                hasMessage: !!messageText.trim(), 
                hasUserId: !!user?.id, 
                hasGroupId: !!groupId 
            });
            return;
        }

        // Проверяем соединение перед отправкой
        if (!navigator.onLine || !connectionService.isConnected) {
            alert('Нет соединения с интернетом или базой данных. Сообщение будет отправлено, когда соединение восстановится.');
            return;
        }

        setIsSending(true);

        try {
            // Создаем временный ID для сообщения
            const tempId = `temp-${Date.now()}`;
            
            // Добавляем сообщение локально для мгновенного отображения
            const tempMessage = {
                id: tempId,
                senderId: user.id,
                senderName: user.name || "Вы",
                text: messageText,
                createdAt: new Date(),
                pending: true,
                groupId
            };

            setMessages(prevMessages => [...prevMessages, tempMessage]);
            
            // Плавная прокрутка к новому сообщению
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 50);

            // Формируем данные сообщения для отправки
            const messageData = {
                senderId: user.id,
                senderName: user.name || "Вы",
                text: messageText
            };
            
            console.log('Sending message to group:', groupId, 'Message data:', messageData);
            
            // Отправляем сообщение на сервер
            const sentMessage = await sendGroupMessage(groupId, messageData);
            console.log('Message sent successfully:', sentMessage);

            // Заменяем временное сообщение на подтвержденное
            setMessages(prevMessages => 
                prevMessages.map(msg => 
                    msg.id === tempId 
                        ? { ...sentMessage, pending: false } 
                        : msg
                )
            );
        } catch (error) {
            console.error("Ошибка при отправке сообщения в группу:", groupId, error);
            setError(error.message || "Не удалось отправить сообщение");

            // Убираем временное сообщение при ошибке
            setMessages(prevMessages =>
                prevMessages.filter(msg => !msg.id.startsWith('temp-'))
            );
        } finally {
            setIsSending(false);
        }
    };

    const messagesWithDividers = getMessagesWithDividers(messages);

    if (isLoading) {
        return (
            <MessagesContainer>
                <LoadingContainer>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ animation: 'spin 1s linear infinite' }}>
                        <style dangerouslySetInnerHTML={{
                            __html: `
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}} />
                        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor" opacity="0.3" />
                        <path d="M12 2V4C16.41 4 20 7.59 20 12H22C22 6.48 17.52 2 12 2Z" fill="currentColor" />
                    </svg>
                    <span style={{ marginLeft: '8px' }}>Загрузка сообщений...</span>
                </LoadingContainer>
            </MessagesContainer>
        );
    }

    return (
        <MessagesContainer>
            {isOffline && (
                <div style={{
                    padding: '8px 16px',
                    backgroundColor: '#FFF3CD',
                    color: '#856404',
                    textAlign: 'center',
                    fontSize: '13px'
                }}>
                    Нет соединения с базой данных. Некоторые функции могут быть недоступны.
                </div>
            )}

            <MessagesList>
                {error && (
                    <ErrorContainer>{error}</ErrorContainer>
                )}

                <AnimatePresence>
                    {messagesWithDividers.length === 0 && !isLoading && (
                        <EmptyMessagesContainer>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12zM7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z" />
                            </svg>
                            <div>Нет сообщений</div>
                            <div>Будьте первым, кто напишет в этой группе</div>
                        </EmptyMessagesContainer>
                    )}

                    {messagesWithDividers.map((item) => {
                        if (item.type === 'divider') {
                            return (
                                <DateDivider key={item.id}>
                                    {item.text}
                                </DateDivider>
                            );
                        }

                        const isMyMessage = item.senderId === user?.id;

                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <MessageItem $isMine={isMyMessage} $pending={item.pending}>
                                    <MessageHeader $isMine={isMyMessage}>
                                        {isMyMessage ? 'Вы' : item.senderName}
                                    </MessageHeader>
                                    <MessageText>{typeof item.text === 'string' ? item.text : JSON.stringify(item.text)}</MessageText>
                                    <MessageTime>
                                        {formatMessageTime(item.createdAt)}
                                    </MessageTime>
                                </MessageItem>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </MessagesList>

            <InputArea onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(message);
                setMessage('');
            }}>
                <MessageInput
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Введите сообщение..."
                    disabled={isSending}
                />
                <SendButton type="submit" disabled={!message.trim() || isSending}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                </SendButton>
            </InputArea>
        </MessagesContainer>
    );
};

export default GroupMessages;
