import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
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
    const [isLoading, setIsLoading] = useState(true);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

    const messagesContainerRef = useRef(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    // Загрузка чата и сообщений при монтировании
    useEffect(() => {
        const loadChatData = async () => {
            try {
                setIsLoading(true);
                // Получаем сообщения
                const chatMessages = await getChatMessages(chatId);
                setMessages(chatMessages);
                setIsLoading(false);
            } catch (err) {
                console.error("Ошибка при загрузке данных чата:", err);
                setError("Не удалось загрузить чат");
                setIsLoading(false);
            }
        };

        if (chatId && user) {
            loadChatData();
        }
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

    // Отслеживание скролла для показа кнопки прокрутки вниз
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

    // Отправка сообщения
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || !chatId || !user) return;

        try {
            setSendingMessage(true);
            
            // Создаем временное сообщение для моментального отображения
            const tempMessage = {
                id: `temp-${Date.now()}`,
                text: inputMessage.trim(),
                senderId: user.telegramId || user.id,
                timestamp: Date.now(),
                isTemp: true
            };
            
            // Добавляем сообщение во временный массив для моментального отображения
            setMessages(prev => [...prev, tempMessage]);
            
            // Очищаем поле ввода сразу
            setInputMessage('');

            // Если это чат поддержки, используем специальную функцию
            if (chat?.isSupportChat) {
                await addSupportChat(user.telegramId || user.id, tempMessage.text);
            } else {
                // Обычная отправка сообщения для стандартных чатов
                await sendChatMessage(chatId, user.telegramId || user.id, tempMessage.text);
            }

            // Получаем обновленные сообщения с сервера
            const updatedMessages = await getChatMessages(chatId);
            setMessages(updatedMessages);

            // Прокручиваем к последнему сообщению
            scrollToBottom(true);
        } catch (error) {
            console.error('Ошибка при отправке сообщения:', error);
            alert('Не удалось отправить сообщение. Пожалуйста, попробуйте еще раз.');
            
            // Удаляем временное сообщение в случае ошибки
            setMessages(prev => prev.filter(msg => !msg.isTemp));
        } finally {
            setSendingMessage(false);
        }
    };

    // Завершение чата
    const handleEndChat = async () => {
        try {
            // Запрашиваем подтверждение
            const confirmed = await safeShowPopup({
                title: 'Завершить чат',
                message: 'Вы уверены, что хотите завершить этот чат?',
                buttons: [
                    { id: 'cancel', text: 'Отмена' },
                    { id: 'end', text: 'Завершить' }
                ]
            });

            if (confirmed && confirmed.id === 'end') {
                // Тактильная обратная связь
                safeHapticFeedback('notification', null, 'warning');

                // Завершаем чат
                await endChat(chatId);

                // Показываем уведомление
                await safeShowPopup({
                    title: 'Чат завершен',
                    message: 'Чат был завершен. Вы можете начать новый чат в любое время.',
                    buttons: [{ text: 'OK' }]
                });

                // Перенаправляем на страницу со списком чатов
                navigate('/chats');
            }
        } catch (err) {
            console.error("Ошибка при завершении чата:", err);
            setError('Не удалось завершить чат');
        }
    };

    // Обработка жалобы
    const handleReport = () => {
        // Открываем модальное окно для жалобы
        document.querySelector('.report-modal-overlay').classList.add('visible');
    };

    // Отправка жалобы
    const submitReport = async (reportReason) => {
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

            // Закрываем модальное окно
            document.querySelector('.report-modal-overlay').classList.remove('visible');
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
                                        {partnerInfo.isOnline ? 'в сети' : partnerInfo.lastSeen ? formatLastSeen(partnerInfo.lastSeen) : 'не в сети'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="chat-actions">
                    <button
                        className="chat-menu-button"
                        onClick={() => document.querySelector('.chat-actions-menu').classList.toggle('visible')}
                        aria-label="Меню чата"
                    >
                        <span className="dots"></span>
                    </button>
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
                </div>
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

            {showScrollButton && (
                <div className="scrollToBottom" onClick={scrollToBottom}></div>
            )}

            <form className={`message-input-form ${isInputFocused ? 'input-focused' : ''}`} onSubmit={handleSendMessage}>
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

            <div className="report-modal-overlay">
                <div className="report-modal">
                    <h3>Пожаловаться на собеседника</h3>
                    <textarea
                        id="report-reason"
                        placeholder="Опишите причину жалобы..."
                        rows={4}
                        className="report-textarea"
                    ></textarea>
                    <div className="report-modal-actions">
                        <button
                            onClick={() => document.querySelector('.report-modal-overlay').classList.remove('visible')}
                        >
                            Отмена
                        </button>
                        <button
                            onClick={() => {
                                const reason = document.getElementById('report-reason').value;
                                submitReport(reason);
                            }}
                            className="submit-report-button"
                        >
                            Отправить
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;
