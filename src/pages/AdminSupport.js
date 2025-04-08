import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebase';
import { isAdmin } from '../utils/user';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, addDoc, updateDoc, serverTimestamp, limitToLast } from 'firebase/firestore';
import { getTelegramUser, isTelegramApp } from '../utils/telegramUtils';
import '../styles/AdminSupport.css';

const AdminSupport = () => {
    const navigate = useNavigate();
    const { chatId } = useParams();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [supportChats, setSupportChats] = useState([]);
    const [currentChat, setCurrentChat] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [messageText, setMessageText] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentAdminId, setCurrentAdminId] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const messagesEndRef = useRef(null);
    const [sidebarVisible, setSidebarVisible] = useState(true);
    const [isTelegram, setIsTelegram] = useState(false);

    // Проверяем Telegram环境
    useEffect(() => {
        // Определяем, запущено ли приложение в Telegram WebApp
        const isTelegramWebApp = window.Telegram && window.Telegram.WebApp;
        setIsTelegram(!!isTelegramWebApp);
        
        const checkTelegramApp = () => {
            const isInTelegram = isTelegramApp();
            
            if (isInTelegram) {
                // Добавляем класс для Telegram-специфичных стилей
                document.body.classList.add('in-telegram-webapp');
                
                // Расширяем WebApp для лучшего пользовательского опыта
                try {
                    if (window.Telegram && window.Telegram.WebApp) {
                        window.Telegram.WebApp.expand();
                        window.Telegram.WebApp.ready();
                    } else if (typeof WebApp !== 'undefined') {
                        WebApp.expand();
                        WebApp.ready();
                    }
                } catch (err) {
                    console.warn('Ошибка при инициализации Telegram WebApp:', err);
                }
            }
        };
        
        checkTelegramApp();
    }, []);

    // Проверка администраторских прав
    useEffect(() => {
        const checkAdminStatus = async () => {
            try {
                setIsCheckingAuth(true);
                
                // Проверяем, запущено ли приложение локально (в разработке)
                const isLocalhost =
                    window.location.hostname === 'localhost' ||
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname.includes('192.168.');
                
                // В локальной разработке сразу даем админ-права
                if (isLocalhost) {
                    console.log('AdminSupport: Локальная разработка - полные права администратора');
                    setIsAuthorized(true);
                    setCurrentAdminId('admin_local_dev');
                    setIsCheckingAuth(false);
                    return;
                }
                
                // Для не-локальной среды проверяем через isAdmin
                const adminStatus = await isAdmin();
                
                if (adminStatus) {
                    setIsAuthorized(true);
                    // Получаем текущего администратора
                    const telegramUser = getTelegramUser();
                    if (telegramUser && telegramUser.id) {
                        setCurrentAdminId('admin_' + telegramUser.id);
                    } else {
                        setCurrentAdminId('admin_unknown');
                    }
                } else {
                    setIsAuthorized(false);
                }
            } catch (error) {
                console.error("Ошибка при проверке прав администратора:", error);
                
                // При ошибке в localhost все равно даем доступ
                if (window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' || 
                    window.location.hostname.includes('192.168.')) {
                    console.log('AdminSupport: Ошибка при проверке прав, но локальная разработка - доступ разрешен');
                    setIsAuthorized(true);
                    setCurrentAdminId('admin_local_error');
                } else {
                    setIsAuthorized(false);
                }
            } finally {
                setIsCheckingAuth(false);
            }
        };

        checkAdminStatus();
    }, []);

    // Автоматически скрываем сайдбар на мобильных устройствах при открытии чата
    useEffect(() => {
        const handleResize = () => {
            const isMobile = window.innerWidth < 768;
            if (isMobile && chatId) {
                setSidebarVisible(false);
            } else if (!isMobile && !chatId) {
                setSidebarVisible(true);
            }
        };

        // Вызываем сразу для инициализации
        handleResize();

        // Автоматически скрываем сайдбар на мобильных, когда выбран чат
        if (chatId) {
            setSidebarVisible(false);
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [chatId]);

    // Настройка для режима Telegram Mini App
    useEffect(() => {
        if (isTelegram) {
            // Если в Telegram, настраиваем главный контейнер под Safe Area
            const setupSafeArea = () => {
                const container = document.querySelector('.admin-support-container');
                if (container) {
                    // Получаем высоту вьюпорта из Telegram WebApp
                    let viewportHeight = 0;
                    try {
                        if (window.Telegram && window.Telegram.WebApp) {
                            viewportHeight = window.Telegram.WebApp.viewportStableHeight || 0;
                            container.style.setProperty('--tg-viewport-stable-height', `${viewportHeight}px`);
                        } else if (typeof WebApp !== 'undefined') {
                            viewportHeight = WebApp.viewportStableHeight || 0;
                            container.style.setProperty('--tg-viewport-stable-height', `${viewportHeight}px`);
                        }
                    } catch (err) {
                        console.warn('Ошибка при получении viewportStableHeight:', err);
                    }
                }
            };
            
            setupSafeArea();
            
            // Обновляем при изменении размера
            const handleTelegramViewportChange = () => {
                setupSafeArea();
            };
            
            try {
                if (window.Telegram && window.Telegram.WebApp) {
                    window.Telegram.WebApp.onViewportChanged(handleTelegramViewportChange);
                } else if (typeof WebApp !== 'undefined') {
                    WebApp.onViewportChanged(handleTelegramViewportChange);
                }
            } catch (err) {
                console.warn('Ошибка при настройке обработчика изменения вьюпорта:', err);
            }
        }
    }, [isTelegram]);

    // Загрузка списка чатов поддержки
    useEffect(() => {
        if (!isAuthorized) return;

        const supportChatsQuery = query(
            collection(db, "chats"),
            where("type", "==", "support"),
            orderBy("lastMessageTime", "desc")
        );

        const unsubscribe = onSnapshot(supportChatsQuery, (querySnapshot) => {
            const chats = [];
            let totalUnread = 0;

            querySnapshot.forEach((doc) => {
                const chatData = doc.data();
                const chat = {
                    id: doc.id,
                    ...chatData,
                    lastMessageTime: chatData.lastMessageTime ? (typeof chatData.lastMessageTime.toDate === 'function' ? chatData.lastMessageTime.toDate() : chatData.lastMessageTime) : undefined,
                    createdAt: chatData.createdAt ? (typeof chatData.createdAt.toDate === 'function' ? chatData.createdAt.toDate() : chatData.createdAt) : undefined
                };
                
                if (chat.unreadBySupport) {
                    totalUnread++;
                }
                
                chats.push(chat);
            });

            setSupportChats(chats);
            setUnreadCount(totalUnread);
            setLoading(false);
        }, (error) => {
            console.error("Ошибка при загрузке чатов поддержки:", error);
            setError("Не удалось загрузить чаты поддержки");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [isAuthorized]);

    // Загрузка выбранного чата и сообщений
    useEffect(() => {
        if (!isAuthorized || !chatId) return;

        // Загружаем данные о чате
        const loadChatData = async () => {
            try {
                const chatRef = doc(db, "chats", chatId);
                const chatSnap = await getDoc(chatRef);
                
                if (chatSnap.exists()) {
                    const chatData = chatSnap.data();
                    setCurrentChat({
                        id: chatSnap.id,
                        ...chatData,
                        lastMessageTime: chatData.lastMessageTime ? (typeof chatData.lastMessageTime.toDate === 'function' ? chatData.lastMessageTime.toDate() : chatData.lastMessageTime) : undefined,
                        createdAt: chatData.createdAt ? (typeof chatData.createdAt.toDate === 'function' ? chatData.createdAt.toDate() : chatData.createdAt) : undefined
                    });
                    
                    // Отмечаем чат как прочитанный администратором
                    if (chatData.unreadBySupport) {
                        await updateDoc(chatRef, {
                            unreadBySupport: false
                        });
                    }
                    
                    // Загружаем пользовательские данные
                    if (chatData.participants && chatData.participants.length > 0) {
                        const userId = chatData.participants.find(id => id !== 'support');
                        if (userId) {
                            const userRef = doc(db, "users", userId);
                            const userSnap = await getDoc(userRef);
                            if (userSnap.exists()) {
                                const userData = userSnap.data();
                                setCurrentChat(prev => ({
                                    ...prev,
                                    userData: userData
                                }));
                            }
                        }
                    }
                } else {
                    setError("Чат не найден");
                }
            } catch (error) {
                console.error("Ошибка при загрузке данных чата:", error);
                setError("Не удалось загрузить данные чата");
            }
        };

        loadChatData();

        // Подписываемся на сообщения чата
        const messagesQuery = query(
            collection(db, "messages"),
            where("chatId", "==", chatId),
            orderBy("timestamp", "asc"),
            limitToLast(100)
        );

        const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
            const messages = [];
            querySnapshot.forEach((doc) => {
                const messageData = doc.data();
                messages.push({
                    id: doc.id,
                    ...messageData,
                    timestamp: messageData.timestamp ? (typeof messageData.timestamp.toDate === 'function' ? messageData.timestamp.toDate() : messageData.timestamp) : undefined
                });
            });

            setChatMessages(messages);
            
            // Прокручиваем к последнему сообщению
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        }, (error) => {
            console.error("Ошибка при загрузке сообщений:", error);
        });

        return () => unsubscribe();
    }, [isAuthorized, chatId]);

    // Отправка сообщения
    const handleSendMessage = async (e) => {
        e.preventDefault();
        
        if (!messageText.trim() || !currentChat || !currentAdminId) return;
        
        try {
            // Создаем новое сообщение
            const messageData = {
                chatId: currentChat.id,
                senderId: 'support',
                senderName: 'Техническая поддержка',
                text: messageText.trim(),
                timestamp: serverTimestamp(),
                adminId: currentAdminId,
                isAdminMessage: true
            };
            
            // Добавляем сообщение в коллекцию messages
            await addDoc(collection(db, "messages"), messageData);
            
            // Обновляем информацию о чате
            const chatRef = doc(db, "chats", currentChat.id);
            await updateDoc(chatRef, {
                lastMessage: messageText.trim().substring(0, 50) + (messageText.length > 50 ? '...' : ''),
                lastMessageTime: serverTimestamp(),
                lastMessageSenderId: 'support',
                unreadByUser: true,
                unreadBySupport: false
            });
            
            // Очищаем поле ввода
            setMessageText('');
        } catch (error) {
            console.error("Ошибка при отправке сообщения:", error);
            alert("Не удалось отправить сообщение");
        }
    };

    // Форматирование времени сообщения
    const formatMessageTime = (timestamp) => {
        if (!timestamp) return '';
        
        return timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Форматирование даты для заголовка
    const formatDate = (date) => {
        if (!date) return '';
        
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // Переключение видимости сайдбара
    const toggleSidebar = () => {
        setSidebarVisible(!sidebarVisible);
        // Добавляем класс к body для предотвращения прокрутки на мобильных
        if (window.innerWidth < 768) {
            if (sidebarVisible) {
                document.body.classList.remove('sidebar-open');
            } else {
                document.body.classList.add('sidebar-open');
            }
        }
        
        // Тактильный отклик в Telegram
        if (isTelegram) {
            try {
                if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
                    window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
                } else if (typeof WebApp !== 'undefined' && WebApp.HapticFeedback) {
                    WebApp.HapticFeedback.impactOccurred('medium');
                }
            } catch (err) {
                console.warn('Ошибка при вызове тактильного отклика:', err);
            }
        }
    };

    // При выборе чата на мобильных - скрываем сайдбар
    const handleChatSelect = (chatId) => {
        navigate(`/admin/support/${chatId}`);
        if (window.innerWidth < 768) {
            setSidebarVisible(false);
            
            // Тактильный отклик в Telegram
            if (isTelegram) {
                try {
                    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.HapticFeedback) {
                        window.Telegram.WebApp.HapticFeedback.selectionChanged();
                    } else if (typeof WebApp !== 'undefined' && WebApp.HapticFeedback) {
                        WebApp.HapticFeedback.selectionChanged();
                    }
                } catch (err) {
                    console.warn('Ошибка при вызове тактильного отклика:', err);
                }
            }
        }
    };

    // Если проверка прав не завершена, показываем загрузчик
    if (isCheckingAuth) {
        return (
            <div className={`admin-loading ${isTelegram ? 'telegram-webapp' : ''}`}>
                <div className="loading-spinner"></div>
                <p>Проверка прав доступа...</p>
            </div>
        );
    }

    // Если пользователь не админ, показываем сообщение об ошибке
    if (!isAuthorized) {
        return (
            <div className={`admin-unauthorized ${isTelegram ? 'telegram-webapp' : ''}`}>
                <h2>Доступ запрещен</h2>
                <p>У вас нет прав для доступа к панели администрирования.</p>
                <button 
                    className="admin-button"
                    onClick={() => navigate('/home')}
                >
                    На главную
                </button>
            </div>
        );
    }

    // Если произошла ошибка, показываем сообщение
    if (error) {
        return (
            <div className={`admin-error ${isTelegram ? 'telegram-webapp' : ''}`}>
                <h2>Ошибка</h2>
                <p>{error}</p>
                <button 
                    className="admin-button"
                    onClick={() => navigate('/admin')}
                >
                    Вернуться
                </button>
            </div>
        );
    }

    return (
        <div className={`admin-support-container ${!sidebarVisible ? 'sidebar-hidden' : ''} ${isTelegram ? 'telegram-webapp' : ''}`}>
            <div className={`admin-support-sidebar ${sidebarVisible ? 'visible' : 'hidden'}`}>
                <div className="admin-support-header">
                    <h1>Чаты поддержки</h1>
                    <span className="unread-badge">{unreadCount > 0 ? unreadCount : ''}</span>
                </div>

                <div className="admin-support-chats">
                    {loading ? (
                        <div className="loading-indicator">
                            <div className="loading-spinner"></div>
                            <p>Загрузка чатов...</p>
                        </div>
                    ) : supportChats.length === 0 ? (
                        <div className="no-chats-message">
                            <p>Нет активных чатов поддержки</p>
                        </div>
                    ) : (
                        supportChats.map(chat => {
                            // Получаем ID пользователя (не support)
                            const userId = chat.participants.find(id => id !== 'support');
                            return (
                                <div 
                                    key={chat.id} 
                                    className={`support-chat-item ${chat.id === chatId ? 'active' : ''} ${chat.unreadBySupport ? 'unread' : ''}`}
                                    onClick={() => handleChatSelect(chat.id)}
                                >
                                    <div className="support-chat-avatar">
                                        {chat.participantsData && chat.participantsData[userId]?.name
                                            ? chat.participantsData[userId].name.substring(0, 2).toUpperCase()
                                            : userId?.substring(0, 2).toUpperCase() || 'U'}
                                    </div>
                                    <div className="support-chat-details">
                                        <div className="support-chat-header">
                                            <h3>{
                                                chat.participantsData && chat.participantsData[userId]?.name
                                                    ? chat.participantsData[userId].name
                                                    : 'Пользователь'
                                            }</h3>
                                            <span className="support-chat-time">
                                                {chat.lastMessageTime ? formatMessageTime(chat.lastMessageTime) : ''}
                                            </span>
                                        </div>
                                        <p className="support-chat-preview">
                                            {chat.lastMessage || 'Нет сообщений'}
                                        </p>
                                        {chat.unreadBySupport && (
                                            <span className="unread-indicator"></span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="admin-support-actions">
                    <button
                        className="admin-button"
                        onClick={() => navigate('/admin')}
                    >
                        Назад
                    </button>
                </div>
            </div>

            <div className="admin-support-chat">
                <button 
                    className="toggle-sidebar-button" 
                    onClick={toggleSidebar}
                    title={sidebarVisible ? "Скрыть список чатов" : "Показать список чатов"}
                    aria-label={sidebarVisible ? "Скрыть список чатов" : "Показать список чатов"}
                >
                    {sidebarVisible ? '◀' : '▶'}
                </button>

                {!chatId ? (
                    <div className="no-chat-selected">
                        <h2>Выберите чат</h2>
                        <p>Выберите чат из списка для просмотра сообщений</p>
                    </div>
                ) : !currentChat ? (
                    <div className="loading-indicator centered">
                        <div className="loading-spinner"></div>
                        <p>Загрузка чата...</p>
                    </div>
                ) : (
                    <div className="chat-container">
                        <div className="chat-header">
                            <div className="chat-header-info">
                                <h2>
                                    {currentChat.userData?.name || 'Пользователь'}
                                </h2>
                                <p>
                                    {currentChat.createdAt 
                                        ? `Чат создан: ${formatDate(currentChat.createdAt)}`
                                        : 'Дата создания неизвестна'}
                                </p>
                            </div>
                            <div className="chat-header-actions">
                                <button
                                    className="admin-button"
                                    onClick={() => navigate('/admin')}
                                >
                                    Назад в Панель
                                </button>
                            </div>
                        </div>

                        <div className="chat-messages">
                            {chatMessages.length === 0 ? (
                                <div className="no-messages">
                                    <p>Нет сообщений</p>
                                </div>
                            ) : (
                                <>
                                    {chatMessages.map(message => (
                                        <div 
                                            key={message.id}
                                            className={`message ${message.senderId === 'support' ? 'admin-message' : 'user-message'}`}
                                        >
                                            <div className="message-content">
                                                <div className="message-header">
                                                    <span className="message-sender">
                                                        {message.senderId === 'support' ? 'Поддержка' : (currentChat.userData?.name || 'Пользователь')}
                                                    </span>
                                                    <span className="message-time">
                                                        {message.timestamp ? formatMessageTime(message.timestamp) : ''}
                                                    </span>
                                                </div>
                                                <p className="message-text">{message.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>

                        <form className="chat-input" onSubmit={handleSendMessage}>
                            <input
                                type="text"
                                placeholder="Введите сообщение..."
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                            />
                            <button 
                                type="submit" 
                                disabled={!messageText.trim()}
                            >
                                Отправить
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSupport;
