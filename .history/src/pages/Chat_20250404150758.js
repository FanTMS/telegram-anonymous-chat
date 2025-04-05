import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    getChatById,
    getChatMessages,
    sendChatMessage,
    endChat,
    reportChat,
    addSupportChat,
    updateUserOnlineStatus
} from '../utils/chatService';
import { safeHapticFeedback, safeShowPopup } from '../utils/telegramUtils';
import useAuth from '../hooks/useAuth';
import '../styles/Chat.css';

const Chat = () => {
    const { chatId } = useParams();
    const { user } = useAuth();
    const [chat, setChat] = useState(null);
    const [partnerInfo, setPartnerInfo] = useState({ name: 'Собеседник' });
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [error, setError] = useState(null);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [showActionsMenu, setShowActionsMenu] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [groupedMessages, setGroupedMessages] = useState([]);
    const [isPartnerTyping, setIsPartnerTyping] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

    const messagesContainerRef = useRef(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    // Обновление статуса "онлайн" пользователя
    useEffect(() => {
        let intervalId;

        if (user && user.telegramId) {
            // Устанавливаем статус онлайн при открытии чата
            updateUserOnlineStatus(user.telegramId, true);

            // Периодически подтверждаем статус для поддержания активности
            intervalId = setInterval(() => {
                updateUserOnlineStatus(user.telegramId, true);
            }, 60000); // Обновляем статус каждую минуту
        }

        return () => {
            // При закрытии компонента снимаем статус "онлайн"
            if (user && user.telegramId) {
                updateUserOnlineStatus(user.telegramId, false);
            }
            if (intervalId) clearInterval(intervalId);
        };
    }, [user]);

    // Получение и обновление информации о партнере
    useEffect(() => {
        if (!chat || !chat.participants) return;

        const getPartnerStatus = async () => {
            if (chat.isSupportChat) return;

            const partnerId = chat.participants.find(id => id !== user.telegramId);
            if (!partnerId) return;

            try {
                const response = await fetch(`/api/users/${partnerId}/status`);
                if (response.ok) {
                    const data = await response.json();
                    setPartnerInfo(prev => ({
                        ...prev,
                        isOnline: data.isOnline,
                        lastSeen: data.lastSeen
                    }));
                }
            } catch (error) {
                console.error("Ошибка при получении статуса партнера:", error);
            }
        };

        getPartnerStatus();

        // Получаем статус партнера каждые 30 секунд
        const statusInterval = setInterval(getPartnerStatus, 30000);
        return () => clearInterval(statusInterval);
    }, [chat, user.telegramId]);

    // Обработка изменения высоты viewport (для работы с клавиатурой)
    useEffect(() => {
        const handleResize = () => {
            const newHeight = window.innerHeight;
            setViewportHeight(newHeight);

            // Проверяем, стала ли высота viewport существенно меньше
            // Это может указывать на появление клавиатуры
            if (window.innerHeight < window.innerWidth &&
                window.innerHeight < viewportHeight * 0.8) {
                document.documentElement.classList.add('keyboard-visible');

                // Прокручиваем до последнего сообщения при появлении клавиатуры
                if (messagesEndRef.current) {
                    setTimeout(() => {
                        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                }
            } else {
                document.documentElement.classList.remove('keyboard-visible');
            }
        };

        window.addEventListener('resize', handleResize);

        // Исправление для iOS Safari
        if (typeof window.visualViewport !== 'undefined') {
            window.visualViewport.addEventListener('resize', handleResize);
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            if (typeof window.visualViewport !== 'undefined') {
                window.visualViewport.removeEventListener('resize', handleResize);
            }
            document.documentElement.classList.remove('keyboard-visible');
        };
    }, [viewportHeight]);

    // Прокрутка к последнему сообщению при фокусе на поле ввода
    useEffect(() => {
        if (isInputFocused && messagesEndRef.current) {
            setTimeout(() => {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, [isInputFocused]);

    // Прокрутка вниз по кнопке
    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Отправка сообщения
    const handleSendMessage = async (e) => {
        e.preventDefault();

        if (!inputMessage.trim() || !chatId || !user) return;

        try {
            setSendingMessage(true);

            // Если это чат поддержки, используем специальную функцию
            if (chat.isSupportChat) {
                await addSupportChat(user.telegramId || user.id, inputMessage.trim());
            } else {
                // Обычная отправка сообщения для стандартных чатов
                await sendChatMessage(chatId, user.telegramId || user.id, inputMessage.trim());
            }

            // Очищаем поле ввода
            setInputMessage('');

            // Обновляем список сообщений
            const updatedMessages = await getChatMessages(chatId);
            setMessages(updatedMessages);

            // Прокручиваем к последнему сообщению
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        } catch (err) {
            console.error("Ошибка при отправке сообщения:", err);
            setError('Не удалось отправить сообщение');
        } finally {
            setSendingMessage(false);
        }
    };

    // Завершение чата
    const handleEndChat = async () => {
        try {
            // Закрываем меню действий
            setShowActionsMenu(false);

            // Запрашиваем подтверждение
            let isConfirmed = false;

            isConfirmed = window.confirm("Вы уверены, что хотите завершить чат? Вы больше не сможете отправлять сообщения.");

            if (isConfirmed) {
                await completeEndChat();
            }
        } catch (err) {
            console.error("Ошибка при завершении чата:", err);
            setError('Не удалось завершить чат');
        }
    };

    // Функция для фактического завершения чата
    const completeEndChat = async () => {
        try {
            const success = await endChat(chatId);

            if (success) {
                // Тактильная обратная связь
                safeHapticFeedback('notification', null, 'success');

                // Показываем уведомление
                await safeShowPopup({
                    title: 'Чат завершен',
                    message: 'Чат успешно завершен',
                    buttons: [{ text: "OK" }]
                });

                // Перенаправляем на страницу со списком чатов
                navigate('/chats');
            } else {
                setError('Не удалось завершить чат');
            }
        } catch (err) {
            console.error("Ошибка при завершении чата:", err);
            setError('Не удалось завершить чат');
        }
    };

    // Обработка жалобы
    const handleReport = () => {
        setShowActionsMenu(false);
        setShowReportModal(true);
    };

    // Отправка жалобы
    const submitReport = async () => {
        if (!reportReason.trim()) {
            return;
        }

        try {
            await reportChat(chatId, user.telegramId, reportReason);

            // Тактильная обратная связь
            safeHapticFeedback('notification', null, 'success');

            // Показываем уведомление
            await safeShowPopup({
                title: 'Жалоба отправлена',
                message: 'Спасибо за обращение. Наши модераторы рассмотрят вашу жалобу.',
                buttons: [{ text: 'OK' }]
            });

            setShowReportModal(false);
            setReportReason('');
        } catch (err) {
            console.error("Ошибка при отправке жалобы:", err);
            setError('Не удалось отправить жалобу');
        }
    };

    // Вспомогательная функция для форматирования времени последнего посещения
    const formatLastSeen = (lastSeen) => {
        if (!lastSeen) return "не в сети";

        const now = new Date();
        const lastSeenDate = new Date(lastSeen);
        const diff = Math.floor((now - lastSeenDate) / 1000); // разница в секундах

        if (diff < 60) return "только что";
        if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`;

        const options = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
        return lastSeenDate.toLocaleDateString('ru-RU', options);
    };

    // Если загрузка
    if (isLoading) {
        return <div className="chat-loading"></div>;
    }

    // Если ошибка
    if (error) {
        return (
            <div className="chat-error">
                <p>{error}</p>
                <button onClick={() => navigate('/chats')}>Вернуться к списку чатов</button>
            </div>
        );
    }

    // Если чат завершен
    if (chat && !chat.isActive) {
        return (
            <div className="chat-ended">
                <h3>Чат завершен</h3>
                <p>Этот чат был завершен. Вы можете найти нового собеседника или вернуться к списку чатов.</p>
                <button onClick={() => navigate('/chats')}>Вернуться к списку чатов</button>
            </div>
        );
    }

    return (
        <div className="chat-container">
            <div className="chat-header">
                <div className="partner-info">
                    <div className="partner-avatar">
                        {chat?.isSupportChat ? (
                            <svg className="support-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12h-8v8h8v-8z"></path>
                                <path d="M3 12h8V4H3v8z"></path>
                                <path d="M3 20h8v-4H3v4z"></path>
                                <path d="M17 4h4v4h-4V4z"></path>
                            </svg>
                        ) : (
                            partnerInfo.name.substring(0, 2).toUpperCase()
                        )}
                    </div>
                    <div className="partner-details">
                        <h2 className="partner-name">
                            {chat?.isSupportChat ? (
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
                        </h2>
                        <div className="partner-status">
                            {!chat?.isSupportChat && (
                                <div className="user-status">
                                    <span className={`status-indicator ${partnerInfo.isOnline ? 'online' : 'offline'}`}></span>
                                    <span className="status-text">
                                        {partnerInfo.isOnline ? 'в сети' : partnerInfo.lastSeen ? `был(а) ${formatLastSeen(partnerInfo.lastSeen)}` : 'не в сети'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="messages-container" ref={messagesContainerRef}>
                {messages.length === 0 ? (
                    <div className="no-messages">
                        <div className="no-messages-icon">💬</div>
                        <p>Напишите первое сообщение, чтобы начать общение</p>
                    </div>
                ) : (
                    messages.map((message, index) => (
                        <div
                            key={`msg-${index}`}
                            className={`message ${message.senderId === user.telegramId ? 'my-message' : 'partner-message'}`}
                        >
                            <div className="message-bubble">
                                <p className="message-text">{message.text}</p>
                                <span className="message-time">
                                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))
                )}
                {isPartnerTyping && (
                    <div className="typing-indicator">
                        {partnerInfo.name} печатает
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
                <div className="scrollToBottom" onClick={scrollToBottom}></div>
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
