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
import UserStatus from '../components/UserStatus';
import '../styles/Chat.css';

const Chat = () => {
    const { chatId } = useParams();
    const { user } = useAuth();
    const [chat, setChat] = useState(null);
    const [partnerInfo, setPartnerInfo] = useState({ name: 'Собеседник' });
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [showActionsMenu, setShowActionsMenu] = useState(false);
    const [isPartnerTyping, setIsPartnerTyping] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    // Функция для получения инициалов имени для аватара
    const getInitials = (name) => {
        return name
            .split(' ')
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    // Загрузка данных чата
    useEffect(() => {
        const fetchChatData = async () => {
            if (!chatId || !user) return;

            try {
                setIsLoading(true);
                setError(null);

                // Получаем данные чата
                const chatData = await getChatById(chatId);

                if (!chatData) {
                    setError('Чат не найден');
                    setIsLoading(false);
                    return;
                }

                // Проверяем, является ли это чатом поддержки
                const isSupportChat = chatData.type === 'support';

                setChat({
                    ...chatData,
                    isSupportChat // Добавляем флаг чата поддержки
                });

                // Получаем сообщения
                const messagesData = await getChatMessages(chatId);
                setMessages(messagesData);

                setIsLoading(false);
            } catch (err) {
                console.error("Ошибка при загрузке чата:", err);
                setError('Ошибка при загрузке чата');
                setIsLoading(false);
            }
        };

        fetchChatData();
    }, [chatId, user]);

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

    // Прокрутка к последнему сообщению
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Обработчик скролла для показа кнопки прокрутки вниз
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
            setShowScrollButton(isScrolledUp);
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

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

    // Группировка сообщений по дате для отображения разделителей
    const getGroupedMessages = useCallback(() => {
        const grouped = [];
        let currentDate = null;

        messages.forEach((msg) => {
            const messageDate = new Date(msg.timestamp).toLocaleDateString();

            if (messageDate !== currentDate) {
                grouped.push({ type: 'date', value: messageDate });
                currentDate = messageDate;
            }

            grouped.push({ type: 'message', value: msg });
        });

        return grouped;
    }, [messages]);

    // Форматирование времени для статуса партнера
    const formatLastSeen = (timestamp) => {
        if (!timestamp) return 'Не в сети';

        const now = new Date();
        const lastSeen = new Date(timestamp);
        const diffMinutes = Math.floor((now - lastSeen) / (1000 * 60));

        if (diffMinutes < 1) return 'В сети';
        if (diffMinutes < 60) return `Был(а) ${diffMinutes} мин. назад`;

        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `Был(а) ${diffHours} ч. назад`;

        return `Был(а) ${new Date(timestamp).toLocaleDateString()}`;
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

    const groupedMessages = getGroupedMessages();

    return (
        <div className="chat-container">
            {/* Заголовок чата */}
            <div className={`chat-header ${chat.isSupportChat ? 'support-chat' : ''}`}>
                <div className="partner-info">
                    <div className="partner-avatar">
                        {chat.isSupportChat ? (
                            <svg className="support-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12h-8v8h8v-8z"></path>
                                <path d="M3 12h8V4H3v8z"></path>
                                <path d="M3 20h8v-4H3v4z"></path>
                                <path d="M17 4h4v4h-4V4z"></path>
                            </svg>
                        ) : (
                            getInitials(partnerInfo.name)
                        )}
                    </div>
                    <div className="partner-details">
                        <h2 className="partner-name">
                            {chat.isSupportChat ? (
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
                            {!chat.isSupportChat && <UserStatus isOnline={partnerInfo.isOnline} lastSeen={partnerInfo.lastSeen} />}
                        </div>
                    </div>
                </div>
                <div className="chat-actions">
                    {!chat.isSupportChat && (
                        <>
                            <button
                                className="chat-action-button"
                                onClick={() => setShowActionsMenu(!showActionsMenu)}
                                aria-label="Меню действий"
                            >
                                ⋮
                            </button>
                        </>
                    )}
                </div>

                {/* Выпадающее меню действий */}
                {showActionsMenu && (
                    <>
                        <div className="chat-actions-backdrop" onClick={() => setShowActionsMenu(false)}></div>
                        <div className="chat-actions-menu">
                            <div className="chat-actions-menu-item" onClick={handleReport}>
                                <span className="chat-actions-menu-icon">⚠️</span>
                                Пожаловаться
                            </div>
                            <div className="chat-actions-menu-item chat-actions-menu-item-danger" onClick={handleEndChat}>
                                <span className="chat-actions-menu-icon">🚫</span>
                                Завершить чат
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Сообщения */}
            <div className="messages-container" ref={messagesContainerRef}>
                {groupedMessages.length === 0 ? (
                    <div className="no-messages">
                        <div className="no-messages-icon">💬</div>
                        <p>Напишите первое сообщение, чтобы начать общение</p>
                    </div>
                ) : (
                    groupedMessages.map((item, index) => (
                        item.type === 'date' ? (
                            <div className="message-date-divider" key={`date-${index}`}>
                                {item.value}
                            </div>
                        ) : (
                            <div
                                key={`msg-${index}`}
                                className={`message ${item.value.senderId === user.telegramId ? 'my-message' : 'partner-message'} ${item.value.senderId === 'support' ? 'support-message' : ''}`}
                            >
                                <div className="message-bubble">
                                    {item.value.senderId === 'support' && (
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
                                    <p className="message-text">{item.value.text}</p>
                                    <span className="message-time">
                                        {new Date(item.value.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                {item.value.senderId === user.telegramId && (
                                    <span className="message-status">
                                        {item.value.isRead ? '✓✓' : '✓'}
                                    </span>
                                )}
                            </div>
                        )
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

            {/* Кнопка скроллинга вниз */}
            {showScrollButton && (
                <div className="scrollToBottom" onClick={scrollToBottom}></div>
            )}

            {/* Форма отправки сообщения */}
            <form className="message-input-form" onSubmit={handleSendMessage}>
                <div className="message-input-container">
                    <input
                        type="text"
                        ref={inputRef}
                        value={inputMessage}};




















































export default Chat;};    );        </div>            )}                </div>                    </div>                        </div>                            </button>                                Отправить                            >                                className="submit-report-button"                                disabled={!reportReason.trim()}                                onClick={submitReport}                            <button                            <button onClick={() => setShowReportModal(false)}>Отмена</button>                        <div className="report-modal-actions">                        />                            className="report-textarea"                            rows={4}                            placeholder="Опишите причину жалобы..."                            onChange={(e) => setReportReason(e.target.value)}                            value={reportReason}                        <textarea                        <h3>Пожаловаться на собеседника</h3>                    <div className="report-modal" onClick={(e) => e.stopPropagation()}>                <div className="report-modal-overlay" onClick={() => setShowReportModal(false)}>            {showReportModal && (            {/* Модальное окно для жалобы */}            </form>                </div>                    </button>                        </svg>                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>                            <line x1="22" y1="2" x2="11" y2="13"></line>                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">                    >                        aria-label="Отправить сообщение"                        disabled={!inputMessage.trim() || sendingMessage}                        className="send-button"                        type="submit"                    <button                    />                        onBlur={() => setIsInputFocused(false)}                        onFocus={() => setIsInputFocused(true)}                        autoComplete="off"                        className="message-input"                        placeholder="Введите сообщение..."                        onChange={(e) => setInputMessage(e.target.value)}
export default Chat;
