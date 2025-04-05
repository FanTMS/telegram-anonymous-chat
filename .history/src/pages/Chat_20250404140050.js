import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChatById, sendMessage, subscribeToChatUpdates, endChat, reportChat } from '../utils/chatService';
import { incrementMessagesCount } from '../utils/statisticsService';
import { getUserById } from '../utils/usersService';
import { safeHapticFeedback, safeShowPopup, isWebAppMethodSupported } from '../utils/telegramWebAppUtils';
import WebApp from '@twa-dev/sdk';
import '../styles/Chat.css';

const Chat = ({ user }) => {
    const { chatId } = useParams();
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
        const loadChatData = async () => {
            if (!user || !chatId) return;

            try {
                setIsLoading(true);
                setError(null);

                const chatData = await getChatById(chatId);

                if (!chatData) {
                    setError('Чат не найден');
                    setIsLoading(false);
                    return;
                }

                // Проверяем, что пользователь - участник чата
                if (!chatData.participants.includes(user.telegramId)) {
                    setError('У вас нет доступа к этому чату');
                    setIsLoading(false);
                    return;
                }

                // Определяем ID партнера
                const partnerUserId = chatData.participants.find(id => id !== user.telegramId);

                // Получаем информацию о партнере, если доступно
                try {
                    if (partnerUserId && chatData.participantsInfo && chatData.participantsInfo[partnerUserId]) {
                        const partnerData = chatData.participantsInfo[partnerUserId];
                        setPartnerInfo({
                            id: partnerUserId,
                            name: partnerData.name || 'Собеседник',
                            lastSeen: partnerData.lastSeen || null
                        });
                    } else {
                        // Пробуем получить информацию о партнере из базы данных
                        const partnerUserData = await getUserById(partnerUserId);
                        if (partnerUserData) {
                            setPartnerInfo({
                                id: partnerUserId,
                                name: partnerUserData.name || 'Собеседник',
                                lastSeen: partnerUserData.lastActive || null
                            });
                        } else {
                            setPartnerInfo({ name: 'Собеседник' });
                        }
                    }
                } catch (error) {
                    console.error("Ошибка при получении данных о партнере:", error);
                    setPartnerInfo({ name: 'Собеседник' });
                }

                setChat(chatData);
                setMessages(chatData.messages || []);
                setIsLoading(false);
            } catch (err) {
                console.error("Ошибка при загрузке чата:", err);
                setError('Ошибка при загрузке чата');
                setIsLoading(false);
            }
        };

        loadChatData();
    }, [chatId, user]);

    // Подписка на обновления чата
    useEffect(() => {
        let unsubscribe = null;

        if (chatId && user) {
            unsubscribe = subscribeToChatUpdates(chatId, (chatData) => {
                if (chatData) {
                    setChat(chatData);
                    setMessages(chatData.messages || []);
                    
                    // Симуляция эффекта "партнер печатает"
                    // В реальном приложении здесь будет логика на основе данных от партнера
                    if (Math.random() > 0.7 && chatData.messages && chatData.messages.length > 0) {
                        setIsPartnerTyping(true);
                        setTimeout(() => setIsPartnerTyping(false), 3000);
                    }
                } else {
                    // Чат не существует или был удален
                    setError('Чат не найден или был удален');
                }
            });
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [chatId, user]);

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
            // Создаем объект сообщения
            const messageData = {
                text: inputMessage.trim(),
                senderId: user.telegramId,
                timestamp: new Date().toISOString()
            };

            // Тактильная обратная связь
            safeHapticFeedback('impact', 'light');

            // Отправляем сообщение и очищаем поле ввода
            setInputMessage('');

            // Оптимистичное обновление UI - добавляем сообщение в список локально
            setMessages(prevMessages => [...prevMessages, messageData]);

            // Отправляем сообщение в Firebase
            await sendMessage(chatId, messageData);

            // Обновляем счетчик сообщений
            await incrementMessagesCount(user.telegramId);
        } catch (err) {
            console.error("Ошибка при отправке сообщения:", err);
            setError('Не удалось отправить сообщение. Попробуйте ещё раз.');

            // Показываем ошибку и скрываем через 3 секунды
            setTimeout(() => {
                setError(null);
            }, 3000);
        }
    };

    // Завершение чата
    const handleEndChat = async () => {
        try {
            // Закрываем меню действий
            setShowActionsMenu(false);
            
            // Запрашиваем подтверждение
            let isConfirmed = false;
            
            // Проверяем, доступен ли метод showConfirm в Telegram WebApp
            if (isWebAppMethodSupported('showConfirm')) {
                isConfirmed = await WebApp.showConfirm(
                    "Вы уверены, что хотите завершить чат? Вы больше не сможете отправлять сообщения."
                );
            } else {
                // Если WebApp.showConfirm недоступен, используем стандартный confirm
                isConfirmed = window.confirm("Вы уверены, что хотите завершить чат? Вы больше не сможете отправлять сообщения.");
            }
            
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
            <div className="chat-header">
                <div className="chat-header-left">
                    <div className="partner-avatar">
                        {getInitials(partnerInfo.name)}
                    </div>
                    <div className="partner-info">
                        <h3 className="partner-name">{partnerInfo.name}</h3>
                        <p className="partner-status">
                            {partnerInfo.lastSeen && (
                                <>
                                    <span className={partnerInfo.lastSeen && new Date() - new Date(partnerInfo.lastSeen) < 5 * 60 * 1000 ? 'online-indicator' : 'offline-indicator'}></span>
                                    {formatLastSeen(partnerInfo.lastSeen)}
                                </>
                            )}
                        </p>
                    </div>
                </div>
                <div className="chat-actions">
                    <button 
                        className="chat-action-button" 
                        onClick={() => setShowActionsMenu(!showActionsMenu)}
                        aria-label="Меню действий"
                    >
                        ⋮
                    </button>
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
                                className={`message ${item.value.senderId === user.telegramId ? 'my-message' : 'partner-message'}`}
                            >
                                <div className="message-bubble">
                                    <p className="message-text">{item.value.text}</p>
                                    <span className="message-time">
                                        {new Date(item.value.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                {item.value.senderId === user.telegramId && (
                                    <span className="message-status">
                                        ✓✓
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
                <input
                    type="text"
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Введите сообщение..."
                    className="message-input"
                />
                <button 
                    type="submit" 
                    className="send-button" 
                    disabled={!inputMessage.trim()}
                    aria-label="Отправить сообщение"
                ></button>
            </form>

            {/* Модальное окно для жалобы */}
            {showReportModal && (
                <div className="report-modal-overlay" onClick={() => setShowReportModal(false)}>
                    <div className="report-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Пожаловаться на собеседника</h3>
                        <textarea
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            placeholder="Опишите причину жалобы..."
                            rows={4}
                            className="report-textarea"
                        />
                        <div className="report-modal-actions">
                            <button onClick={() => setShowReportModal(false)}>Отмена</button>
                            <button
                                onClick={submitReport}
                                disabled={!reportReason.trim()}
                                className="submit-report-button"
                            >
                                Отправить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;
