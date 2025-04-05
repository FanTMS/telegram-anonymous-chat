import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { findRandomChat, cancelSearch, checkSearchStatus, getUserChats } from '../utils/chatService';
import WebApp from '@twa-dev/sdk';
import { checkFirebaseConnection } from '../utils/firebaseConnectionChecker';
import '../styles/RandomChat.css';

const RandomChat = ({ user }) => {
    const [isSearching, setIsSearching] = useState(false);
    const [searchTime, setSearchTime] = useState(0);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [foundMatch, setFoundMatch] = useState(false);
    const [matchChatId, setMatchChatId] = useState(null);
    const timeIntervalRef = useRef(null);
    const searchIntervalRef = useRef(null);
    const navigate = useNavigate();

    // Очистка интервалов при размонтировании
    useEffect(() => {
        return () => {
            clearInterval(timeIntervalRef.current);
            clearInterval(searchIntervalRef.current);
        };
    }, []);

    // Функция поиска собеседника
    const startSearch = useCallback(async () => {
        if (!user || !user.telegramId) {
            setError('Пользователь не авторизован');
            return;
        }

        try {
            setLoading(true);

            // Проверяем соединение с Firebase
            const isConnected = await checkFirebaseConnection();
            if (!isConnected) {
                setError('Не удалось установить соединение с сервером. Проверьте подключение к интернету.');
                setLoading(false);
                return;
            }

            setError(null);
            setIsSearching(true);
            setSearchTime(0);
            setLoading(false);

            // Тактильная обратная связь (если доступна)
            if (WebApp && WebApp.HapticFeedback) {
                WebApp.HapticFeedback.impactOccurred('light');
            }

            // Показываем всплывающее сообщение о начале поиска
            if (WebApp && WebApp.showPopup) {
                WebApp.showPopup({
                    title: 'Поиск собеседника',
                    message: 'Ищем собеседника для вас. Это может занять некоторое время.',
                    buttons: [{ text: "OK" }]
                });
            }

            const chatId = await findRandomChat(user.telegramId);

            // Если chatId вернулся, значит нашли собеседника
            if (chatId) {
                // Тактильная обратная связь об успехе
                if (WebApp && WebApp.HapticFeedback) {
                    WebApp.HapticFeedback.notificationOccurred('success');
                }

                setFoundMatch(true);
                setMatchChatId(chatId);
                setIsSearching(false);

                // Небольшая задержка перед переходом, чтобы пользователь увидел анимацию
                setTimeout(() => {
                    // Переходим в чат
                    navigate(`/chat/${chatId}`);
                }, 2000);
            }
            // Иначе пользователь добавлен в очередь поиска
        } catch (err) {
            console.error("Ошибка поиска:", err);
            setIsSearching(false);
            setLoading(false);

            // Особая обработка ошибки индекса
            if (err.message && err.message.includes('Требуется создание индекса')) {
                setError('Для работы приложения требуется создание индекса в Firebase. Пожалуйста, обратитесь к администратору.');
                console.log("Инструкция для администратора: " + err.message);
            } else if (err.message && typeof err.message === 'string') {
                setError(`Ошибка: ${err.message}`);
            } else {
                setError('Произошла ошибка при поиске собеседника. Попробуйте позже.');
            }

            // Вибрация при ошибке
            if (WebApp && WebApp.HapticFeedback) {
                WebApp.HapticFeedback.notificationOccurred('error');
            }
        }
    }, [user, navigate]);

    // Отмена поиска
    const stopSearch = useCallback(async () => {
        try {
            if (!user || !user.telegramId) return;

            setLoading(true);
            await cancelSearch(user.telegramId);
            setIsSearching(false);
            setSearchTime(0);
            setLoading(false);

            // Тактильная обратная связь
            if (WebApp && WebApp.HapticFeedback) {
                WebApp.HapticFeedback.impactOccurred('medium');
            }

            // Показываем уведомление об отмене поиска
            if (WebApp && WebApp.showPopup) {
                WebApp.showPopup({
                    title: 'Поиск отменен',
                    message: 'Вы отменили поиск собеседника.',
                    buttons: [{ text: "OK" }]
                });
            }
        } catch (err) {
            console.error("Ошибка при отмене поиска:", err);
            setError('Не удалось отменить поиск. Попробуйте еще раз.');
            setLoading(false);
        }
    }, [user]);

    // Счетчик времени поиска и проверка статуса
    useEffect(() => {
        // Интервал для обновления времени поиска
        if (isSearching) {
            // Запускаем таймер для отсчета времени поиска
            timeIntervalRef.current = setInterval(() => {
                setSearchTime(prev => prev + 1);
            }, 1000);

            // Интервал для проверки статуса поиска
            searchIntervalRef.current = setInterval(async () => {
                try {
                    if (!user || !user.telegramId) return;

                    // Проверяем, в очереди ли еще пользователь
                    const isInQueue = await checkSearchStatus(user.telegramId);

                    // Если пользователя больше нет в очереди, значит, его с кем-то соединили
                    if (!isInQueue && isSearching) {
                        // Получаем последний созданный чат пользователя
                        const userChats = await getUserChats(user.telegramId);
                        const latestChat = userChats[0]; // Предполагаем, что чаты отсортированы по времени создания

                        if (latestChat) {
                            // Показываем анимацию найденного собеседника
                            setFoundMatch(true);
                            setMatchChatId(latestChat.id);
                            setIsSearching(false);

                            // Тактильная обратная связь
                            if (WebApp && WebApp.HapticFeedback) {
                                WebApp.HapticFeedback.notificationOccurred('success');
                            }

                            // Небольшая задержка перед переходом
                            setTimeout(() => {
                                // Переходим в чат
                                navigate(`/chat/${latestChat.id}`);
                            }, 2000);
                            return;
                        }
                    }
                } catch (err) {
                    console.error("Ошибка при проверке статуса поиска:", err);
                }
            }, 3000);
        }

        return () => {
            clearInterval(timeIntervalRef.current);
            clearInterval(searchIntervalRef.current);
        };
    }, [isSearching, user, navigate]);

    // Форматирование времени поиска
    const formatSearchTime = () => {
        const minutes = Math.floor(searchTime / 60);
        const seconds = searchTime % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className="random-chat-container">
            <h2 className="random-chat-title">Поиск собеседника</h2>

            {error && <div className="error-message">{error}</div>}

            {loading ? (
                <div className="search-skeleton"></div>
            ) : (
                <div className="search-status">
                    {isSearching ? (
                        <>
                            <div className="search-animation">
                                <div className="search-pulse"></div>
                            </div>
                            <p className="search-text">Поиск собеседника...</p>
                            <p className="search-time">{formatSearchTime()}</p>
                            <button
                                className="action-button cancel-button"
                                onClick={stopSearch}
                                disabled={loading}
                            >
                                Отменить поиск
                            </button>
                        </>
                    ) : (
                        <button
                            className="action-button search-button"
                            onClick={startSearch}
                            disabled={loading}
                        >
                            Найти собеседника
                        </button>
                    )}
                </div>
            )}

            <div className="search-tips">
                <h3>Советы для общения</h3>
                <ul>
                    <li>Будьте вежливы и уважительны к собеседнику</li>
                    <li>Не делитесь личной информацией</li>
                    <li>Если собеседник нарушает правила, вы можете пожаловаться</li>
                </ul>
                <div className="tips-footer">
                    Анонимный чат объединяет людей со всего мира
                </div>
            </div>

            {/* Анимация при нахождении собеседника */}
            {foundMatch && (
                <div className="found-match-animation">
                    <div className="found-match-content">
                        <div className="found-match-icon">🎉</div>
                        <h3 className="found-match-title">Собеседник найден!</h3>
                        <p className="found-match-subtitle">Переходим в чат...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RandomChat;
