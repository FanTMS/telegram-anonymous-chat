import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { findRandomChat, cancelSearch, checkChatMatchStatus } from '../utils/chatService';
import { useTelegram } from '../hooks/useTelegram';
import '../styles/RandomChat.css';

const RandomChat = () => {
    const [user, setUser] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchTime, setSearchTime] = useState(0);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [foundMatch, setFoundMatch] = useState(false);

    const navigate = useNavigate();
    const { safeHapticFeedback, safeShowPopup } = useTelegram();

    const timeIntervalRef = useRef(null);
    const searchIntervalRef = useRef(null);

    // Получение данных пользователя
    useEffect(() => {
        const savedUserId = localStorage.getItem('current_user_id');
        const savedUserData = localStorage.getItem('current_user');

        if (savedUserId && savedUserData) {
            try {
                const parsedUser = JSON.parse(savedUserData);
                setUser({
                    id: savedUserId,
                    ...parsedUser
                });
            } catch (e) {
                console.error("Ошибка при загрузке данных пользователя:", e);
                setError("Не удалось загрузить данные пользователя");
            }
        } else {
            setError("Для поиска собеседника необходимо авторизоваться");
        }
    }, []);

    // Запуск поиска собеседника
    const startSearch = useCallback(async () => {
        try {
            if (!user || !user.id) {
                setError("Авторизуйтесь для поиска собеседника");
                return;
            }

            setLoading(true);
            setIsSearching(true);
            setError(null);

            // Тактильная обратная связь при начале поиска
            safeHapticFeedback('impact', 'light');

            const chatId = await findRandomChat(user.id);

            if (chatId) {
                // Собеседник найден сразу
                setFoundMatch(true);

                // Тактильная обратная связь при найденном совпадении
                safeHapticFeedback('success');

                setTimeout(() => {
                    navigate(`/chat/${chatId}`);
                }, 2000);
            }

            setLoading(false);
        } catch (err) {
            setLoading(false);
            setIsSearching(false);

            // Обработка ошибок
            if (err.code === "permission-denied") {
                console.log("Инструкция для администратора: " + err.message);
            } else if (err.message && typeof err.message === 'string') {
                setError(`Ошибка: ${err.message}`);
            } else {
                setError('Произошла ошибка при поиске собеседника. Попробуйте позже.');
            }

            // Вибрация при ошибке
            safeHapticFeedback('notification', null, 'error');
        }
    }, [user, navigate, safeHapticFeedback, safeShowPopup]);

    // Отмена поиска
    const stopSearch = useCallback(async () => {
        try {
            if (!user || !user.id) return;

            setLoading(true);
            await cancelSearch(user.id);
            setIsSearching(false);
            setSearchTime(0);
            setLoading(false);

            // Тактильная обратная связь
            safeHapticFeedback('impact', 'medium');

            // Показываем уведомление об отмене поиска
            await safeShowPopup({
                title: 'Поиск отменен',
                message: 'Вы отменили поиск собеседника.',
                buttons: [{ text: "OK" }]
            });
        } catch (err) {
            console.error("Ошибка при отмене поиска:", err);
            setError('Не удалось отменить поиск. Попробуйте еще раз.');
            setLoading(false);
        }
    }, [user, safeHapticFeedback, safeShowPopup]);

    // Счетчик времени поиска и проверка статуса
    useEffect(() => {
        // Очищаем предыдущие интервалы
        if (timeIntervalRef.current) {
            clearInterval(timeIntervalRef.current);
        }
        if (searchIntervalRef.current) {
            clearInterval(searchIntervalRef.current);
        }

        // Интервал для обновления времени поиска
        if (isSearching) {
            // Запускаем таймер для отсчета времени поиска
            timeIntervalRef.current = setInterval(() => {
                setSearchTime(prev => prev + 1);
            }, 1000);

            // Интервал для проверки статуса поиска
            searchIntervalRef.current = setInterval(async () => {
                if (!user || !user.id) return;

                try {
                    // Проверяем, был ли найден собеседник
                    const chatMatch = await checkChatMatchStatus(user.id);

                    if (chatMatch) {
                        // Собеседник найден!
                        setIsSearching(false);
                        setFoundMatch(true);
                        clearInterval(timeIntervalRef.current);
                        clearInterval(searchIntervalRef.current);

                        // Тактильная обратная связь при найденном совпадении
                        safeHapticFeedback('success');

                        // Задержка перед переходом в чат
                        setTimeout(() => {
                            navigate(`/chat/${chatMatch.id}`);
                        }, 2000);
                    }
                } catch (err) {
                    console.error("Ошибка при проверке статуса поиска:", err);
                }
            }, 2000); // Проверяем каждые 2 секунды
        }

        return () => {
            clearInterval(timeIntervalRef.current);
            clearInterval(searchIntervalRef.current);
        };
    }, [isSearching, user, navigate, safeHapticFeedback]);

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
