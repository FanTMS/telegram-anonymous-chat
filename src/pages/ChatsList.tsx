import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import WebApp from '@twa-dev/sdk';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Chat, getAllUserChats, toggleFavoriteChat, getActiveUserChats, getEndedUserChats } from '../utils/chat';
import { getCurrentUser, getUserById, User } from '../utils/user';
import { useNotificationService } from '../utils/notifications';

type TabType = 'active' | 'ended';

// Изменено с const ChatsList на export const ChatsList для именованного экспорта
export const ChatsList: React.FC = () => {
    const navigate = useNavigate();
    const { showError, showSuccess } = useNotificationService();
    const [activeChats, setActiveChats] = useState<Chat[]>([]);
    const [closedChats, setClosedChats] = useState<Chat[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<TabType>('active');
    const [partnerNames, setPartnerNames] = useState<Record<string, string>>({});
    const [error, setError] = useState<string | null>(null);

    // Безопасное получение и обработка Telegram API
    useEffect(() => {
        try {
            if (WebApp && WebApp.isExpanded) {
                WebApp.BackButton.hide();
                WebApp.MainButton.hide();
            }
        } catch (error) {
            console.error("Error initializing Telegram WebApp:", error);
        }
    }, []);

    // Полностью переработанная загрузка чатов без асинхронных операций
    useEffect(() => {
        console.log("Starting to load chats");
        let isComponentMounted = true;

        // Таймаут на случай зависания
        const loadingTimeout = setTimeout(() => {
            if (isComponentMounted && isLoading) {
                console.log("TIMEOUT: Forcing loading state to false after timeout");
                setIsLoading(false);
                setError("Превышено время ожидания загрузки. Пожалуйста, обновите страницу.");
            }
        }, 10000);

        // Полностью синхронная загрузка данных
        try {
            console.log("Loading chats synchronously...");

            // Проверяем наличие пользователя
            const currentUser = getCurrentUser();
            if (!currentUser) {
                console.log("No current user, redirecting");
                navigate('/');
                clearTimeout(loadingTimeout);
                return;
            }

            // Пробуем получить чаты
            console.log(`Attempting to get chats for user ${currentUser.id}`);

            // Загрузка чатов с трехкратной проверкой
            try {
                // Сначала пробуем получить все чаты напрямую из localStorage
                const chatsDataRaw = localStorage.getItem('chats');
                const allChatsRaw = chatsDataRaw ? JSON.parse(chatsDataRaw) : [];
                console.log(`Found ${allChatsRaw.length} total chats in localStorage`);

                // Фильтруем чаты пользователя
                const userChats = Array.isArray(allChatsRaw)
                    ? allChatsRaw.filter(chat => chat && chat.participants && Array.isArray(chat.participants) && chat.participants.includes(currentUser.id))
                    : [];
                console.log(`Filtered ${userChats.length} chats for current user`);

                // Разделяем на активные и завершенные
                const active = userChats.filter(chat => chat && chat.isActive === true);
                const ended = userChats.filter(chat => chat && chat.isActive === false);

                console.log(`Separated into ${active.length} active and ${ended.length} ended chats`);

                // Устанавливаем состояние
                if (isComponentMounted) {
                    setActiveChats(active);
                    setClosedChats(ended);

                    // Загружаем имена партнеров с упрощенной логикой
                    const namesMap: Record<string, string> = {};
                    for (const chat of [...active, ...ended]) {
                        if (!chat || !chat.participants) continue;

                        // Находим ID партнера
                        const partnerId = chat.participants.find(id => id !== currentUser.id);
                        if (!partnerId) continue;

                        // Если имя уже есть в кэше, пропускаем
                        if (namesMap[partnerId]) continue;

                        // Пробуем найти информацию о пользователе
                        const userData = localStorage.getItem(`user_${partnerId}`);
                        if (userData) {
                            try {
                                const user = JSON.parse(userData);
                                namesMap[partnerId] = user.name || 'Собеседник';
                            } catch {
                                namesMap[partnerId] = 'Собеседник';
                            }
                        } else {
                            namesMap[partnerId] = 'Собеседник';
                        }
                    }

                    setPartnerNames(namesMap);
                }
            } catch (chatError) {
                console.error("Error processing chats:", chatError);
                if (isComponentMounted) {
                    setError("Ошибка при обработке данных чатов");
                    setActiveChats([]);
                    setClosedChats([]);
                }
            }

            // Всегда устанавливаем загрузку в false
            if (isComponentMounted) {
                console.log("Setting loading state to false");
                setIsLoading(false);
                clearTimeout(loadingTimeout);
            }
        } catch (error) {
            console.error("Critical error in chat loading:", error);
            if (isComponentMounted) {
                setError("Произошла критическая ошибка при загрузке");
                setIsLoading(false);
                clearTimeout(loadingTimeout);
            }
        }

        return () => {
            console.log("Component unmounting, cleaning up");
            isComponentMounted = false;
            clearTimeout(loadingTimeout);
        };
    }, [navigate]);

    // Безопасное получение timestamp последней активности
    const getLastActivityTimestamp = (chat: Chat): number => {
        if (!chat) return 0;

        try {
            if (!chat.messages || chat.messages.length === 0) {
                return chat.createdAt instanceof Date
                    ? chat.createdAt.getTime()
                    : typeof chat.createdAt === 'number'
                        ? chat.createdAt
                        : Date.now();
            }
            const lastMsg = chat.messages[chat.messages.length - 1];
            return lastMsg.timestamp || 0;
        } catch (error) {
            console.error('Ошибка при получении времени активности:', error);
            return 0;
        }
    };

    // Безопасное получение последнего сообщения чата
    const getLastMessage = (chat: Chat): string => {
        if (!chat || !chat.messages || chat.messages.length === 0) {
            return 'Нет сообщений';
        }

        try {
            const lastMsg = chat.messages[chat.messages.length - 1];
            const isSystem = lastMsg.isSystem;

            if (isSystem) {
                return lastMsg.text || 'Системное сообщение';
            }

            const currentUser = getCurrentUser();
            const isFromCurrentUser = currentUser && lastMsg.senderId === currentUser.id;
            const messageText = lastMsg.text || '';

            return `${isFromCurrentUser ? 'Вы: ' : ''}${messageText.substring(0, 40)}${messageText.length > 40 ? '...' : ''}`;
        } catch (error) {
            console.error('Ошибка при получении последнего сообщения:', error);
            return 'Ошибка чтения сообщения';
        }
    };

    // Безопасное получение времени последней активности
    const getLastActivity = (chat: Chat): string => {
        if (!chat) return '';

        try {
            if (!chat.messages || chat.messages.length === 0) {
                const date = chat.createdAt instanceof Date
                    ? chat.createdAt
                    : new Date(chat.createdAt || Date.now());
                return formatDistanceToNow(date, { addSuffix: true, locale: ru });
            }

            const lastMsg = chat.messages[chat.messages.length - 1];
            return formatDistanceToNow(new Date(lastMsg.timestamp || Date.now()),
                { addSuffix: true, locale: ru });
        } catch (error) {
            console.error('Ошибка при форматировании времени:', error);
            return 'недавно';
        }
    };

    // Безопасное получение имени собеседника
    const getPartnerName = (chat: Chat): string => {
        if (!chat || !chat.participants) return 'Неизвестный';

        try {
            const currentUser = getCurrentUser();
            if (!currentUser) return 'Неизвестный';

            const partnerId = chat.participants.find(id => id !== currentUser.id);
            if (!partnerId) return 'Неизвестный';

            return partnerNames[partnerId] || 'Собеседник';
        } catch (error) {
            console.error('Ошибка при получении имени партнера:', error);
            return 'Собеседник';
        }
    };

    // Переход к чату
    const goToChat = (chatId: string) => {
        try {
            // Тактильная обратная связь при переходе в чат
            if (WebApp && WebApp.isExpanded && WebApp.HapticFeedback) {
                WebApp.HapticFeedback.impactOccurred('medium');
            }
        } catch (error) {
            console.error('Ошибка при использовании Telegram API:', error);
        }

        navigate(`/chat/${chatId}`);
    };

    // Обработка избранного чата
    const handleToggleFavorite = (e: React.MouseEvent, chat: Chat) => {
        e.preventDefault();
        e.stopPropagation(); // Предотвращаем переход к чату

        try {
            // Тактильная обратная связь
            if (WebApp && WebApp.isExpanded && WebApp.HapticFeedback) {
                WebApp.HapticFeedback.impactOccurred('light');
            }

            const newStatus = !chat.isFavorite;
            const success = toggleFavoriteChat(chat.id, newStatus);

            if (success) {
                // Обновляем локальное состояние безопасно
                if (chat.isActive) {
                    setActiveChats(prev =>
                        prev.map(c => c.id === chat.id ? { ...c, isFavorite: newStatus } : c)
                    );
                } else {
                    setClosedChats(prev =>
                        prev.map(c => c.id === chat.id ? { ...c, isFavorite: newStatus } : c)
                    );
                }

                showSuccess(newStatus ? 'Чат добавлен в избранное' : 'Чат удален из избранного');
            }
        } catch (error) {
            console.error('Ошибка при изменении статуса избранного:', error);
            showError('Не удалось изменить статус избранного');
        }
    };

    // Фильтрация чатов
    const filteredActiveChats = useMemo(() => {
        if (!searchQuery.trim()) return activeChats;

        const query = searchQuery.toLowerCase();
        return activeChats.filter(chat => {
            if (!chat) return false;

            const partnerName = getPartnerName(chat).toLowerCase();
            const lastMessage = getLastMessage(chat).toLowerCase();

            return partnerName.includes(query) || lastMessage.includes(query);
        });
    }, [activeChats, searchQuery]);

    const filteredClosedChats = useMemo(() => {
        if (!searchQuery.trim()) return closedChats;

        const query = searchQuery.toLowerCase();
        return closedChats.filter(chat => {
            if (!chat) return false;

            const partnerName = getPartnerName(chat).toLowerCase();
            const lastMessage = getLastMessage(chat).toLowerCase();

            return partnerName.includes(query) || lastMessage.includes(query);
        });
    }, [closedChats, searchQuery]);

    // Рендеринг карточки чата
    const renderChatItem = (chat: Chat) => {
        if (!chat) return null;

        try {
            const partnerName = getPartnerName(chat);
            const lastMessage = getLastMessage(chat);
            const lastActivityTime = getLastActivity(chat);
            const isFavorite = !!chat.isFavorite;

            // Определяем, есть ли непрочитанные сообщения
            const hasUnreadMessages = chat.messages?.some(msg =>
                !msg.isRead && msg.senderId !== getCurrentUser()?.id) || false;

            return (
                <motion.div
                    key={chat.id}
                    className="mb-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    layout="position"
                >
                    <div
                        className={`
                            bg-tg-theme-secondary-bg-color hover:bg-opacity-90 rounded-xl p-3
                            transition-all duration-200 cursor-pointer relative
                            ${hasUnreadMessages ? 'border-l-4 border-tg-theme-button-color' : ''}
                        `}
                        onClick={() => goToChat(chat.id)}
                    >
                        <div className="flex items-start">
                            {/* Аватар собеседника */}
                            <div className="relative mr-3">
                                <div className="w-12 h-12 bg-tg-theme-button-color/20 rounded-full flex items-center justify-center">
                                    <span className="text-lg font-semibold text-tg-theme-button-color">
                                        {partnerName.charAt(0).toUpperCase()}
                                    </span>
                                </div>

                                {/* Индикатор онлайн-статуса (только для активных) */}
                                {chat.isActive && Math.random() > 0.7 && (
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-tg-theme-secondary-bg-color"></div>
                                )}
                            </div>

                            {/* Основная информация чата */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className="font-medium truncate mr-2">
                                        {partnerName}
                                        {isFavorite && (
                                            <span className="ml-1 text-yellow-500">★</span>
                                        )}
                                    </h3>
                                    <span className="text-xs text-tg-theme-hint-color whitespace-nowrap">
                                        {lastActivityTime}
                                    </span>
                                </div>
                                <p className={`text-sm truncate ${hasUnreadMessages ? 'font-medium' : 'text-tg-theme-hint-color'}`}>
                                    {lastMessage}
                                </p>
                            </div>
                        </div>

                        {/* Кнопка избранного */}
                        <button
                            className="absolute right-3 bottom-3 w-8 h-8 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity"
                            onClick={(e) => handleToggleFavorite(e, chat)}
                        >
                            <span className={isFavorite ? 'text-yellow-500' : 'text-tg-theme-hint-color'}>
                                {isFavorite ? '★' : '☆'}
                            </span>
                        </button>
                    </div>
                </motion.div>
            );
        } catch (error) {
            console.error('Ошибка при рендеринге элемента чата:', error);
            return null;
        }
    };

    console.log("Render state:", { isLoading, error, activeChatsCount: activeChats.length, closedChatsCount: closedChats.length });

    // Отображение страницы в зависимости от состояния загрузки
    if (isLoading) {
        return (
            <div className="p-4 max-w-xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-bold">Чаты</h1>
                </div>
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-12 h-12 border-4 border-t-tg-theme-button-color border-tg-theme-secondary-bg-color rounded-full animate-spin mb-4"></div>
                    <p className="text-tg-theme-hint-color text-center">Загрузка чатов...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 max-w-xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-xl font-bold">Чаты</h1>
                </div>
                <div className="flex flex-col items-center justify-center py-10">
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-4">
                        <p className="text-center">{error}</p>
                    </div>
                    <Button
                        onClick={() => window.location.reload()}
                        className="bg-tg-theme-button-color text-tg-theme-button-text-color"
                    >
                        Обновить страницу
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 max-w-xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-xl font-bold">Чаты</h1>
                {(activeChats.length > 0 || closedChats.length > 0) && (
                    <Button
                        onClick={() => navigate('/')}
                        className="bg-gradient-to-r from-tg-theme-button-color to-tg-theme-button-color/80 text-tg-theme-button-text-color text-sm py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Новый чат
                    </Button>
                )}
            </div>

            {/* Строка поиска */}
            <div className="mb-4">
                <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск чатов..."
                    fullWidth
                    className="bg-tg-theme-secondary-bg-color"
                    icon={
                        <svg className="w-5 h-5 text-tg-theme-hint-color" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    }
                />
            </div>

            {/* Усовершенствованные вкладки */}
            <div className="mb-4 flex bg-tg-theme-secondary-bg-color/70 p-1.5 rounded-xl">
                <motion.button
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center ${activeTab === 'active'
                        ? 'bg-tg-theme-button-color text-tg-theme-button-text-color shadow-sm'
                        : 'text-tg-theme-hint-color hover:bg-tg-theme-bg-color/40'
                        }`}
                    onClick={() => setActiveTab('active')}
                    whileTap={{ scale: 0.97 }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Активные
                    {activeChats.length > 0 && (
                        <span className="ml-1.5 bg-tg-theme-button-color/20 text-xs py-0.5 px-1.5 rounded-full">
                            {activeChats.length}
                        </span>
                    )}
                </motion.button>
                <motion.button
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center ${activeTab === 'ended'
                        ? 'bg-tg-theme-button-color text-tg-theme-button-text-color shadow-sm'
                        : 'text-tg-theme-hint-color hover:bg-tg-theme-bg-color/40'
                        }`}
                    onClick={() => setActiveTab('ended')}
                    whileTap={{ scale: 0.97 }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Завершенные
                    {closedChats.length > 0 && (
                        <span className="ml-1.5 bg-tg-theme-button-color/20 text-xs py-0.5 px-1.5 rounded-full">
                            {closedChats.length}
                        </span>
                    )}
                </motion.button>
            </div>

            {/* Список чатов */}
            <div>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {/* Выбор списка чатов в зависимости от вкладки */}
                        {activeTab === 'active' ? (
                            <ChatList
                                chats={filteredActiveChats}
                                renderChatItem={renderChatItem}
                                emptyType="active"
                                navigate={navigate}
                            />
                        ) : (
                            <ChatList
                                chats={filteredClosedChats}
                                renderChatItem={renderChatItem}
                                emptyType="ended"
                                navigate={navigate}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Кнопка создания нового чата при пустом списке */}
            {activeChats.length === 0 && closedChats.length === 0 && (
                <motion.div
                    className="mt-6 flex justify-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Button
                        onClick={() => navigate('/')}
                        className="bg-gradient-to-r from-tg-theme-button-color to-tg-theme-button-color/80 text-tg-theme-button-text-color py-3 px-6 rounded-full shadow-lg flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Начать новый чат
                    </Button>
                </motion.div>
            )}
        </div>
    );
};

// Вспомогательный компонент для списка чатов
type ChatListProps = {
    chats: Chat[];
    renderChatItem: (chat: Chat) => React.ReactNode;
    emptyType: 'active' | 'ended';
    navigate: (path: string) => void;
};

const ChatList: React.FC<ChatListProps> = React.memo(({
    chats, renderChatItem, emptyType, navigate
}) => {
    if (!chats || chats.length === 0) {
        return (
            <div className="text-center p-8 bg-tg-theme-secondary-bg-color/70 rounded-2xl">
                <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-tg-theme-bg-color rounded-full flex items-center justify-center mb-4">
                        <span className="text-2xl opacity-70">
                            {emptyType === 'active' ? '💬' : '📦'}
                        </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-1">
                        {emptyType === 'active'
                            ? 'У вас пока нет активных чатов'
                            : 'У вас нет завершенных чатов'
                        }
                    </h3>
                    <p className="text-sm text-tg-theme-hint-color mb-4">
                        {emptyType === 'active'
                            ? 'Начните общение, чтобы они появились здесь'
                            : 'Здесь будут отображаться ваши завершенные диалоги'
                        }
                    </p>
                    {emptyType === 'active' && (
                        <Button
                            onClick={() => navigate('/')}
                            className="bg-gradient-to-r from-tg-theme-button-color to-tg-theme-button-color/80 text-tg-theme-button-text-color py-2.5 px-5 rounded-full shadow-md flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Начать общение
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <AnimatePresence initial={false}>
            {chats.map(chat => renderChatItem(chat))}
        </AnimatePresence>
    );
});
