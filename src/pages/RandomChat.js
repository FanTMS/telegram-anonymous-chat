import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { findRandomChat, cancelSearch, checkChatMatchStatus } from '../utils/chatService';
import { useTelegram } from '../hooks/useTelegram';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, query, where, getDocs, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import IndexCreationHelper from '../components/IndexCreationHelper';
import DatabaseLoadingIndicator from '../components/DatabaseLoadingIndicator';
import '../styles/RandomChat.css';

const RandomChat = () => {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [isSearching, setIsSearching] = useState(false);
    const [searchTime, setSearchTime] = useState(0);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [foundMatch, setFoundMatch] = useState(false);
    const [showIndexInstructions, setShowIndexInstructions] = useState(false);
    const [dbLoading, setDbLoading] = useState(true);
    const [dbConnectionChecked, setDbConnectionChecked] = useState(false);

    const navigate = useNavigate();
    const { hapticFeedback, showPopup } = useTelegram();

    const timeIntervalRef = useRef(null);
    const searchIntervalRef = useRef(null);

    // Проверка соединения с базой данных
    useEffect(() => {
        const checkDbConnection = async () => {
            try {
                // Устанавливаем таймаут для проверки
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Таймаут соединения с базой данных')), 10000);
                });

                // Запрос к базе данных
                const dbCheckPromise = getDoc(doc(db, 'system', 'config'));

                // Ждем результат с таймаутом
                await Promise.race([timeoutPromise, dbCheckPromise]);
                setDbConnectionChecked(true);
                setDbLoading(false);
            } catch (error) {
                console.error('Ошибка при проверке подключения к БД:', error);
                // Все равно устанавливаем флаг проверки, чтобы показать интерфейс с ошибкой
                setDbConnectionChecked(true);
                setDbLoading(false);
                setError('Ошибка подключения к базе данных. Пожалуйста, проверьте соединение с интернетом и перезагрузите страницу.');
            }
        };

        checkDbConnection();
    }, []);

    // Обработчик завершения загрузки базы данных
    const handleDbLoadComplete = () => {
        setDbLoading(false);
    };

    // Запуск поиска собеседника
    const startSearch = useCallback(async () => {
        try {
            if (!isAuthenticated || !user) {
                setError("Авторизуйтесь для поиска собеседника");
                return;
            }

            setLoading(true);
            setIsSearching(true);
            setError(null);

            // Тактильная обратная связь при начале поиска
            if (hapticFeedback) hapticFeedback('impact', 'light');

            // Обновляем статус пользователя в базе данных как "ищет собеседника"
            await updateUserSearchStatus(user.id, true);

            const chatId = await findRandomChat(user.id);

            if (chatId) {
                // Собеседник найден сразу
                setFoundMatch(true);

                // Тактильная обратная связь при найденном совпадении
                if (hapticFeedback) hapticFeedback('notification', null, 'success');

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

                // Если ошибка связана с индексами, показываем инструкции
                if (err.message.includes('индекс') || err.message.includes('index')) {
                    setShowIndexInstructions(true);
                }
            } else {
                setError('Произошла ошибка при поиске собеседника. Попробуйте позже.');
            }

            // Вибрация при ошибке
            if (hapticFeedback) hapticFeedback('notification', null, 'error');
        }
    }, [user, isAuthenticated, navigate, hapticFeedback]);

    // Отмена поиска
    const stopSearch = useCallback(async () => {
        try {
            if (!isAuthenticated || !user) return;

            setLoading(true);
            await cancelSearch(user.id);
            // Обновляем статус пользователя в базе данных
            await updateUserSearchStatus(user.id, false);
            
            setIsSearching(false);
            setSearchTime(0);
            setLoading(false);

            // Тактильная обратная связь
            if (hapticFeedback) hapticFeedback('impact', 'medium');

            // Показываем уведомление об отмене поиска
            if (showPopup) {
                await showPopup({
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
    }, [user, isAuthenticated, hapticFeedback, showPopup]);

    // Обновление статуса поиска пользователя в базе данных
    const updateUserSearchStatus = async (userId, isSearching) => {
        try {
            if (!userId) {
                console.warn("Невозможно обновить статус поиска: ID пользователя не указан");
                return;
            }
            
            const userStatusRef = doc(db, "userStatus", userId);
            const userStatusDoc = await getDoc(userStatusRef);
            
            if (userStatusDoc.exists()) {
                await setDoc(userStatusRef, { 
                    isSearching,
                    lastUpdated: new Date()
                }, { merge: true });
            } else {
                await setDoc(userStatusRef, {
                    userId,
                    isSearching,
                    lastUpdated: new Date(),
                    isOnline: true
                });
            }
            
            // Проверяем существование пользователя и создаем его, если необходимо
            const userRef = doc(db, "users", userId);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                console.log(`Создаем документ пользователя ${userId}`);
                await setDoc(userRef, {
                    id: userId,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            }
        } catch (err) {
            console.error("Ошибка при обновлении статуса пользователя:", err);
            // Не прерываем процесс из-за ошибки статуса
        }
    };

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
                if (!isAuthenticated || !user) return;

                try {
                    // Проверяем, был ли найден собеседник
                    const chatMatch = await checkChatMatchStatus(user.id);

                    if (chatMatch) {
                        // Собеседник найден!
                        setIsSearching(false);
                        setFoundMatch(true);
                        clearInterval(timeIntervalRef.current);
                        clearInterval(searchIntervalRef.current);

                        // Обновляем статус пользователя в базе данных
                        await updateUserSearchStatus(user.id, false);

                        // Тактильная обратная связь при найденном совпадении
                        if (hapticFeedback) hapticFeedback('notification', null, 'success');

                        // Задержка перед переходом в чат
                        setTimeout(() => {
                            navigate(`/chat/${chatMatch.id}`);
                        }, 2000);
                    }
                } catch (err) {
                    console.error("Ошибка при проверке статуса поиска:", err);
                    // Если ошибка связана с неопределенным значением или индексом, не прерываем поиск
                    if (err.message && (
                        err.message.includes('undefined') || 
                        err.message.includes('index') || 
                        err.message.includes('permission')
                    )) {
                        // Ничего не делаем, просто продолжаем попытки
                    } else {
                        // Для других ошибок останавливаем поиск и показываем ошибку
                        setIsSearching(false);
                        clearInterval(timeIntervalRef.current);
                        clearInterval(searchIntervalRef.current);
                        setError(`Ошибка поиска: ${err.message}`);
                    }
                }
            }, 2000); // Проверяем каждые 2 секунды
        }

        return () => {
            clearInterval(timeIntervalRef.current);
            clearInterval(searchIntervalRef.current);
        };
    }, [isSearching, user, isAuthenticated, navigate, hapticFeedback]);

    // Форматирование времени поиска
    const formatSearchTime = () => {
        const minutes = Math.floor(searchTime / 60);
        const seconds = searchTime % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Отображаем индикатор загрузки базы данных
    if (dbLoading) {
        return <DatabaseLoadingIndicator onComplete={handleDbLoadComplete} />;
    }

    return (
        <div className="random-chat-container">
            <h1 className="random-chat-title">Случайный собеседник</h1>

            {error && (
                <div className="error-message">
                    {error}
                    {showIndexInstructions && <IndexCreationHelper error={error} />}
                </div>
            )}

            {!isAuthenticated && !authLoading ? (
                <div className="auth-warning">
                    <div className="auth-warning-icon">⚠️</div>
                    <p>Авторизуйтесь для поиска собеседника</p>
                    <button 
                        className="action-button auth-button"
                        onClick={() => navigate('/login')}
                    >
                        Авторизоваться
                    </button>
                </div>
            ) : (
                loading ? (
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
                            <>
                                <div className="search-icon">🔍</div>
                                <button
                                    className="action-button search-button"
                                    onClick={startSearch}
                                    disabled={loading || !isAuthenticated}
                                >
                                    Найти собеседника
                                </button>
                            </>
                        )}
                    </div>
                )
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
