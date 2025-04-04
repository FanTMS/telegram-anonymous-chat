import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getChatById, sendMessage, subscribeToChatUpdates, endChat, reportChat } from '../utils/chatService';
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

    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

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
                // eslint-disable-next-line no-unused-vars
                const partnerUserId = chatData.participants.find(id => id !== user.telegramId);

                // Здесь можно добавить получение информации о партнере, если нужно
                // Пока оставим заглушку
                setPartnerInfo({ name: 'Собеседник' });

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
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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
            if (WebApp && WebApp.HapticFeedback) {
                WebApp.HapticFeedback.impactOccurred('light');
            }

            await sendMessage(chatId, messageData);
            setInputMessage('');
        } catch (err) {
            console.error("Ошибка при отправке сообщения:", err);
            setError('Не удалось отправить сообщение');
        }
    };

    // Завершение чата
    const handleEndChat = async () => {
        try {
            // Запрашиваем подтверждение
            if (WebApp && WebApp.showConfirm) {
                WebApp.showConfirm(
                    "Вы уверены, что хотите завершить чат?",
                    (confirmed) => {
                        if (confirmed) {
                            completeEndChat();
                        }
                    }
                );
            } else {
                // Если WebApp.showConfirm недоступен
                if (window.confirm("Вы уверены, что хотите завершить чат?")) {
                    completeEndChat();
                }
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
                if (WebApp && WebApp.HapticFeedback) {
                    WebApp.HapticFeedback.notificationOccurred('success');
                }

                // Показываем уведомление
                if (WebApp && WebApp.showPopup) {
                    WebApp.showPopup({
                        title: 'Чат завершен',
                        message: 'Чат успешно завершен',
                        buttons: [{ text: 'OK' }]
                    });
                }

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
    const handleReport = async () => {
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
            if (WebApp && WebApp.HapticFeedback) {
                WebApp.HapticFeedback.notificationOccurred('success');
            }

            // Показываем уведомление
            if (WebApp && WebApp.showPopup) {
                WebApp.showPopup({
                    title: 'Жалоба отправлена',
                    message: 'Спасибо за обращение. Наши модераторы рассмотрят вашу жалобу.',
                    buttons: [{ text: 'OK' }]
                });
            } else {
                alert('Жалоба отправлена. Спасибо за обращение.');
            }

            setShowReportModal(false);
            setReportReason('');
        } catch (err) {
            console.error("Ошибка при отправке жалобы:", err);
            setError('Не удалось отправить жалобу');
        }
    };

    // Если загрузка
    if (isLoading) {
        return <div className="chat-loading">Загрузка чата...</div>;
    }

    // Если ошибка
    if (error) {
        return <div className="chat-error">
            <p>{error}</p>
            <button onClick={() => navigate('/chats')}>Вернуться к списку чатов</button>
        </div>;
    }

    // Если чат завершен
    if (chat && !chat.isActive) {
        return <div className="chat-ended">
            <h3>Чат завершен</h3>
            <p>Этот чат был завершен.</p>
            <button onClick={() => navigate('/chats')}>Вернуться к списку чатов</button>
        </div>;
    }

    return (
        <div className="chat-container">
            {/* Заголовок чата */}
            <div className="chat-header">
                <h3 className="partner-name">{partnerInfo.name}</h3>
                <div className="chat-actions">
                    <button className="report-button" onClick={handleReport}>
                        Пожаловаться
                    </button>
                    <button className="end-chat-button" onClick={handleEndChat}>
                        Завершить чат
                    </button>
                </div>
            </div>

            {/* Сообщения */}
            <div className="messages-container">
                {messages.length === 0 ? (
                    <div className="no-messages">
                        <p>Напишите первое сообщение, чтобы начать общение</p>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`message ${msg.senderId === user.telegramId ? 'my-message' : 'partner-message'}`}
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

            {/* Форма отправки сообщения */}
            <form className="message-input-form" onSubmit={handleSendMessage}>
                <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Введите сообщение..."
                    className="message-input"
                />
                <button type="submit" className="send-button" disabled={!inputMessage.trim()}>
                    Отправить
                </button>
            </form>

            {/* Модальное окно для жалобы */}
            {showReportModal && (
                <div className="report-modal-overlay">
                    <div className="report-modal">
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
