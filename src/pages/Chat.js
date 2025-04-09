import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
    getChatById,
    getChatMessages,
    sendChatMessage,
    checkChatMatchStatus,
    endChat
} from '../utils/chatService';
import { addSupportChat } from '../utils/supportService';
import UserStatus from '../components/UserStatus';
import { useToast } from '../components/Toast';
import { collection, query, orderBy, limit, getDocs, onSnapshot, doc, where, updateDoc, serverTimestamp, getDoc, arrayUnion, arrayRemove, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import '../styles/Chat.css';
import { ensureUserFields } from '../utils/userStructureMigration';
import ReportDialog from '../components/ReportDialog';

const Chat = () => {
    const { chatId } = useParams();
    const { user, loading } = useAuth();
    const { showToast } = useToast();

    // Define userId at the component level for consistent access
    const userId = user?.uid || user?.id;

    const [chat, setChat] = useState(null);
    const [partnerInfo, setPartnerInfo] = useState({});
    const [messages, setMessages] = useState([]);
    const [error, setError] = useState(null);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isPartnerTyping, setIsPartnerTyping] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [showEndChatModal, setShowEndChatModal] = useState(false);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const [unsubscribeChat, setUnsubscribeChat] = useState(null);
    const [unsubscribeMessages, setUnsubscribeMessages] = useState(null);
    const [typingTimeout, setTypingTimeout] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [friendRequestStatus, setFriendRequestStatus] = useState('none'); // 'none', 'sent', 'received', 'friends'
    const [showReportDialog, setShowReportDialog] = useState(false);

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const inputRef = useRef(null);
    const chatContainerRef = useRef(null);
    const navigate = useNavigate();

    // Усовершенствованное форматирование времени с учетом временных зон и дополнительных проверок
    const formatMessageTime = (timestamp) => {
        if (!timestamp) return '';
        
        try {
            let date;
            
            // Обработка разных форматов времени
            if (timestamp.toDate) {
                // Если это объект Firestore Timestamp
                date = timestamp.toDate();
            } else if (timestamp instanceof Date) {
                date = timestamp;
            } else if (typeof timestamp === 'string') {
                date = new Date(timestamp);
            } else if (typeof timestamp === 'number') {
                date = new Date(timestamp);
            } else {
                // Если не удалось определить формат
                return 'Недавно';
            }
            
            // Проверяем валидность даты
            if (isNaN(date.getTime())) {
                return 'Недавно';
            }
            
            const now = new Date();
            const isToday = date.toDateString() === now.toDateString();
            const isYesterday = new Date(now - 86400000).toDateString() === date.toDateString();
            
            // Форматируем время в зависимости от даты
            if (isToday) {
                return date.toLocaleTimeString(navigator.language || 'ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } else if (isYesterday) {
                return 'Вчера, ' + date.toLocaleTimeString(navigator.language || 'ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } else {
                return date.toLocaleDateString(navigator.language || 'ru-RU', {
                    day: '2-digit',
                    month: '2-digit'
                }) + ', ' + date.toLocaleTimeString(navigator.language || 'ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        } catch (error) {
            console.error('Ошибка при форматировании времени:', error);
            return 'Недавно';
        }
    };

    const getInitials = (name) => {
        if (!name) return '';
        return name
            .split(' ')
            .map(part => part.charAt(0))
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    // Улучшенный механизм определения открытия клавиатуры с учетом различных мобильных устройств
    useEffect(() => {
        const handleResize = () => {
            // Используем более надежный метод определения открытия клавиатуры
            const visualViewport = window.visualViewport || { height: window.innerHeight };
            const windowHeight = window.innerHeight;
            const viewportHeight = visualViewport.height;
            
            // Считаем, что клавиатура открыта, если высота области просмотра существенно меньше высоты окна
            const keyboardThreshold = 0.75; // 75% от полной высоты
            const isKeyboard = viewportHeight < windowHeight * keyboardThreshold;
            
            // Вычисляем примерную высоту клавиатуры
            const keyboardOpenHeight = isKeyboard ? windowHeight - viewportHeight : 0;
            
            setIsKeyboardOpen(isKeyboard);
            if (isKeyboard) {
                setKeyboardHeight(keyboardOpenHeight);
                document.documentElement.style.setProperty('--keyboard-height', `${keyboardOpenHeight}px`);
                if (chatContainerRef.current) {
                    chatContainerRef.current.classList.add('keyboard-open');
                }
                // При открытии клавиатуры прокручиваем к последнему сообщению
                setTimeout(() => scrollToBottom(true), 300);
            } else {
                setKeyboardHeight(0);
                document.documentElement.style.setProperty('--keyboard-height', '0px');
                if (chatContainerRef.current) {
                    chatContainerRef.current.classList.remove('keyboard-open');
                }
            }
        };

        // Обработчики фокуса на поле ввода (для iOS)
        const handleFocus = () => {
            setTimeout(() => {
                if (messagesEndRef.current) {
                    messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
                }
                if (chatContainerRef.current) {
                    chatContainerRef.current.classList.add('keyboard-open');
                }
                setIsKeyboardOpen(true);
            }, 300);
        };

        const handleBlur = () => {
            setTimeout(() => {
                if (chatContainerRef.current) {
                    chatContainerRef.current.classList.remove('keyboard-open');
                }
                setIsKeyboardOpen(false);
            }, 100);
        };

        // Используем visualViewport API для точного определения размера области просмотра
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
            window.visualViewport.addEventListener('scroll', handleResize);
        } else {
            window.addEventListener('resize', handleResize);
        }
        
        // Добавляем обработчики к полю ввода
        if (inputRef.current) {
            inputRef.current.addEventListener('focus', handleFocus);
            inputRef.current.addEventListener('blur', handleBlur);
        }

        // Начальная проверка
        handleResize();

        return () => {
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleResize);
                window.visualViewport.removeEventListener('scroll', handleResize);
            } else {
                window.removeEventListener('resize', handleResize);
            }
            if (inputRef.current) {
                inputRef.current.removeEventListener('focus', handleFocus);
                inputRef.current.removeEventListener('blur', handleBlur);
            }
        };
    }, []);

    useEffect(() => {
        const loadChatDetails = async () => {
            setIsLoading(true);
            let loadErrors = [];
            
            try {
                if (!chatId) {
                    setError('ID чата не определен');
                    return;
                }
                
                // Проверяем доступность Firestore
                try {
                    const dbTestRef = doc(db, "system", "status");
                    await getDoc(dbTestRef);
                } catch (dbError) {
                    console.error('Ошибка подключения к базе данных:', dbError);
                    throw new Error('Не удалось подключиться к базе данных. Проверьте ваше подключение к интернету.');
                }
                
                // Получаем информацию о чате
                const chatData = await getChatById(chatId);
                
                if (!chatData) {
                    setError('Чат не найден или был удален');
                    return;
                }
                
                // Проверка на активность чата
                if (!chatData.isActive && chatData.status === 'ended') {
                    setChat({...chatData, isEnded: true});
                    showToast('Этот чат был завершен', 'info');
                } else {
                    setChat(chatData);
                }
                
                // Настраиваем слушатель обновлений чата в реальном времени (например, для статуса печати)
                const unsubscribe = onSnapshot(doc(db, 'chats', chatId), (doc) => {
                    if (doc.exists()) {
                        const chatData = { id: doc.id, ...doc.data() };
                        setChat(chatData);
                        
                        // Проверяем статус печати
                        if (chatData.typingStatus) {
                            const partnerId = chatData.participants.find(id => id !== userId);
                            setIsPartnerTyping(chatData.typingStatus[partnerId] === true);
                        } else {
                            setIsPartnerTyping(false);
                        }
                    }
                }, (error) => {
                    console.error('Ошибка при получении обновлений чата:', error);
                });
                
                setUnsubscribeChat(() => unsubscribe);
                
                // Настраиваем слушатель сообщений в реальном времени
                setupMessagesSubscription();
                
                // Проверяем статус дружбы только если это не чат поддержки
                if (chatData.participants && chatData.participants.length > 0) {
                    const partnerId = chatData.participants.find(id => id !== userId);
                    await checkFriendStatus(partnerId);
                }
            } catch (error) {
                console.error('Ошибка при загрузке данных чата:', error);
                setError(`Ошибка при загрузке чата: ${error.message}`);
            } finally {
                setIsLoading(false);
            }
        };

        loadChatDetails();
        
        // Очистка при размонтировании компонента
        return () => {
            if (unsubscribeChat) {
                unsubscribeChat();
            }
            if (unsubscribeMessages) {
                unsubscribeMessages();
            }
        };
    }, [chatId, user, navigate, showToast]);

    // Настраиваем слушатель сообщений в реальном времени
    const setupMessagesSubscription = () => {
        if (!chatId) return;
        
        // Отписываемся от предыдущего слушателя, если он существует
        if (unsubscribeMessages) {
            unsubscribeMessages();
        }
        
        try {
            const messagesQuery = query(
                collection(db, "messages"),
                where("chatId", "==", chatId),
                orderBy("timestamp", "asc")
            );
            
            console.log('Настройка подписки на сообщения в чате:', chatId);
            
            const unsubscribe = onSnapshot(messagesQuery, async (querySnapshot) => {
                // Оптимизированное обновление сообщений
                let newMessages = [];
                let hasChanges = false;
                
                // Создаем карту существующих сообщений для быстрого поиска
                const existingMessagesMap = {};
                messages.forEach(msg => {
                    if (msg.id && !msg.id.startsWith('temp-')) {
                        existingMessagesMap[msg.id] = msg;
                    }
                });
                
                // Проверяем новые и измененные сообщения
                querySnapshot.forEach((doc) => {
                    const messageData = {
                        id: doc.id,
                        ...doc.data(),
                        timestamp: doc.data().timestamp?.toDate() || new Date()
                    };
                    
                    // Безопасно удаляем telegramData для предотвращения ошибки React #31
                    if (messageData.telegramData) {
                        // Сохраняем нужные данные из telegramData, если они требуются
                        if (messageData.telegramData.firstName) {
                            messageData.tgFirstName = messageData.telegramData.firstName;
                        }
                        // Полностью удаляем объект telegramData
                        delete messageData.telegramData;
                    }
                    
                    // Если сообщение новое или изменилось, отмечаем, что есть изменения
                    if (!existingMessagesMap[doc.id]) {
                        hasChanges = true;
                    }
                    
                    newMessages.push(messageData);
                });
                
                // Если есть новые или измененные сообщения, обновляем состояние
                if (hasChanges || newMessages.length !== messages.length) {
                    // Заменяем временные сообщения финальными версиями
                    const tempMessages = messages.filter(msg => msg.id.startsWith('temp-'));
                    if (tempMessages.length > 0) {
                        // Находим соответствующие финальные сообщения для временных (по тексту и отправителю)
                        tempMessages.forEach(tempMsg => {
                            const matchingFinalMsg = newMessages.find(msg => 
                                msg.text === tempMsg.text && 
                                msg.senderId === tempMsg.senderId &&
                                !msg.id.startsWith('temp-')
                            );
                            
                            // Если нашли соответствующее финальное сообщение, удаляем временное
                            if (matchingFinalMsg) {
                                newMessages = newMessages.filter(msg => msg.id !== tempMsg.id);
                            }
                        });
                    }
                    
                    // Mark messages as read
                    if (user && userId && newMessages.length > 0) {
                        markChatAsRead();
                    }
                    
                    setMessages(newMessages);
                    
                    // Определяем, нужно ли прокручивать вниз
                    const container = messagesContainerRef.current;
                    if (container) {
                        const { scrollHeight, scrollTop, clientHeight } = container;
                        const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
                        
                        if (isNearBottom) {
                            // Используем requestAnimationFrame для более плавного скролла
                            requestAnimationFrame(() => {
                                scrollToBottom(true);
                            });
                        }
                    }
                }
            }, (error) => {
                console.error('Ошибка при получении сообщений в реальном времени:', error);
            });
            
            setUnsubscribeMessages(() => unsubscribe);
            
            // Возвращаем функцию отписки для использования при размонтировании
            return unsubscribe;
        } catch (error) {
            console.error('Ошибка при настройке слушателя сообщений:', error);
            setError('Не удалось загрузить сообщения. Пожалуйста, попробуйте позже.');
            return null;
        }
    };

    // Функция для маркировки чата как прочитанного
    const markChatAsRead = async () => {
        if (!user || !userId || !chatId) return;
        
        try {
            // Обновляем индикатор непрочитанных сообщений в чате
            const chatRef = doc(db, 'chats', chatId);
            
            // Mark all fields related to unread status to ensure complete clearing of notifications
            const updateData = {
                unreadByUser: false,
                [`unreadBy.${userId}`]: false,
                unreadCount: 0
            };
            
            // If this is the current user's chat, mark it as read immediately
            await updateDoc(chatRef, updateData);
            
            // Mark all messages as read for this user as well
            const messagesQuery = query(
                collection(db, "messages"),
                where("chatId", "==", chatId)
            );
            
            const messagesSnapshot = await getDocs(messagesQuery);
            
            // Loop through each message and mark it as read by this user if needed
            const batch = writeBatch(db);
            messagesSnapshot.forEach(doc => {
                const messageData = doc.data();
                if (messageData.senderId !== userId && !messageData.readBy?.includes(userId)) {
                    const messageRef = doc.ref;
                    batch.update(messageRef, {
                        readBy: arrayUnion(userId),
                        read: true
                    });
                }
            });
            
            // Commit all message updates in a single batch
            await batch.commit();
            
            console.log('Чат и все сообщения отмечены как прочитанные:', chatId);
        } catch (error) {
            console.error('Ошибка при маркировке чата как прочитанного:', error);
        }
    };

    // Вызываем функцию маркировки чата как прочитанный при открытии компонента
    useEffect(() => {
        if (chatId && user && userId) {
            console.log("Marking chat as read on component mount:", chatId);
            markChatAsRead();
            
            // Also mark as read when component is unmounted to ensure clean state
            return () => {
                console.log("Marking chat as read on component unmount:", chatId);
                markChatAsRead();
            };
        }
    }, [chatId, user?.uid]);

    // Редирект неавторизованного пользователя на страницу регистрации
    useEffect(() => {
        if (!loading && !user) {
            console.error("Пользователь не аутентифицирован - редирект на страницу регистрации");
            navigate('/register');
        } else if (!loading && user) {
            console.log("Аутентификация: user =", user ? JSON.stringify({uid: user.uid || user.id, id: user.id}) : 'null', "loading =", loading);
        }
    }, [user, loading, navigate]);

    const scrollToBottom = (smooth = false) => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
                behavior: smooth ? 'smooth' : 'auto'
            });
        }
    };

    const checkScrollPosition = () => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const { scrollHeight, scrollTop, clientHeight } = container;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

        setShowScrollButton(!isNearBottom);
    };

    useEffect(() => {
        const container = messagesContainerRef.current;
        if (container) {
            container.addEventListener('scroll', checkScrollPosition);
            return () => container.removeEventListener('scroll', checkScrollPosition);
        }
    }, []);

    const handleBackClick = () => {
        if (chat?.isActive) {
            setShowEndChatModal(true);
        } else {
            navigate('/chats');
        }
    };

    const handleSendMessage = async () => {
        const messageText = inputMessage.trim();
        if (!messageText || !chatId || !userId || isSending) return;

        setIsSending(true);
        setInputMessage('');

        try {
            console.log('Отправка сообщения. Чат:', chat?.type, 'UserID:', userId, 'ChatID:', chatId);
            
            // Добавляем сообщение локально для мгновенного отображения
            const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            const tempMessage = {
                id: tempId,
                senderId: userId,
                senderName: user.name || "Вы",
                text: messageText,
                timestamp: new Date(),
                chatId: chatId,
                pending: true,
                isTemp: true
            };
            
            // Явно проверяем, что объект tempMessage не содержит telegramData
            if ('telegramData' in tempMessage) {
                delete tempMessage.telegramData;
            }

            // Добавляем временное сообщение в список
            setMessages(prevMessages => [...prevMessages, tempMessage]);
            
            // Прокручиваем чат вниз к новому сообщению
            requestAnimationFrame(() => {
                scrollToBottom(true);
            });

            // Отправляем сообщение на сервер
            if (chat?.type === 'support') {
                // Если это чат поддержки, используем функцию sendChatMessage
                // Используем обычную функцию для отправки сообщений, т.к. чат уже создан
                console.log('Отправка сообщения в чат поддержки через sendChatMessage');
                await sendChatMessage(chatId, userId, messageText);
            } else {
                // Для обычных чатов используем стандартную функцию
                console.log('Отправка сообщения в обычный чат');
                await sendChatMessage(chatId, userId, messageText);
            }
            
            // Firebase автоматически обновит состояние через onSnapshot
            console.log('Сообщение успешно отправлено:', messageText);
        } catch (error) {
            console.error("Ошибка при отправке сообщения:", error);
            setError(error.message || "Не удалось отправить сообщение");
            showToast("Не удалось отправить сообщение", "error");

            // Убираем временное сообщение при ошибке
            setMessages(prevMessages =>
                prevMessages.filter(msg => !msg.id.startsWith('temp-'))
            );
        } finally {
            setIsSending(false);
            // Фокусируем ввод снова
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }
    };
    
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleEndChatClick = () => {
        setShowEndChatModal(true);
    };

    const handleEndChatConfirm = async () => {
        try {
            setIsLoading(true); // Добавляем индикатор загрузки
            
            if (!chatId) {
                showToast('Ошибка: ID чата не определен', 'error');
                setShowEndChatModal(false);
                return;
            }
            
            // Проверяем, что у нас есть ID пользователя
            if (!userId) {
                showToast('Ошибка: Не удалось определить пользователя', 'error');
                setShowEndChatModal(false);
                return;
            }
            
            // Проверяем, что чат еще активен
            if (chat && !chat.isActive) {
                showToast('Чат уже завершен', 'info');
                navigate('/chats');
                return;
            }
            
            // Вызываем функцию завершения чата
            await endChat(chatId, userId);
            showToast('Чат завершен', 'success');
            navigate('/chats');
        } catch (error) {
            console.error('Ошибка при завершении чата:', error);
            
            // Более понятное сообщение для пользователя
            showToast('Не удалось завершить чат. Попробуйте еще раз позже.', 'error');
        } finally {
            setIsLoading(false);
            setShowEndChatModal(false);
        }
    };

    const handleEndChatCancel = () => {
        setShowEndChatModal(false);
    };

    // Обработчик ввода текста сообщения
    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setInputMessage(newValue);
        
        // Если пользователь что-то вводит, отправляем статус "печатает"
        if (newValue && chatId && user) {
            try {
                const chatRef = doc(db, 'chats', chatId);
                
                // Обновляем статус печати в Firebase
                updateDoc(chatRef, { 
                    [`typingStatus.${userId}`]: true,
                    typingTimestamp: serverTimestamp()
                });
                
                // Сбрасываем предыдущий таймаут, если он был
                if (typingTimeout) {
                    clearTimeout(typingTimeout);
                }
                
                // Устанавливаем новый таймаут для сброса статуса печати
                const timeout = setTimeout(() => {
                    updateDoc(chatRef, { 
                        [`typingStatus.${userId}`]: false
                    });
                }, 3000);
                
                setTypingTimeout(timeout);
            } catch (error) {
                console.error('Ошибка при обновлении статуса печати:', error);
            }
        }
    };
    
    // Очищаем таймаут при размонтировании компонента
    useEffect(() => {
        return () => {
            if (typingTimeout) {
                clearTimeout(typingTimeout);
            }
        };
    }, [typingTimeout]);

    // Добавляем отдельный useEffect для настройки подписки на сообщения
    useEffect(() => {
        if (chatId && user && !isLoading) {
            const unsubscribe = setupMessagesSubscription();
            
            return () => {
                if (unsubscribe) {
                    unsubscribe();
                }
            };
        }
    }, [chatId, user, isLoading]);

    const checkFriendStatus = async (partnerId) => {
        try {
            if (!userId || !partnerId) return;
            
            // Проверяем и обновляем структуру пользовательских полей
            await ensureUserFields(userId);
            
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const friendsList = userData.friends || [];
                const friendRequests = userData.friendRequests || [];
                const sentRequests = userData.sentFriendRequests || [];
                
                if (friendsList.includes(partnerId)) {
                    setFriendRequestStatus('friends');
                } else if (friendRequests.includes(partnerId)) {
                    setFriendRequestStatus('received');
                } else if (sentRequests.includes(partnerId)) {
                    setFriendRequestStatus('sent');
                } else {
                    setFriendRequestStatus('none');
                }
            }
        } catch (error) {
            console.error('Error checking friend status:', error);
        }
    };

    const handleSendFriendRequest = async () => {
        try {
            if (!userId || !partnerInfo?.id || partnerInfo.id === 'support') {
                showToast('Невозможно добавить службу поддержки в друзья', 'error');
                return;
            }
            
            // Update current user's sent requests
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                sentFriendRequests: arrayUnion(partnerInfo.id)
            });
            
            // Add to partner's received requests
            const partnerRef = doc(db, 'users', partnerInfo.id);
            await updateDoc(partnerRef, {
                friendRequests: arrayUnion(userId)
            });
            
            setFriendRequestStatus('sent');
            showToast('Запрос в друзья отправлен', 'success');
        } catch (error) {
            console.error('Error sending friend request:', error);
            showToast('Ошибка при отправке запроса', 'error');
        }
    };

    const handleAcceptFriendRequest = async () => {
        try {
            if (!userId || !partnerInfo?.id) return;
            
            // Add to current user's friends and remove from requests
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                friends: arrayUnion(partnerInfo.id),
                friendRequests: arrayRemove(partnerInfo.id)
            });
            
            // Add to partner's friends and remove from sent requests
            const partnerRef = doc(db, 'users', partnerInfo.id);
            await updateDoc(partnerRef, {
                friends: arrayUnion(userId),
                sentFriendRequests: arrayRemove(userId)
            });
            
            setFriendRequestStatus('friends');
            showToast('Запрос принят!', 'success');
        } catch (error) {
            console.error('Error accepting friend request:', error);
            showToast('Ошибка при принятии запроса', 'error');
        }
    };

    const handleCancelFriendRequest = async () => {
        try {
            if (!userId || !partnerInfo?.id) return;
            
            // Remove from current user's sent requests
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                sentFriendRequests: arrayRemove(partnerInfo.id)
            });
            
            // Remove from partner's received requests
            const partnerRef = doc(db, 'users', partnerInfo.id);
            await updateDoc(partnerRef, {
                friendRequests: arrayRemove(userId)
            });
            
            setFriendRequestStatus('none');
            showToast('Запрос отменен', 'info');
        } catch (error) {
            console.error('Error cancelling friend request:', error);
            showToast('Ошибка при отмене запроса', 'error');
        }
    };

    const handleRemoveFriend = async () => {
        try {
            if (!userId || !partnerInfo?.id) return;
            
            // Remove from current user's friends
            const userRef = doc(db, 'users', userId);
            await updateDoc(userRef, {
                friends: arrayRemove(partnerInfo.id)
            });
            
            // Remove from partner's friends
            const partnerRef = doc(db, 'users', partnerInfo.id);
            await updateDoc(partnerRef, {
                friends: arrayRemove(userId)
            });
            
            setFriendRequestStatus('none');
            showToast('Удалено из друзей', 'info');
        } catch (error) {
            console.error('Error removing friend:', error);
            showToast('Ошибка при удалении из друзей', 'error');
        }
    };

    // Новый метод для открытия диалога жалобы
    const handleReportClick = () => {
        setShowReportDialog(true);
    };

    return (
        <div className="chat-container telegram-chat" ref={chatContainerRef}>
            <div className="chat-header">
                <div className="header-left">
                    <button 
                        className="back-button" 
                        onClick={handleBackClick}
                    >
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <div 
                        className="chat-user-info"
                        onClick={() => setShowProfileModal(true)}
                    >
                        <h2>
                            {(chat?.type === 'support' || partnerInfo?.id === 'support') 
                                ? 'Техническая поддержка' 
                                : (partnerInfo?.name || 'Собеседник')}
                        </h2>
                        <UserStatus 
                            isOnline={partnerInfo?.isOnline} 
                            lastSeen={partnerInfo?.lastActive} 
                            isSupportChat={chat?.type === 'support' || partnerInfo?.id === 'support'} 
                            className="chat-status"
                        />
                    </div>
                </div>
                <div className="header-actions">
                    <button 
                        className="end-chat-button" 
                        onClick={() => setShowEndChatModal(true)}
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                        <span style={{ marginLeft: '4px' }}>Завершить чат</span>
                    </button>
                    <button
                        className="header-action-button"
                        onClick={() => setShowProfileModal(true)}
                        title="Профиль собеседника"
                    >
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </button>
                    <button 
                        className="report-button" 
                        onClick={handleReportClick} 
                        title="Пожаловаться"
                    >
                        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="chat-loading">
                    <div className="chat-loading-spinner"></div>
                    <p>Загрузка чата...</p>
                </div>
            ) : error ? (
                <div className="chat-error">
                    <div className="error-icon">!</div>
                    <p>{error}</p>
                    <button className="error-back-button" onClick={handleBackClick}>
                        Вернуться к чатам
                    </button>
                </div>
            ) : (
                <>
                    <div className="chat-messages" ref={messagesContainerRef}>
                        {messages.length === 0 ? (
                            <div className="no-messages">
                                <div className="no-messages-icon">💬</div>
                                <p>Начните общение! Отправьте первое сообщение, чтобы завести беседу.</p>
                            </div>
                        ) : (
                            <>
                                {messages.map((message, index) => {
                                    const isOutgoing = userId && message.senderId === userId;
                                    const showSenderInfo = !isOutgoing && 
                                                          (index === 0 || 
                                                           messages[index - 1].senderId !== message.senderId);
                                                           
                                    // Группируем сообщения по дате для добавления разделителей между днями
                                    const showDateSeparator = index > 0 && 
                                        message.timestamp && messages[index-1].timestamp &&
                                        new Date(message.timestamp.toDate?.() || message.timestamp).toDateString() !== 
                                        new Date(messages[index-1].timestamp.toDate?.() || messages[index-1].timestamp).toDateString();
                                        
                                    // Определяем тип сообщения (системное, обычное)
                                    const isSystemMessage = message.type === 'system' || message.senderId === 'system';
                                    
                                    return (
                                        <React.Fragment key={message.id}>
                                            {showDateSeparator && (
                                                <div className="date-separator">
                                                    <span>{new Date(message.timestamp.toDate?.() || message.timestamp).toLocaleDateString(navigator.language || 'ru-RU', {
                                                        day: 'numeric',
                                                        month: 'long'
                                                    })}</span>
                                                </div>
                                            )}
                                            
                                            {isSystemMessage ? (
                                                <div className="system-message">
                                                    <span>{typeof message.text === 'string' ? message.text : JSON.stringify(message.text)}</span>
                                                </div>
                                            ) : (
                                                <div
                                                    className={`message ${isOutgoing ? 'outgoing' : 'incoming'} ${message.pending ? 'pending' : ''} ${message.senderId === 'support' ? 'support-message' : ''}`}
                                                >
                                                    <div className="message-content">
                                                        {showSenderInfo && (
                                                            <div className="message-sender">{message.senderName || 'Собеседник'}</div>
                                                        )}
                                                        <p>{typeof message.text === 'object' ? JSON.stringify(message.text) : message.text}</p>
                                                        <span className="message-time">
                                                            {typeof message.timestamp === 'object' || typeof message.timestamp === 'number' || typeof message.timestamp === 'string' 
                                                              ? formatMessageTime(message.timestamp) 
                                                              : ''}
                                                            {isOutgoing && (
                                                                <span className={`message-status ${message.read ? 'read' : ''}`}>
                                                                    {message.pending ? 
                                                                        <span className="sending-indicator">⌛</span> : 
                                                                        message.read ? 
                                                                            <span className="read-indicator">✓✓</span> : 
                                                                            <span className="sent-indicator">✓</span>
                                                                    }
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    <div className={`message-input ${isKeyboardOpen ? 'keyboard-visible' : ''}`}>
                        <input
                            type="text"
                            placeholder="Введите сообщение..."
                            value={inputMessage}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            ref={inputRef}
                            disabled={isSending}
                        />
                        <button 
                            onClick={handleSendMessage} 
                            disabled={!inputMessage.trim() || isSending}
                            className={isSending ? 'sending' : ''}
                            aria-label="Отправить сообщение"
                        >
                            {isSending ? (
                                <div className="send-loader"></div>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                </svg>
                            )}
                        </button>
                    </div>

                    {showScrollButton && (
                        <button 
                            className="scroll-bottom-btn" 
                            onClick={() => scrollToBottom(true)}
                            aria-label="Прокрутить вниз"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="8 12 12 16 16 12"></polyline>
                                <line x1="12" y1="8" x2="12" y2="16"></line>
                            </svg>
                        </button>
                    )}
                </>
            )}

            {showEndChatModal && (
                <div className="end-chat-modal">
                    <div className="end-chat-modal-content">
                        <div className="end-chat-modal-title">Завершение чата</div>
                        <div className="end-chat-modal-text">
                            Вы уверены, что хотите завершить этот чат? После завершения чат будет недоступен для обоих пользователей.
                        </div>
                        <div className="end-chat-modal-actions">
                            <button 
                                className="end-chat-modal-btn cancel" 
                                onClick={handleEndChatCancel}
                                disabled={isLoading}
                            >
                                Отмена
                            </button>
                            <button 
                                className="end-chat-modal-btn confirm" 
                                onClick={handleEndChatConfirm}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="loading-spinner"></span>
                                        Завершение...
                                    </>
                                ) : (
                                    'Завершить'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showProfileModal && (
                <div className="profile-modal-overlay" onClick={() => setShowProfileModal(false)}>
                    <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
                        <button 
                            className="modal-close-button"
                            onClick={() => setShowProfileModal(false)}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                        
                        <div className="profile-header">
                            <div className="profile-avatar">
                                {partnerInfo?.photoURL ? (
                                    <img src={partnerInfo.photoURL} alt={partnerInfo.name} />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {(chat?.type === 'support' || partnerInfo?.id === 'support') 
                                            ? 'ТП' 
                                            : getInitials(partnerInfo?.name || 'Собеседник')}
                                    </div>
                                )}
                            </div>
                            <h2>
                                {(chat?.type === 'support' || partnerInfo?.id === 'support') 
                                    ? 'Техническая поддержка' 
                                    : (partnerInfo?.name || 'Собеседник')}
                            </h2>
                            <UserStatus 
                                isOnline={partnerInfo?.isOnline} 
                                lastSeen={partnerInfo?.lastActive} 
                                isSupportChat={chat?.type === 'support' || partnerInfo?.id === 'support'} 
                                className="profile-status"
                            />
                        </div>
                        
                        <div className="profile-info">
                            {partnerInfo?.bio && (
                                <div className="info-section">
                                    <h3>О себе</h3>
                                    <p>{partnerInfo.bio}</p>
                                </div>
                            )}
                            
                            {partnerInfo?.interests && partnerInfo.interests.length > 0 && (
                                <div className="info-section">
                                    <h3>Интересы</h3>
                                    <div className="interests-tags">
                                        {partnerInfo.interests.map((interest, index) => (
                                            <span key={index} className="interest-tag">{interest}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="profile-actions">
                            {partnerInfo?.id !== 'support' && !chat?.type?.includes('support') && (
                                <>
                                    {friendRequestStatus === 'none' && (
                                        <button 
                                            className="action-button add-friend"
                                            onClick={handleSendFriendRequest}
                                        >
                                            <i className="fas fa-user-plus"></i>
                                            Добавить в друзья
                                        </button>
                                    )}
                                    
                                    {friendRequestStatus === 'sent' && (
                                        <button 
                                            className="action-button cancel-request"
                                            onClick={handleCancelFriendRequest}
                                        >
                                            <i className="fas fa-user-minus"></i>
                                            Отменить запрос
                                        </button>
                                    )}
                                    
                                    {friendRequestStatus === 'received' && (
                                        <button 
                                            className="action-button accept-request"
                                            onClick={handleAcceptFriendRequest}
                                        >
                                            <i className="fas fa-check"></i>
                                            Принять запрос в друзья
                                        </button>
                                    )}
                                    
                                    {friendRequestStatus === 'friends' && (
                                        <button 
                                            className="action-button remove-friend"
                                            onClick={handleRemoveFriend}
                                        >
                                            <i className="fas fa-user-minus"></i>
                                            Удалить из друзей
                                        </button>
                                    )}
                                </>
                            )}
                            
                            {(partnerInfo?.id === 'support' || chat?.type?.includes('support')) && (
                                <div className="support-info">
                                    <i className="fas fa-info-circle"></i>
                                    <p>Это чат с технической поддержкой. Здесь вы можете получить помощь по вопросам работы с приложением.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ReportDialog 
                isOpen={showReportDialog}
                onClose={() => setShowReportDialog(false)}
                reportedUserId={partnerInfo?.id}
                chatId={chatId}
                currentUserId={userId}
            />
        </div>
    );
};

export default Chat;
