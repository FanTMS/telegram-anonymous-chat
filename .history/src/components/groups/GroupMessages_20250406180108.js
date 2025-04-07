import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { getGroupMessages, sendGroupMessage } from '../../services/groupService';
import { generateNickname } from '../../utils/nameGenerator';

const MessagesContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 0;
  overflow: hidden;
`;

const MessagesList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MessageComposer = styled.div`
  display: flex;
  padding: 12px;
  border-top: 1px solid var(--tg-theme-hint-color, rgba(0, 0, 0, 0.1));
  background-color: var(--tg-theme-bg-color, #fff);
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
  border-radius: 12px;
  padding: 8px 12px;
  position: relative;
  word-break: break-word;
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

const MessageHeader = styled.div`
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 4px;
  color: ${props => props.$isMine
        ? 'var(--tg-theme-button-text-color, rgba(255, 255, 255, 0.9))'
        : 'var(--tg-theme-text-color, #000)'};
`;

const MessageText = styled.div`
  font-size: 14px;
  line-height: 1.4;
`;

const MessageTime = styled.div`
  font-size: 11px;
  text-align: right;
  margin-top: 4px;
  opacity: 0.8;
`;

const EmptyMessages = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--tg-theme-hint-color, #999);
  padding: 20px;
  text-align: center;
`;

/**
 * Компонент сообщений группы
 * @param {Object} props - Свойства компонента
 * @param {string} props.groupId - ID группы
 * @param {Object} props.user - Объект пользователя
 * @param {Object} props.group - Объект группы
 */
const GroupMessages = ({ groupId, user, group }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inputValue, setInputValue] = useState('');
    const [sending, setSending] = useState(false);
    const [userNickname, setUserNickname] = useState('');
    const [error, setError] = useState(null);

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    // Форматирование времени
    const formatTime = (timestamp) => {
        if (!timestamp) return '';

        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');

        return `${hours}:${minutes}`;
    };

    // Загрузка сообщений группы
    const loadMessages = async () => {
        if (!groupId) return;

        setLoading(true);
        setError(null);

        try {
            const fetchedMessages = await getGroupMessages(groupId);
            if (Array.isArray(fetchedMessages)) {
                setMessages(fetchedMessages);
            } else {
                setMessages([]);
                setError('Не удалось загрузить сообщения. Получен неверный формат данных.');
            }
        } catch (err) {
            console.error('Ошибка при загрузке сообщений группы:', err);
            setError('Не удалось загрузить сообщения. Пожалуйста, попробуйте позже.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMessages();
    }, [groupId]);

    // Генерация псевдонима для анонимных групп
    useEffect(() => {
        if (group?.isAnonymous) {
            const storedNickname = localStorage.getItem(`group_nickname_${groupId}_${user.id}`);
            if (storedNickname) {
                setUserNickname(storedNickname);
            } else {
                const nickname = generateNickname();
                setUserNickname(nickname);
                localStorage.setItem(`group_nickname_${groupId}_${user.id}`, nickname);
            }
        } else {
            setUserNickname('');
        }
    }, [group?.isAnonymous, groupId, user.id]);

    // Прокрутка к последнему сообщению
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Обработчик отправки сообщения с лучшей обработкой ошибок
    const handleSendMessage = async (e) => {
        e.preventDefault();

        const trimmedMessage = inputValue.trim();

        if (!trimmedMessage || sending || !user?.id || !groupId) {
            return;
        }

        setSending(true);
        try {
            const newMessage = {
                text: trimmedMessage,
                senderId: user.id,
                senderName: user.name || 'Аноним',
                groupId,
                isDeleted: false,
                createdAt: new Date()
            };

            await sendGroupMessage(groupId, newMessage);
            setInputValue('');
            await loadMessages(); // Перезагружаем сообщения после отправки
        } catch (err) {
            console.error('Ошибка при отправке сообщения:', err);

            const errorMessage = err.message || 'Не удалось отправить сообщение. Пожалуйста, попробуйте еще раз.';

            if (errorMessage.includes('не являетесь членом')) {
                if (window.confirm('Вы не являетесь членом этой группы. Хотите присоединиться?')) {
                    try {
                        await joinGroup(groupId, user.id);
                        await sendGroupMessage(groupId, newMessage);
                        setInputValue('');
                        await loadMessages();
                    } catch (joinError) {
                        console.error('Ошибка при присоединении к группе:', joinError);
                        alert('Не удалось присоединиться к группе.');
                    }
                }
            } else {
                alert(errorMessage);
            }
        } finally {
            setSending(false);
        }
    };

    // Обработка нажатия Enter
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    };

    return (
        <MessagesContainer>
            <MessagesList ref={messagesContainerRef}>
                {loading ? (
                    <EmptyMessages>Загрузка сообщений...</EmptyMessages>
                ) : error ? (
                    <EmptyMessages>{error}</EmptyMessages>
                ) : messages.length === 0 ? (
                    <EmptyMessages>
                        <div>В этой группе еще нет сообщений</div>
                        <div>Будьте первым, кто напишет!</div>
                    </EmptyMessages>
                ) : (
                    <>
                        {messages.map((message) => {
                            const isMine = message.senderId === user.id;
                            const isSystem = message.type === 'system';

                            if (isSystem) {
                                return (
                                    <SystemMessage key={message.id}>
                                        {message.text}
                                    </SystemMessage>
                                );
                            }

                            const formattedTime = formatTime(message.createdAt);

                            return (
                                <MessageItem key={message.id} $isMine={isMine}>
                                    {!isMine && (
                                        <MessageHeader $isMine={isMine}>
                                            {message.senderName}
                                        </MessageHeader>
                                    )}
                                    <MessageText>{message.text}</MessageText>
                                    <MessageTime>{formattedTime}</MessageTime>
                                </MessageItem>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </MessagesList>

            <MessageComposer>
                <MessageInput
                    type="text"
                    placeholder="Написать сообщение..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={sending}
                />
                <SendButton
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || sending}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                </SendButton>
            </MessageComposer>
        </MessagesContainer>
    );
};

export default GroupMessages;
