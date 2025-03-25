import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { createTestUser, getCurrentUser, getUserById } from '../utils/user';
import { getChatById } from '../utils/chat'; // Импортируем getChatById из chat.ts
import { getNewChatNotification, getSearchingUsers, hasNewChat, saveNewChatNotification, startSearching, stopSearching, triggerMatchmaking } from '../utils/matchmaking';
import { useNavigate } from 'react-router-dom';

export const TestChat = () => {
    const navigate = useNavigate();
    const [testUsers, setTestUsers] = useState<any[]>([]);
    const [logs, setLogs] = useState<string[]>([]);
    const [searchingUsers, setSearchingUsers] = useState<any[]>([]);
    const [showDetailedLogs, setShowDetailedLogs] = useState(false);
    const [autoSearching, setAutoSearching] = useState(false);
    const [autoSearchInterval, setAutoSearchInterval] = useState<NodeJS.Timeout | null>(null);
    const [chats, setChats] = useState<any[]>([]);

    useEffect(() => {
        // Загружаем существующих пользователей при старте
        loadExistingUsers();

        // Обновляем список всех данных при монтировании компонента
        checkExistingChats();

        // Обновляем список пользователей в поиске каждую секунду
        const interval = setInterval(() => {
            const users = getSearchingUsers();

            // Добавляем имена для лучшей читаемости
            const usersWithNames = users.map(user => {
                const userData = getUserById(user.userId);
                return {
                    ...user,
                    name: userData?.name || 'Неизвестный'
                };
            });

            setSearchingUsers(usersWithNames);
        }, 1000);

        // Слушаем событие chatFound для отображения в логах и обновления чатов
        const handleChatFound = (event: any) => {
            const { chatId, userId } = event.detail;
            addLog(`✅ Получено событие chatFound: chatId=${chatId}, userId=${userId || 'не указан'}`);

            // Обязательно обновляем список чатов после создания нового
            setTimeout(() => checkExistingChats(), 500);

            // Проверяем, что действительно был создан чат
            const chat = getChatById(chatId);
            if (chat) {
                addLog(`✅ Подтверждено создание чата ${chatId} между: ${chat.participants.join(' и ')}`);
            } else {
                addLog(`❌ ОШИБКА: Чат ${chatId} не найден после события chatFound!`);
            }
        };

        window.addEventListener('chatFound', handleChatFound);

        return () => {
            clearInterval(interval);
            if (autoSearchInterval) {
                clearInterval(autoSearchInterval);
            }
            window.removeEventListener('chatFound', handleChatFound);
        };
    }, []);

    const loadExistingUsers = () => {
        try {
            // Загружаем существующих пользователей из localStorage
            const usersStr = localStorage.getItem('users');
            if (usersStr) {
                const allUsers = JSON.parse(usersStr);
                if (Array.isArray(allUsers) && allUsers.length > 0) {
                    // Берем только тестовых пользователей
                    const testUsers = allUsers.filter(user =>
                        user.id.startsWith('test_') || user.name.startsWith('Тест')
                    );
                    setTestUsers(testUsers);

                    if (testUsers.length > 0) {
                        addLog(`Загружено ${testUsers.length} тестовых пользователей`);
                    }
                }
            }
        } catch (error) {
            console.error('Ошибка при загрузке пользователей:', error);
            addLog('Ошибка при загрузке существующих пользователей');
        }
    };

    const addLog = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 99)]);
    };

    const createNewTestUser = () => {
        const name = `Тест${testUsers.length + 1}`;
        const user = createTestUser(name);
        if (user) {
            setTestUsers(prev => [...prev, user]);
            addLog(`Создан тестовый пользователь: ${name} (${user.id})`);
        } else {
            addLog('Ошибка при создании тестового пользователя');
        }
    };

    const create5TestUsers = () => {
        let created = 0;
        for (let i = 0; i < 5; i++) {
            const name = `Тест${testUsers.length + i + 1}`;
            const user = createTestUser(name);
            if (user) {
                created++;
                setTestUsers(prev => [...prev, user]);
            }
        }
        addLog(`Создано ${created} тестовых пользователей`);
    };

    const startTestUserSearch = (userId: string) => {
        const success = startSearching(true, [], [0, 100], userId);
        if (success) {
            addLog(`Пользователь ${userId} начал поиск`);

            // Принудительно запускаем матчмейкинг через секунду
            setTimeout(() => {
                triggerMatchmaking()
                    .then(result => {
                        addLog(`Проверка матчмейкинга: ${result ? 'Найдено совпадение' : 'Совпадение не найдено'}`);
                    })
                    .catch(err => {
                        addLog(`Ошибка при проверке матчмейкинга: ${err.message || 'Неизвестная ошибка'}`);
                    });
            }, 1000);
        } else {
            addLog(`Ошибка при запуске поиска для ${userId}`);
        }
    };

    const stopTestUserSearch = (userId: string) => {
        const success = stopSearching(userId);
        if (success) {
            addLog(`Поиск остановлен для ${userId}`);
        } else {
            addLog(`Ошибка при остановке поиска для ${userId}`);
        }
    };

    const forceMatch = async () => {
        addLog('Запуск принудительного подбора пар...');
        try {
            const result = await triggerMatchmaking();
            addLog(`Результат: ${result ? 'Найдена пара! 🎉' : 'Пара не найдена 😞'}`);

            if (result) {
                // Принудительно проверяем список чатов после успешного подбора
                setTimeout(() => {
                    checkExistingChats();
                }, 500);
            }

            // Обновляем список пользователей в поиске после подбора
            const updatedUsers = getSearchingUsers();

            // Добавляем имена для лучшей читаемости
            const usersWithNames = updatedUsers.map(user => {
                const userData = getUserById(user.userId);
                return {
                    ...user,
                    name: userData?.name || 'Неизвестный'
                };
            });

            setSearchingUsers(usersWithNames);

            // Если пользователи остались - повторяем через 2 секунды
            if (updatedUsers.length >= 2) {
                setTimeout(forceMatch, 2000);
            }
        } catch (error) {
            addLog(`Ошибка при подборе пар: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        }
    };

    const startAutoSearch = () => {
        if (autoSearchInterval) {
            clearInterval(autoSearchInterval);
        }

        // Ставим двух тестовых пользователей в поиск каждые 5 секунд
        const interval = setInterval(() => {
            // Создаем пользователя, если нужно
            if (testUsers.length < 2) {
                createNewTestUser();
            }

            // Берем двух разных пользователей
            const availableUsers = testUsers.filter(user =>
                !searchingUsers.some(su => su.userId === user.id)
            );

            if (availableUsers.length >= 2) {
                const user1 = availableUsers[0];
                const user2 = availableUsers[1];

                addLog(`Автоматически добавляем в поиск: ${user1.name} и ${user2.name}`);
                startSearching(true, [], [0, 100], user1.id);
                startSearching(true, [], [0, 100], user2.id);

                // Через секунду запускаем матчмейкинг
                setTimeout(() => {
                    triggerMatchmaking().then(result => {
                        addLog(`Автоматический матчмейкинг: ${result ? 'Успешно' : 'Неудачно'}`);
                    });
                }, 1000);
            } else {
                addLog('Недостаточно пользователей для автоматического поиска');
                create5TestUsers();
            }
        }, 5000);

        setAutoSearchInterval(interval);
        setAutoSearching(true);
        addLog('Автоматический поиск запущен');
    };

    const stopAutoSearch = () => {
        if (autoSearchInterval) {
            clearInterval(autoSearchInterval);
            setAutoSearchInterval(null);
            setAutoSearching(false);
            addLog('Автоматический поиск остановлен');
        }
    };

    const clearAllUsers = () => {
        // Останавливаем поиск для всех тестовых пользователей
        testUsers.forEach(user => {
            stopSearching(user.id);
        });

        setTestUsers([]);
        addLog('Список тестовых пользователей очищен');
    };

    const startSearchForAll = () => {
        if (testUsers.length === 0) {
            addLog('Нет тестовых пользователей для запуска поиска');
            return;
        }

        for (const user of testUsers) {
            startSearching(true, [], [0, 100], user.id);
        }

        addLog(`Запущен поиск для всех ${testUsers.length} тестовых пользователей`);

        // Запускаем принудительный матчмейкинг через 1 секунду
        setTimeout(forceMatch, 1000);
    };

    const goToChat = (chatId: string) => {
        try {
            // Проверяем, что чат существует перед переходом
            const chat = getChatById(chatId);
            if (!chat) {
                addLog(`❌ Ошибка: Чат ${chatId} не найден при попытке открыть.`);
                return;
            }

            addLog(`✅ Переход в чат ${chatId}`);

            // Сохраняем активный чат для корректной загрузки
            localStorage.setItem('active_chat_id', chatId);

            // Переходим в чат
            navigate(`/chat/${chatId}`);
        } catch (error) {
            addLog(`❌ Ошибка при переходе в чат: ${error}`);
        }
    };

    const checkExistingChats = () => {
        try {
            const chatsData = localStorage.getItem('chats');
            if (!chatsData) {
                addLog('Чаты не найдены');
                setChats([]);
                return;
            }

            const chats = JSON.parse(chatsData);
            addLog(`Найдено ${chats.length} чатов`);

            // Добавляем дополнительную информацию о чатах
            const enhancedChats = chats.map(chat => {
                // Проверим каждого участника
                const participantsDetails = chat.participants.map(participantId => {
                    const participant = getUserById(participantId);
                    return {
                        id: participantId,
                        name: participant?.name || 'Неизвестный',
                        exists: !!participant
                    };
                });

                const participant1 = participantsDetails[0];
                const participant2 = participantsDetails[1];

                // Проверяем целостность чата
                const chatIsValid = participantsDetails.every(p => p.exists) &&
                    chat.participants.length === 2;

                if (!chatIsValid) {
                    addLog(`⚠️ Чат ${chat.id} может быть поврежден: проблемы с участниками или их кол-вом`);
                }

                return {
                    ...chat,
                    participant1Name: participant1?.name || 'Неизвестный',
                    participant2Name: participant2?.name || 'Неизвестный',
                    messageCount: chat.messages?.length || 0,
                    isValid: chatIsValid
                };
            });

            setChats(enhancedChats);

            // Проверяем флаги уведомлений для всех пользователей
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            for (const user of users) {
                if (hasNewChat(user.id)) {
                    const notification = getNewChatNotification(user.id);
                    if (notification) {
                        const chat = getChatById(notification.chatId);
                        if (chat) {
                            addLog(`🔔 Пользователь ${user.name} (${user.id}) имеет уведомление о чате ${notification.chatId}`);
                        } else {
                            addLog(`⚠️ Пользователь ${user.name} имеет уведомление о несуществующем чате ${notification.chatId}`);
                        }
                    }
                }
            }
        } catch (error) {
            addLog(`Ошибка при проверке чатов: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        }
    };

    // Очистка всех чатов
    const clearAllChats = () => {
        try {
            localStorage.setItem('chats', JSON.stringify([]));
            addLog('Все чаты очищены');
            setChats([]);
        } catch (error) {
            addLog(`Ошибка при очистке чатов: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        }
    };

    // Улучшенная проверка состояния
    const debugState = () => {
        try {
            // Проверяем различные хранилища и их состояние
            addLog('--- Диагностика состояния ---');

            // Проверка пользователей
            const usersData = localStorage.getItem('users');
            const users = usersData ? JSON.parse(usersData) : [];
            addLog(`Всего пользователей: ${users.length}`);

            // Проверка пользователей в поиске
            const searchingUsers = getSearchingUsers();
            addLog(`Пользователей в поиске: ${searchingUsers.length}`);

            // Проверка чатов
            const chatsData = localStorage.getItem('chats');
            const chats = chatsData ? JSON.parse(chatsData) : [];
            addLog(`Всего чатов: ${chats.length}`);

            // Проверка уведомлений
            const keys = Object.keys(localStorage);
            const notifications = keys.filter(key => key.startsWith('new_chat_notification_'));
            const flags = keys.filter(key => key.startsWith('new_chat_flag_'));

            addLog(`Уведомлений о чатах: ${notifications.length}`);
            addLog(`Флагов новых чатов: ${flags.length}`);

            if (flags.length > 0) {
                flags.forEach(flag => {
                    const userId = flag.replace('new_chat_flag_', '');
                    const hasChat = hasNewChat(userId);
                    addLog(`- Флаг для ${userId}: ${hasChat ? 'Активен' : 'Неактивен'}`);
                });
            }

            addLog('--- Конец диагностики ---');
        } catch (error) {
            addLog(`Ошибка при диагностике: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
        }
    };

    // Добавим кнопку для ручной проверки маршрутов
    const testNavigationRoutes = () => {
        try {
            // Берем последний созданный чат
            if (chats.length === 0) {
                addLog('Нет чатов для тестирования маршрутов');
                return;
            }

            const lastChat = chats[chats.length - 1];
            const chatId = lastChat.id;

            // Проверяем, какие маршруты работают
            addLog(`🧪 Тестирование маршрутов для чата ${chatId}`);

            const routesToTest = [
                `/chat/${chatId}`,
                `chat/${chatId}`,
                `../chat/${chatId}`
            ];

            for (const route of routesToTest) {
                addLog(`  • Проверка маршрута: ${route}`);
            }

            addLog('Открываем первый маршрут...');
            navigate(`/chat/${chatId}`);
        } catch (error) {
            addLog(`Ошибка при тестировании маршрутов: ${error}`);
        }
    };

    // Добавим функцию для тестирования механизма перехода в чат

    const testChatRedirection = (chatId: string) => {
        try {
            addLog(`🧪 Тестирование перехода в чат ${chatId}...`);

            // Проверяем, что чат существует перед переходом
            const chat = getChatById(chatId);
            if (!chat) {
                addLog(`❌ Ошибка: Чат ${chatId} не найден при попытке тестирования редиректа.`);
                return;
            }

            // Сохраняем ID чата в localStorage для использования в компоненте чата
            localStorage.setItem('active_chat_id', chatId);
            addLog(`✅ Сохранен ID чата в localStorage: ${chatId}`);

            // Симулируем создание уведомления для текущего пользователя
            const currentUser = getCurrentUser();
            if (currentUser) {
                const otherUserId = chat.participants.find(id => id !== currentUser.id);

                if (otherUserId) {
                    saveNewChatNotification(currentUser.id, chatId, otherUserId);
                    addLog(`✅ Создано тестовое уведомление для пользователя ${currentUser.id}`);

                    // Проверяем, видно ли уведомление через API
                    setTimeout(() => {
                        const hasNotification = hasNewChat(currentUser.id);
                        addLog(`🔍 Проверка hasNewChat: ${hasNotification ? 'Да' : 'Нет'}`);

                        if (hasNotification) {
                            // Преднамеренно не используем markChatNotificationAsRead, чтобы протестировать перенаправление
                            addLog(`✅ Готово к тестированию перенаправления в чат ${chatId}`);
                        } else {
                            addLog(`❌ Уведомление не видно через hasNewChat!`);
                        }
                    }, 500);
                } else {
                    addLog(`❌ Не найден второй участник чата!`);
                }
            } else {
                addLog(`❌ Текущий пользователь не найден!`);
            }
        } catch (error) {
            addLog(`❌ Ошибка при тестировании редиректа: ${error}`);
        }
    };

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Отладка поиска собеседников</h1>

            <div className="flex flex-wrap gap-2 mb-4">
                <Button onClick={createNewTestUser} className="bg-blue-500 text-white">
                    Создать тестового пользователя
                </Button>
                <Button onClick={create5TestUsers} className="bg-indigo-500 text-white">
                    Создать 5 пользователей
                </Button>
                <Button onClick={startSearchForAll} className="bg-purple-500 text-white">
                    Запустить поиск для всех
                </Button>
                <Button onClick={forceMatch} className="bg-green-500 text-white">
                    Принудительный матчмейкинг
                </Button>
                <Button onClick={autoSearching ? stopAutoSearch : startAutoSearch}
                    className={autoSearching ? "bg-red-500 text-white" : "bg-green-500 text-white"}>
                    {autoSearching ? "Остановить автопоиск" : "Запустить автопоиск"}
                </Button>
                <Button onClick={clearAllUsers} className="bg-red-500 text-white">
                    Очистить тестовых
                </Button>
                <Button onClick={() => navigate('/')} className="bg-gray-500 text-white">
                    На главную
                </Button>
                <Button onClick={checkExistingChats} className="bg-yellow-500 text-white">
                    Проверить чаты
                </Button>
                <Button onClick={clearAllChats} className="bg-red-500 text-white">
                    Очистить чаты
                </Button>
                <Button onClick={debugState} className="bg-indigo-500 text-white">
                    Диагностика
                </Button>
                <Button onClick={testNavigationRoutes} className="bg-pink-500 text-white">
                    Тест маршрутов
                </Button>
                <Button
                    onClick={() => testChatRedirection(chats[0]?.id)}
                    className="bg-purple-500 text-white"
                    disabled={chats.length === 0}
                >
                    Тест перенаправления
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                    <h2 className="text-xl font-bold mb-2">Тестовые пользователи ({testUsers.length})</h2>
                    <div className="divide-y max-h-60 overflow-auto">
                        {testUsers.map(user => (
                            <div key={user.id} className="py-2">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="font-medium">{user.name}</div>
                                        <div className="text-xs text-gray-500">{user.id}</div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            onClick={() => startTestUserSearch(user.id)}
                                            className="bg-green-500 text-white text-xs px-2 py-1"
                                        >
                                            Начать поиск
                                        </Button>
                                        <Button
                                            onClick={() => stopTestUserSearch(user.id)}
                                            className="bg-red-500 text-white text-xs px-2 py-1"
                                        >
                                            Остановить
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {testUsers.length === 0 && (
                            <div className="py-4 text-center text-gray-500">
                                Нет тестовых пользователей
                            </div>
                        )}
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-bold">Пользователи в поиске ({searchingUsers.length})</h2>
                        <Button
                            onClick={() => setShowDetailedLogs(!showDetailedLogs)}
                            className="text-xs bg-gray-200 px-2 py-1 rounded"
                        >
                            {showDetailedLogs ? "Скрыть детали" : "Показать детали"}
                        </Button>
                    </div>
                    <div className="text-xs overflow-auto max-h-60">
                        {showDetailedLogs ? (
                            <pre>{JSON.stringify(searchingUsers, null, 2)}</pre>
                        ) : (
                            <div className="space-y-2">
                                {searchingUsers.map((user, index) => (
                                    <div key={index} className="p-2 bg-gray-100 rounded">
                                        <div className="font-bold">{user.name || 'Неизвестный'}</div>
                                        <div className="text-gray-600">{user.userId}</div>
                                        <div className="text-gray-500 text-xs">
                                            Начал поиск: {new Date(user.startedAt).toLocaleTimeString()}
                                        </div>
                                    </div>
                                ))}
                                {searchingUsers.length === 0 && (
                                    <div className="text-center text-gray-500">
                                        Нет пользователей в поиске
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </Card>

                {chats.length > 0 && (
                    <Card className="p-4 md:col-span-2">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-xl font-bold">Существующие чаты ({chats.length})</h2>
                            <Button onClick={clearAllChats} className="text-xs bg-red-500 text-white px-2 py-1 rounded">
                                Очистить все чаты
                            </Button>
                        </div>
                        <div className="divide-y max-h-60 overflow-auto">
                            {chats.map(chat => (
                                <div key={chat.id} className="py-2">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="font-medium">{chat.id}</div>
                                            <div className="text-xs text-gray-500">
                                                Участники: {chat.participant1Name} и {chat.participant2Name}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Создан: {new Date(chat.createdAt).toLocaleString()}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Сообщений: {chat.messageCount}
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button
                                                onClick={() => goToChat(chat.id)}
                                                className="bg-blue-500 text-white text-xs px-2 py-1"
                                            >
                                                Открыть
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                <Card className="p-4 md:col-span-2">
                    <h2 className="text-xl font-bold mb-2">Логи</h2>
                    <div className="text-xs font-mono bg-gray-100 p-2 rounded max-h-60 overflow-auto">
                        {logs.map((log, i) => (
                            <div key={i} className="mb-1">{log}</div>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="mt-4 text-center">
                <Button onClick={() => navigate('/')} className="bg-gray-500 text-white">
                    Вернуться на главную
                </Button>
            </div>
        </div>
    );
};

export default TestChat;
