import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import {
    startSearching, stopSearching, isUserSearching, startMatchmakingService, stopMatchmakingService,
    getSearchingUsers, getChatById, getNewChatNotification, hasNewChat, markChatNotificationAsRead
} from '../utils/matchmaking';
import { getCurrentUser, createUser, getUserById } from '../utils/user';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { ActiveSearchCounter } from '../components/ActiveSearchCounter';

export const TestChat = () => {
    const navigate = useNavigate();
    const [usersList, setUsersList] = useState<string[]>([]);
    const [testingUsers, setTestingUsers] = useState<{ id: string, name: string }[]>([]);
    const [activeUser, setActiveUser] = useState<string | null>(null);
    const [searchingUsers, setSearchingUsers] = useState<any[]>([]);
    const [generatedChats, setGeneratedChats] = useState<any[]>([]);
    const [logMessages, setLogMessages] = useState<string[]>([]);

    // Инициализация при загрузке страницы
    useEffect(() => {
        // Создаем несколько тестовых пользователей
        createTestUsers();

        // Получаем список пользователей в поиске при загрузке
        updateSearchingUsers();

        // Настраиваем обработчик для событий создания чатов
        const chatFoundHandler = (event: CustomEvent) => {
            addLogMessage(`📢 Событие chatFound: Создан чат ${event.detail.chatId}`);
            updateGeneratedChats();
        };

        window.addEventListener('chatFound', chatFoundHandler as EventListener);

        // Интервал для обновления списка пользователей в поиске
        const intervalId = setInterval(updateSearchingUsers, 2000);

        // Очистка при размонтировании
        return () => {
            window.removeEventListener('chatFound', chatFoundHandler as EventListener);
            clearInterval(intervalId);
        };
    }, []);

    // Добавляет сообщение в лог
    const addLogMessage = (message: string) => {
        setLogMessages(prev => [message, ...prev].slice(0, 20));
    };

    // Создание тестовых пользователей
    const createTestUsers = () => {
        const users = [];
        // Проверяем, есть ли уже пользователи
        const existingUsers = getAllTestUsers();

        if (existingUsers.length === 0) {
            // Создаем новых тестовых пользователей
            for (let i = 1; i <= 5; i++) {
                const id = `test-user-${uuidv4().substring(0, 8)}`;
                const name = `Тестовый пользователь ${i}`;
                const user = createUser(id, name);
                users.push({ id, name });
            }
            setTestingUsers(users);
        } else {
            // Используем существующих пользователей
            setTestingUsers(existingUsers.map(id => {
                const user = getUserById(id);
                return { id, name: user?.name || `Пользователь ${id}` };
            }));
        }

        addLogMessage('👤 Тестовые пользователи созданы/загружены');
    };

    // Получение всех тестовых пользователей
    const getAllTestUsers = (): string[] => {
        try {
            // Получение всех ключей из localStorage
            const keys = Object.keys(localStorage);

            // Фильтрация ключей, относящихся к пользователям
            const userKeys = keys.filter(key => key.startsWith('user_'));

            // Извлечение ID пользователей
            return userKeys.map(key => key.replace('user_', ''))
                .filter(id => {
                    const user = getUserById(id);
                    return user !== null && (id.startsWith('test-user-') || user.name?.includes('Тестовый'));
                });
        } catch (error) {
            console.error('Ошибка при получении тестовых пользователей:', error);
            return [];
        }
    };

    // Обновляет список пользователей в поиске
    const updateSearchingUsers = () => {
        const users = getSearchingUsers();
        setSearchingUsers(users);
    };

    // Обновляет список созданных чатов
    const updateGeneratedChats = () => {
        try {
            // Получение всех ключей из localStorage
            const keys = Object.keys(localStorage);

            // Фильтрация ключей, относящихся к чатам
            const chatKeys = keys.filter(key => key.startsWith('chat_'));

            // Извлечение чатов
            const chats = chatKeys.map(key => {
                try {
                    const chatJson = localStorage.getItem(key);
                    if (chatJson) {
                        return JSON.parse(chatJson);
                    }
                    return null;
                } catch {
                    return null;
                }
            }).filter(chat => chat !== null);

            setGeneratedChats(chats);
        } catch (error) {
            console.error('Ошибка при обновлении списка чатов:', error);
        }
    };

    // Переключение активного пользователя
    const selectUser = (userId: string) => {
        // Сохраняем ID пользователя в localStorage с правильным ключом
        localStorage.setItem('current_user_id', userId);
        setActiveUser(userId);
        addLogMessage(`🔄 Переключились на пользователя ${userId}`);
    };

    // Запуск поиска для выбранного пользователя
    const startSearch = (userId: string, isRandom: boolean = true, interests: string[] = []) => {
        // Переключаемся на пользователя
        selectUser(userId);

        // Запускаем поиск
        const success = startSearching(isRandom, interests);

        if (success) {
            addLogMessage(`🔍 Пользователь ${userId} начал поиск (режим: ${isRandom ? 'случайный' : 'по интересам'})`);
            updateSearchingUsers();
        } else {
            addLogMessage(`❌ Не удалось запустить поиск для пользователя ${userId}`);
        }
    };

    // Остановка поиска для выбранного пользователя
    const stopSearch = (userId: string) => {
        // Переключаемся на пользователя
        selectUser(userId);

        // Останавливаем поиск
        const success = stopSearching(userId);

        if (success) {
            addLogMessage(`⏹️ Пользователь ${userId} остановил поиск`);
            updateSearchingUsers();
        } else {
            addLogMessage(`❌ Не удалось остановить поиск для пользователя ${userId}`);
        }
    };

    // Проверка, находится ли пользователь в поиске
    const checkIsSearching = (userId: string) => {
        return searchingUsers.some(user => user.userId === userId);
    };

    // Запуск сервиса подбора пар
    const startMatchmaking = () => {
        const serviceId = startMatchmakingService(1500);
        addLogMessage(`🚀 Запущен сервис подбора пар с ID: ${serviceId}`);
    };

    // Остановка сервиса подбора пар
    const stopMatchmaking = () => {
        // @ts-ignore
        if (window._matchmakingIntervalId) {
            // @ts-ignore
            stopMatchmakingService(window._matchmakingIntervalId);
            addLogMessage(`🛑 Остановлен сервис подбора пар`);
        } else {
            addLogMessage(`❓ Сервис подбора пар не был активен`);
        }
    };

    // Проверка на наличие новых чатов для пользователя
    const checkNewChats = (userId: string) => {
        selectUser(userId);

        if (hasNewChat(userId)) {
            const notification = getNewChatNotification(userId);
            if (notification) {
                addLogMessage(`🎉 Найден новый чат для пользователя ${userId}: ${notification.chatId}`);
                return notification.chatId;
            }
        }

        addLogMessage(`ℹ️ Нет новых чатов для пользователя ${userId}`);
        return null;
    };

    // Перейти в чат
    const goToChat = (chatId: string) => {
        if (!chatId) {
            addLogMessage(`❌ Ошибка: ID чата отсутствует`);
            return;
        }

        // Попробуем найти чат с различными форматами ID
        const normalizedChatId = chatId.startsWith('chat_') ? chatId.substring(5) : chatId;
        const fullChatId = chatId.startsWith('chat_') ? chatId : `chat_${chatId}`;

        // Проверяем, существует ли чат с одним из вариантов ID
        let chat = getChatById(chatId);
        if (!chat) {
            chat = getChatById(normalizedChatId);
        }
        if (!chat) {
            chat = getChatById(fullChatId);
        }

        if (!chat) {
            addLogMessage(`❌ Ошибка: Чат с ID ${chatId} не найден`);
            return;
        }

        // Сохраняем полный ID чата с префиксом "chat_" в localStorage
        // Это обеспечит совместимость с другими частями приложения
        const storageId = chat.id.startsWith('chat_') ? chat.id : `chat_${chat.id}`;
        localStorage.setItem('active_chat_id', storageId);

        // Для навигации используем ID без префикса "chat_", как ожидает компонент Chat
        const navigationId = chat.id.startsWith('chat_') ? chat.id.substring(5) : chat.id;

        addLogMessage(`🔄 Переход в чат: ${navigationId} (оригинальный ID: ${chat.id})`);
        navigate(`/chat/${navigationId}`);
    };

    // Показать статистику поиска
    const showSearchStats = () => {
        const stats = {
            totalUsers: testingUsers.length,
            searchingUsers: searchingUsers.length,
            generatedChats: generatedChats.length
        };

        addLogMessage(`📊 Статистика: ${JSON.stringify(stats)}`);
    };

    // Отметить уведомление о чате как прочитанное
    const markAsRead = (userId: string) => {
        selectUser(userId);
        markChatNotificationAsRead(userId);
        addLogMessage(`✓ Уведомление для ${userId} отмечено как прочитанное`);
    };

    return (
        <div className="container mx-auto p-4 max-w-4xl">
            <h1 className="text-2xl font-bold mb-6">Тестирование поиска собеседников</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Левая колонка */}
                <div className="space-y-6">
                    {/* Блок тестовых пользователей */}
                    <Card className="p-4">
                        <h2 className="text-lg font-semibold mb-3">Тестовые пользователи</h2>
                        <div className="space-y-3">
                            {testingUsers.map(user => (
                                <div key={user.id} className="p-3 border rounded-lg flex justify-between items-center bg-white dark:bg-gray-800 shadow-sm">
                                    <div>
                                        <div className="font-medium">{user.name}</div>
                                        <div className="text-xs text-gray-500 truncate">{user.id}</div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            onClick={() => selectUser(user.id)}
                                            variant={activeUser === user.id ? "primary" : "outline"}
                                            size="small"
                                            className="text-xs"
                                        >
                                            Выбрать
                                        </Button>
                                        {checkIsSearching(user.id) ? (
                                            <Button
                                                onClick={() => stopSearch(user.id)}
                                                variant="outline"
                                                size="small"
                                                className="bg-red-100 text-red-700 border-red-300 text-xs"
                                            >
                                                Остановить
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => startSearch(user.id)}
                                                variant="outline"
                                                size="small"
                                                className="bg-green-100 text-green-700 border-green-300 text-xs"
                                            >
                                                Искать
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                            <ActiveSearchCounter className="text-sm" refreshIntervalMs={2000} />

                            <div className="flex space-x-2">
                                <Button onClick={() => createTestUsers()} size="small">Обновить</Button>
                                <Button
                                    onClick={showSearchStats}
                                    variant="outline"
                                    size="small"
                                >
                                    Статистика
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Блок управления поиском */}
                    <Card className="p-4">
                        <h2 className="text-lg font-semibold mb-3">Управление поиском</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Button onClick={startMatchmaking} className="bg-blue-500 hover:bg-blue-600 text-white">
                                Запустить подбор
                            </Button>
                            <Button onClick={stopMatchmaking} className="bg-red-500 hover:bg-red-600 text-white">
                                Остановить подбор
                            </Button>
                            <Button
                                onClick={() => {
                                    const userId1 = testingUsers[0]?.id;
                                    const userId2 = testingUsers[1]?.id;
                                    if (userId1 && userId2) {
                                        startSearch(userId1);
                                        startSearch(userId2);
                                        addLogMessage(`🔄 Запущен поиск для двух пользователей: ${userId1} и ${userId2}`);
                                    }
                                }}
                                className="bg-green-500 hover:bg-green-600 text-white col-span-2"
                            >
                                Тест: Поиск для 2 пользователей
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Правая колонка */}
                <div className="space-y-6">
                    {/* Блок активных поисков */}
                    <Card className="p-4">
                        <h2 className="text-lg font-semibold mb-3">Активные поиски</h2>
                        {searchingUsers.length > 0 ? (
                            <div className="space-y-2">
                                {searchingUsers.map(user => (
                                    <div key={user.userId} className="p-2 border rounded flex justify-between items-center text-sm bg-yellow-50 dark:bg-yellow-900/20">
                                        <div className="truncate">
                                            <span className="font-medium">{user.userId}</span>
                                            <span className="text-xs ml-2 text-gray-500">
                                                {new Date(user.startedAt).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <Button
                                            onClick={() => stopSearch(user.userId)}
                                            variant="outline"
                                            size="small"
                                            className="text-xs py-1 px-2 h-auto"
                                        >
                                            Остановить
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4 text-gray-500">
                                Нет активных поисков
                            </div>
                        )}
                    </Card>

                    {/* Блок созданных чатов */}
                    <Card className="p-4">
                        <h2 className="text-lg font-semibold mb-3">Созданные чаты</h2>
                        <Button onClick={updateGeneratedChats} variant="outline" size="small" className="mb-3 w-full">
                            Обновить список чатов
                        </Button>

                        {generatedChats.length > 0 ? (
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {generatedChats.map((chat, index) => (
                                    <div key={index} className="p-3 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                                        <div className="flex justify-between items-center">
                                            <div className="font-medium truncate">{chat.id}</div>
                                            <Button onClick={() => goToChat(chat.id)} size="small" className="text-xs">
                                                Перейти
                                            </Button>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Участники: {chat.participants ? chat.participants.join(', ') : 'Нет участников'}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            Создан: {new Date(chat.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4 text-gray-500">
                                Нет созданных чатов
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            {/* Лог событий */}
            <Card className="p-4 mt-6">
                <h2 className="text-lg font-semibold mb-3 flex justify-between items-center">
                    <span>Журнал событий</span>
                    <Button onClick={() => setLogMessages([])} variant="outline" size="small">Очистить</Button>
                </h2>
                <div className="border rounded-lg bg-black text-green-400 p-3 h-40 overflow-y-auto font-mono text-sm">
                    {logMessages.length > 0 ? (
                        <AnimatePresence>
                            {logMessages.map((msg, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="mb-1"
                                >
                                    <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span> {msg}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    ) : (
                        <div className="text-gray-500 italic">Журнал пуст</div>
                    )}
                </div>
            </Card>

            {/* Кнопка возврата */}
            <div className="mt-6">
                <Button onClick={() => navigate('/')} variant="outline" className="w-full">
                    ← Вернуться на главную
                </Button>
            </div>
        </div>
    );
};
