import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase';
import { doc, getDocs, query, where, collection, onSnapshot, orderBy, limit, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import DatabaseLoadingIndicator from './DatabaseLoadingIndicator';
import '../styles/AnonymousChats.css';

const AnonymousChats = () => {
    const { user, isAuthenticated } = useAuth();
    const [activeChats, setActiveChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dbLoading, setDbLoading] = useState(true);
    const navigate = useNavigate();

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
                setDbLoading(false);
            } catch (error) {
                console.error('Ошибка при проверке подключения к БД:', error);
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

    // Загрузка активных анонимных чатов
    useEffect(() => {
        if (!isAuthenticated || !user || dbLoading) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            
            // Запрос на получение активных анонимных чатов пользователя
            const chatsQuery = query(
                collection(db, 'chats'),
                where('participants', 'array-contains', user.id),
                where('isActive', '==', true),
                where('isAnonymous', '==', true),
                orderBy('updatedAt', 'desc'),
                limit(10)
            );
            
            // Подписка на обновления чатов
            const unsubscribe = onSnapshot(chatsQuery, async (snapshot) => {
                const chatsData = [];
                
                for (const doc of snapshot.docs) {
                    const chatData = doc.data();
                    
                    // Получаем ID собеседника
                    const partnerId = chatData.participants.find(id => id !== user.id);
                    let partnerInfo = { name: 'Анонимный собеседник' };
                    
                    // Попытка получить информацию о собеседнике
                    if (partnerId && !chatData.isFullyAnonymous) {
                        try {
                            const partnerDoc = await getDocs(query(
                                collection(db, 'users'),
                                where('id', '==', partnerId)
                            ));
                            
                            if (!partnerDoc.empty) {
                                const userData = partnerDoc.docs[0].data();
                                partnerInfo = {
                                    name: userData.displayName || 'Собеседник',
                                    avatar: userData.photoURL
                                };
                            }
                        } catch (err) {
                            console.error('Ошибка при получении данных собеседника:', err);
                        }
                    }
                    
                    // Форматируем и добавляем чат в список
                    chatsData.push({
                        id: doc.id,
                        partner: partnerInfo,
                        lastMessage: chatData.lastMessage || null,
                        updatedAt: chatData.updatedAt?.toDate() || new Date(),
                        unreadCount: (chatData.unreadCount && chatData.unreadCount[user.id]) || 0
                    });
                }
                
                setActiveChats(chatsData);
                setLoading(false);
            }, (err) => {
                console.error('Ошибка при получении чатов:', err);
                setError('Не удалось загрузить список активных чатов');
                setLoading(false);
            });
            
            return () => unsubscribe();
        } catch (err) {
            console.error('Ошибка при настройке подписки на чаты:', err);
            setError('Ошибка при загрузке чатов');
            setLoading(false);
        }
    }, [user, isAuthenticated, dbLoading]);

    // Обновление статуса пользователя (онлайн)
    useEffect(() => {
        if (!isAuthenticated || !user || dbLoading) return;
        
        const updateOnlineStatus = async () => {
            try {
                const userStatusRef = doc(db, 'userStatus', user.id);
                await setDoc(userStatusRef, {
                    isOnline: true,
                    lastSeen: serverTimestamp(),
                    userId: user.id
                }, { merge: true });
                
                // Обновление статуса при закрытии/перезагрузке страницы
                const handleBeforeUnload = async () => {
                    await setDoc(userStatusRef, {
                        isOnline: false,
                        lastSeen: serverTimestamp()
                    }, { merge: true });
                };
                
                window.addEventListener('beforeunload', handleBeforeUnload);
                
                return () => {
                    window.removeEventListener('beforeunload', handleBeforeUnload);
                    setDoc(userStatusRef, {
                        isOnline: false,
                        lastSeen: serverTimestamp()
                    }, { merge: true });
                };
            } catch (err) {
                console.error('Ошибка при обновлении статуса пользователя:', err);
            }
        };
        
        updateOnlineStatus();
    }, [user, isAuthenticated, dbLoading]);

    // Переход к поиску собеседника
    const handleStartSearch = () => {
        navigate('/random-chat');
    };

    // Переход к существующему чату
    const handleOpenChat = (chatId) => {
        navigate(`/chat/${chatId}`);
    };

    // Форматирование времени последнего сообщения
    const formatMessageTime = (timestamp) => {
        if (!timestamp) return '';
        
        const messageDate = new Date(timestamp);
        const now = new Date();
        const diffDays = Math.floor((now - messageDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            // Сегодня - показываем только время
            return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            // Вчера
            return 'Вчера';
        } else if (diffDays < 7) {
            // Дни недели
            const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
            return days[messageDate.getDay()];
        } else {
            // Дата
            return messageDate.toLocaleDateString();
        }
    };

    // Отображаем индикатор загрузки базы данных
    if (dbLoading) {
        return <DatabaseLoadingIndicator onComplete={handleDbLoadComplete} />;
    }

    // Отображение загрузки
    if (loading) {
        return (
            <div className="anonymous-chats-loading">
                <div className="loading-spinner"></div>
                <p>Загрузка чатов...</p>
            </div>
        );
    }

    // Отображение ошибки
    if (error) {
        return (
            <div className="anonymous-chats-error">
                <div className="error-icon">⚠️</div>
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>Повторить</button>
            </div>
        );
    }

    // Отображение требования авторизации
    if (!isAuthenticated) {
        return (
            <div className="anonymous-chats-auth">
                <div className="auth-icon">🔒</div>
                <h2>Требуется авторизация</h2>
                <p>Для доступа к анонимным чатам необходимо авторизоваться</p>
                <button onClick={() => navigate('/login')}>Авторизоваться</button>
            </div>
        );
    }

    return (
        <div className="anonymous-chats-container">
            <h1 className="page-title">Анонимные чаты</h1>
            
            <div className="search-button-container">
                <button className="search-button" onClick={handleStartSearch}>
                    <span className="search-icon">🔍</span>
                    Найти случайного собеседника
                </button>
            </div>
            
            {activeChats.length > 0 ? (
                <div className="active-chats">
                    <h2 className="section-title">Активные чаты</h2>
                    <div className="chats-list">
                        {activeChats.map(chat => (
                            <div 
                                key={chat.id} 
                                className="chat-item" 
                                onClick={() => handleOpenChat(chat.id)}
                            >
                                <div className="chat-avatar">
                                    {chat.partner.avatar ? (
                                        <img src={chat.partner.avatar} alt="Аватар собеседника" />
                                    ) : (
                                        <div className="chat-initials">
                                            {chat.partner.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="chat-info">
                                    <div className="chat-header">
                                        <h3 className="chat-name">{chat.partner.name}</h3>
                                        <span className="chat-time">
                                            {chat.lastMessage ? formatMessageTime(chat.updatedAt) : ''}
                                        </span>
                                    </div>
                                    <p className="chat-last-message">
                                        {chat.lastMessage ? 
                                            (chat.lastMessage.senderId === user.id ? 
                                                `Вы: ${chat.lastMessage.text}` : 
                                                chat.lastMessage.text) 
                                            : 'Нет сообщений'}
                                    </p>
                                    {chat.unreadCount > 0 && (
                                        <div className="unread-badge">{chat.unreadCount}</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="empty-chats">
                    <div className="empty-icon">💬</div>
                    <p>У вас пока нет активных анонимных чатов</p>
                    <p className="empty-subtitle">Нажмите кнопку поиска, чтобы найти собеседника</p>
                </div>
            )}
            
            <div className="info-block">
                <h3>Об анонимных чатах</h3>
                <p>Анонимные чаты позволяют общаться с незнакомыми людьми, сохраняя конфиденциальность.</p>
                <ul>
                    <li>Собеседники подбираются случайным образом</li>
                    <li>Ваши личные данные не передаются собеседнику</li>
                    <li>В любой момент вы можете завершить диалог</li>
                </ul>
            </div>
        </div>
    );
};

export default AnonymousChats; 