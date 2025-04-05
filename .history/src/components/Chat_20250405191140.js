import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChatById, sendMessage, subscribeToChatUpdates, endChat } from '../utils/chatService';
import { getUserById } from '../utils/usersService';
import { useTelegram } from '../hooks/useTelegram';
import '../styles/Chat.css';

const Chat = () => {
    const { chatId } = useParams();
    const navigate = useNavigate();
    const { WebApp } = useTelegram();
    const [user, setUser] = useState(null);
    const [chat, setChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [partnerInfo, setPartnerInfo] = useState({ name: 'Собеседник' });
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const chatContainerRef = useRef(null);

    // Загрузка данных пользователя из localStorage
    useEffect(() => {
        const userId = localStorage.getItem('current_user_id');
        const userData = localStorage.getItem('current_user');

        if (userId && userData) {
            try {
                setUser({ id: userId, ...JSON.parse(userData) });
            } catch (e) {
                console.error('Ошибка при парсинге данных пользователя:', e);
                setError('Не удалось загрузить данные пользователя');
            }
        } else {
            setError('Необходимо авторизоваться');
            navigate('/login');
        }
    }, [navigate]);

    // Загрузка данных чата
    useEffect(() => {
        const loadChatData = async () => {
            if (!user || !chatId) return;

            try {
                const chatData = await getChatById(chatId);

                if (!chatData) {
                    setError('Чат не найден');
                    setLoading(false);
                    return;
                }

                // Находим ID партнера
                const partnerUserId = chatData.participants.find(id => id !== user.id);

                // Получаем информацию о партнере
                try {
                    if (chatData.participantsInfo && chatData.participantsInfo[partnerUserId]) {
                        const partnerData = chatData.participantsInfo[partnerUserId];
                        setPartnerInfo({
                            id: partnerUserId,
                            name: partnerData.name || 'Собеседник',
                            lastSeen: partnerData.lastSeen || null
                        });
                    } else {
                        // Пробуем получить данные партнера из базы данных
                        const partnerUser = await getUserById(partnerUserId);
                        if (partnerUser) {
                            setPartnerInfo({
                                id: partnerUserId,
                                name: partnerUser.name || 'Собеседник',
                                lastSeen: partnerUser.lastActive || null
                            });
                        } else {
                            setPartnerInfo({
                                id: partnerUserId,
                                name: 'Собеседник'
                            });
                        }
                    }
                } catch (error) {
                    console.error("Ошибка при получении данных о партнере:", error);
                    setPartnerInfo({
                        id: partnerUserId,
                        name: 'Собеседник'
                    });
                }

                setChat(chatData);
                setMessages(chatData.messages || []);
                setLoading(false);
            } catch (err) {
                console.error("Ошибка при загрузке чата:", err);
                setError('Ошибка при загрузке чата');
                setLoading(false);
            }
        };

        loadChatData();
    }, [chatId, user, navigate]);

    // Подписка на обновления чата
    useEffect(() => {
        let unsubscribe = null;

        if (chatId && user) {
            unsubscribe = subscribeToChatUpdates(chatId, (chatData) => {
                if (chatData) {
                    setChat(chatData);
                    setMessages(chatData.messages || []);
                } else {
                    // Чат не существует или был удален
                    setError('Чат больше не доступен');
                }
            });
        }

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [chatId, user]);

    // Прокрутка к последнему сообщению
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Адаптация под клавиатуру
    useEffect(() => {
        const handleResize = () => {
            if (chatContainerRef.current) {
                const viewportHeight = window.innerHeight;
                const keyboardHeight = WebApp?.viewportStableHeight
                    ? window.innerHeight - WebApp.viewportStableHeight
                    : 0;

                if (keyboardHeight > 0) {
                    // Клавиатура открыта
                    chatContainerRef.current.style.paddingBottom = `${keyboardHeight}px`;
                    if (messagesEndRef.current) {
                        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                    }
                } else {
                    // Клавиатура закрыта
                    chatContainerRef.current.style.paddingBottom = '0';
                }
            }
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, [WebApp]);

    // Отправка сообщения
    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!newMessage.trim() || !user || !chatId) return;

        try {
            await sendMessage(chatId, {
                userId: user.id,
                text: newMessage.trim(),
                timestamp: new Date()
            });
            setNewMessage('');

            // Фокус на поле ввода после отправки
            if (inputRef.current) {
                inputRef.current.focus();
            }
        } catch (err) {
            console.error("Ошибка при отправке сообщения:", err);
            setError('Не удалось отправить сообщение');
        }
    };

    // Завершение чата
    const handleEndChat = async () => {
        if (!chatId) return;

        try {
            await endChat(chatId);
            navigate('/chats');
        } catch (err) {
            console.error("Ошибка при завершении чата:", err);
            setError('Не удалось завершить чат');
        }
    };

    if (loading) {
        return <div className="chat-loading">Загрузка чата...</div>;
    }

    if (error) {
        return <div className="chat-error">{error}</div>;
    }

    return (
        <div className="chat-container" ref={chatContainerRef}>
            <div className="chat-header">
                <div className="partner-info">
                    <h2>{partnerInfo.name}</h2>
                    {partnerInfo.lastSeen && (
                        <span className="last-seen">
                            {new Date(partnerInfo.lastSeen.seconds * 1000).toLocaleString()}
                        </span>
                    )}
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
                                    {new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Напишите сообщение..."
                    disabled={!chat || !chat.isActive}
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim() || !chat || !chat.isActive}
                >
                    Отправить
                </button>
            </form>
        </div>
    );
};

export default Chat;
