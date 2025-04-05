import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { findRandomChat, cancelSearch, checkSearchStatus, getUserChats } from '../utils/chatService';
import WebApp from '@twa-dev/sdk';
import { checkFirebaseConnection } from '../utils/firebaseConnectionChecker';
import '../styles/RandomChat.css';

const RandomChat = ({ user }) => {
    const [isSearching, setIsSearching] = useState(false);
    const [searchTime, setSearchTime] = useState(0);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Функция поиска собеседника
    const startSearch = useCallback(async () => {
        if (!user || !user.telegramId) {
            setError('Пользователь не авторизован');
            return;
        }

        try {
            // Проверяем соединение с Firebase
            const isConnected = await checkFirebaseConnection();
            if (!isConnected) {
                setError('Не удалось установить соединение с сервером. Проверьте подключение к интернету.');
                return;
            }

            setError(null);
            setIsSearching(true);
            setSearchTime(0);

            // Тактильная обратная связь (если доступна)
            if (WebApp && WebApp.HapticFeedback) {
                WebApp.HapticFeedback.impactOccurred('light');
            }

            // Показываем всплывающее сообщение о начале поиска
            if (WebApp && WebApp.showPopup) {
                WebApp.showPopup({
                    title: 'Поиск собеседника',
                    message: 'Ищем собеседника для вас. Это может занять несколько минут.',
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

                // Показываем уведомление о найденном собеседнике
                if (WebApp && WebApp.showPopup) {
                    WebApp.showPopup({
                        title: 'Собеседник найден!',
                        message: 'Мы нашли для вас собеседника. Переходим в чат...',
                        buttons: [{ text: "Начать общение" }]
                    });
                }

                // Небольшая задержка перед переходом, чтобы пользователь успел увидеть уведомление
                setTimeout(() => {
                    // Переходим в чат
                    navigate(`/chat/${chatId}`);
                }, 1000);
            }
            // Иначе пользователь добавлен в очередь поиска
        } catch (err) {
            console.error("Ошибка поиска:", err);

            // Особая обработка ошибки индекса
            if (err.message && err.message.includes('Требуется создание индекса')) {
                setError('Для работы приложения требуется создание индекса в Firebase. Пожалуйста, обратитесь к администратору.');

                // Если вы администратор, добавьте код ниже для отображения инструкции по созданию индекса
                console.log("Инструкция для администратора: " + err.message);
            } else if (err.message && typeof err.message === 'string') {
                setError(`Ошибка: ${err.message}`);
            } else {
                setError('Произошла ошибка при поиске собеседника. Попробуйте позже.');
            }

            setIsSearching(false);

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

            await cancelSearch(user.telegramId);
            setIsSearching(false);
            setSearchTime(0);

            // Тактильная обратная связь
            if (WebApp && WebApp.HapticFeedback) {
                WebApp.HapticFeedback.impactOccurred('medium');
            }
        } catch (err) {
            console.error("Ошибка при отмене поиска:", err);
        }
    }, [user]);

    // Проверка статуса поиска при загрузке компонента
    useEffect(() => {
        const checkStatus = async () => {
            if (!user || !user.telegramId) return;

            try {
                const isInQueue = await checkSearchStatus(user.telegramId);
                if (isInQueue) {
                    setIsSearching(true);
                }
            } catch (err) {
                console.error("Ошибка при проверке статуса:", err);
            }
        };

        checkStatus();
    }, [user]);

    // Периодическая проверка результатов поиска
    useEffect(() => {
        let searchInterval;
        let timeInterval;

        if (isSearching) {
            // Счетчик времени поиска
            timeInterval = setInterval(() => {
                setSearchTime(prev => prev + 1);
            }, 1000);

            // Проверяем каждые 3 секунды, не появился ли чат
            searchInterval = setInterval(async () => {
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
                            // Переходим в чат
                            navigate(`/chat/${latestChat.id}`);
                            return;
                        }
                    }
                } catch (err) {
                    console.error("Ошибка при проверке статуса поиска:", err);
                }
            }, 3000);
        }

        return () => {
            if (searchInterval) clearInterval(searchInterval);
            if (timeInterval) clearInterval(timeInterval);
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

            <div className="search-status">
                {isSearching ? (
                    <>
                        <div className="search-animation">
                            <div className="search-pulse"></div>
                        </div>
                        <p className="search-text">Поиск собеседника...</p>
                        <p className="search-time">Время поиска: {formatSearchTime()}</p>
                        <button
                            className="action-button cancel-button"
                            onClick={stopSearch}
                        >
                            Отменить поиск
                        </button>
                    </>
                ) : (
                    <button
                        className="action-button search-button"
                        onClick={startSearch}
                    >
                        Найти собеседника
                    </button>
                )}
            </div>

            <div className="search-tips">
                <h3>Советы для общения:</h3>
                <ul>
                    <li>Будьте вежливы и уважительны к собеседнику</li>
                    <li>Не делитесь личной информацией</li>
                    <li>Если собеседник нарушает правила, вы можете пожаловаться</li>
                </ul>
            </div>
        </div>
    );
};

export default RandomChat;
