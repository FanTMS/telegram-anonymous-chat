import { User, getCurrentUser, getUserById, createTestUser } from './user';
import { Chat, createChat, getChatById } from './chat';

// Включаем подробное логирование для выявления проблем
const DEBUG = true;

// Интерфейс для пользователя в поиске
interface SearchingUser {
    userId: string;
    startedAt: number;
    preferences: {
        random?: boolean;
        interests?: string[];
        ageRange?: [number, number];
    };
}

// Ключ для хранения данных поиска
const SEARCHING_USERS_KEY = 'searching_users';

// Добавим события для оповещения о новых чатах
const NEW_CHAT_KEY = 'new_chat_notification';

// Интерфейс для хранения данных о новом чате
interface NewChatNotification {
    chatId: string;
    createdAt: number;
    otherUserId: string;
    isRead: boolean;
}

// Получить список ищущих пользователей
export const getSearchingUsers = (): SearchingUser[] => {
    try {
        const data = localStorage.getItem(SEARCHING_USERS_KEY);
        if (!data) return [];

        const users = JSON.parse(data);
        if (DEBUG) console.log('Текущие пользователи в поиске:', users);
        return users;
    } catch (error) {
        console.error('Ошибка при получении списка ищущих пользователей:', error);
        return [];
    }
};

// Сохранить список ищущих пользователей
const saveSearchingUsers = (users: SearchingUser[]): void => {
    try {
        localStorage.setItem(SEARCHING_USERS_KEY, JSON.stringify(users));
        if (DEBUG) console.log('Сохранен обновленный список ищущих:', users);
    } catch (error) {
        console.error('Ошибка при сохранении списка ищущих пользователей:', error);
    }
};

// Добавить пользователя в поиск
export const startSearching = (
    isRandom: boolean = false,
    interests: string[] = [],
    ageRange: [number, number] = [0, 100]
): boolean => {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            console.error('Не удалось начать поиск: пользователь не авторизован');
            return false;
        }

        console.log(`Пользователь ${currentUser.id} (${currentUser.name}) начинает поиск`);

        // Очищаем предыдущие уведомления о чатах для этого пользователя
        localStorage.removeItem(`${NEW_CHAT_KEY}_${currentUser.id}`);
        localStorage.removeItem(`new_chat_flag_${currentUser.id}`);

        // Получаем текущий список
        const searchingUsers = getSearchingUsers();

        // Проверяем, не ищет ли пользователь уже
        const existingIndex = searchingUsers.findIndex(u => u.userId === currentUser.id);
        if (existingIndex >= 0) {
            // Обновляем предпочтения, если пользователь уже ищет
            searchingUsers[existingIndex].preferences = {
                random: isRandom,
                interests: isRandom ? [] : interests,
                ageRange
            };
            console.log(`Обновлены предпочтения поиска для ${currentUser.id}`);
        } else {
            // Добавляем пользователя в список ищущих
            searchingUsers.push({
                userId: currentUser.id,
                startedAt: Date.now(),
                preferences: {
                    random: isRandom,
                    interests: isRandom ? [] : interests,
                    ageRange
                }
            });
            console.log(`${currentUser.id} добавлен в список ищущих`);
        }

        // Сохраняем обновленный список
        saveSearchingUsers(searchingUsers);

        // Временное решение: создаем тестового пользователя, когда кто-то начинает поиск
        // (закомментировать после отладки)
        setTimeout(() => {
            // Если пользователь начал поиск и нет других ищущих, создаем тестового
            if (searchingUsers.length <= 1) {
                try {
                    const testUser = createTestUser(`Тестовый_${Date.now()}`);
                    if (testUser) {
                        // Добавляем тестового пользователя в поиск
                        const updatedSearchingUsers = getSearchingUsers();
                        updatedSearchingUsers.push({
                            userId: testUser.id,
                            startedAt: Date.now(),
                            preferences: {
                                random: true,
                                interests: [],
                                ageRange: [0, 100]
                            }
                        });
                        saveSearchingUsers(updatedSearchingUsers);
                        console.log('Добавлен тестовый пользователь для подбора пары');
                    }
                } catch (e) {
                    console.error('Ошибка при создании тестового пользователя:', e);
                }
            }
        }, 2000);

        // Пытаемся найти соответствие сразу
        findMatch()
            .then(result => {
                if (result) {
                    console.log('Найдено совпадение сразу после начала поиска');
                }
            })
            .catch(error => {
                console.error('Ошибка при поиске совпадения:', error);
            });

        return true;
    } catch (error) {
        console.error('Ошибка при начале поиска:', error);
        return false;
    }
};

// Прекратить поиск для пользователя
export const stopSearching = (userId?: string): boolean => {
    try {
        // Если ID не указан, используем текущего пользователя
        const id = userId || getCurrentUser()?.id;
        if (!id) {
            console.error('Не указан ID пользователя для остановки поиска');
            return false;
        }

        console.log(`Останавливаем поиск для пользователя ${id}`);

        // Получаем текущий список
        const searchingUsers = getSearchingUsers();

        // Удаляем пользователя из списка
        const newList = searchingUsers.filter(u => u.userId !== id);

        // Сохраняем обновленный список
        saveSearchingUsers(newList);

        console.log(`Пользователь ${id} удален из списка поиска`);

        return true;
    } catch (error) {
        console.error('Ошибка при остановке поиска:', error);
        return false;
    }
};

// Проверить, ищет ли пользователь собеседника
export const isUserSearching = (userId?: string): boolean => {
    try {
        // Если ID не указан, используем текущего пользователя
        const id = userId || getCurrentUser()?.id;
        if (!id) return false;

        // Получаем текущий список
        const searchingUsers = getSearchingUsers();

        // Проверяем, есть ли пользователь в списке
        const isSearching = searchingUsers.some(u => u.userId === id);

        if (DEBUG) console.log(`Проверка статуса поиска для ${id}: ${isSearching}`);

        return isSearching;
    } catch (error) {
        console.error('Ошибка при проверке статуса поиска:', error);
        return false;
    }
};

// ПОЛНОСТЬЮ ПЕРЕРАБОТАНА функция поиска совпадений
export const findMatch = async (): Promise<boolean> => {
    try {
        const searchingUsers = getSearchingUsers();
        console.log(`Поиск пары среди ${searchingUsers.length} пользователей:`, searchingUsers);

        // Проверяем наличие минимум 2 пользователей для сопоставления
        if (searchingUsers.length < 2) {
            console.log('Недостаточно пользователей для создания пары');
            return false;
        }

        // Выбираем первых двух РАЗНЫХ пользователей
        // Это критически важно - убедиться, что мы не пытаемся соединить пользователя с самим собой
        const user1 = searchingUsers[0];

        // Важно! Ищем именно другого пользователя, не того же самого
        const availablePartners = searchingUsers.filter(u => u.userId !== user1.userId);

        if (availablePartners.length === 0) {
            console.log('Нет доступных партнеров для пользователя', user1.userId);
            return false;
        }

        const user2 = availablePartners[0];

        console.log(`Создаем пару между ${user1.userId} и ${user2.userId}`);

        // Проверяем, существуют ли пользователи в базе
        const user1Data = await getUserById(user1.userId);
        const user2Data = await getUserById(user2.userId);

        if (!user1Data || !user2Data) {
            console.error('Один из пользователей не найден:',
                user1Data ? 'Второй пользователь не найден' : 'Первый пользователь не найден');
            // Удаляем несуществующего пользователя из поиска
            if (!user1Data) stopSearching(user1.userId);
            if (!user2Data) stopSearching(user2.userId);
            return false;
        }

        // Проверяем существующие чаты перед созданием нового
        try {
            const existingChatsData = localStorage.getItem('chats');
            if (existingChatsData) {
                const existingChats = JSON.parse(existingChatsData);
                console.log(`Текущие чаты перед сохранением (${existingChats.length}):`,
                    existingChats.map((c: any) => c.id).join(', '));
            }
        } catch (e) {
            console.error('Ошибка при чтении данных существующих чатов:', e);
        }

        // Создаем новый чат между двумя пользователями
        const chatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log(`Создаем чат с ID: ${chatId}`);

        // Формируем структуру чата
        const newChat: Chat = {
            id: chatId,
            participants: [user1.userId, user2.userId],
            messages: [],
            isActive: true,
            startedAt: Date.now(),
            userId: user1.userId,
            partnerId: user2.userId,
            createdAt: new Date(),
            lastActivity: new Date()
        };

        // Сохраняем чат в локальное хранилище
        try {
            const chatsStr = localStorage.getItem('chats');
            let chats: Chat[] = [];

            if (chatsStr) {
                try {
                    chats = JSON.parse(chatsStr);
                    if (!Array.isArray(chats)) {
                        console.error('Данные чатов повреждены, создаем новый массив');
                        chats = [];
                    }
                } catch (e) {
                    console.error('Ошибка при парсинге данных чатов:', e);
                    chats = [];
                }
            }

            chats.push(newChat);
            localStorage.setItem('chats', JSON.stringify(chats));
            console.log('Чат успешно создан и сохранен:', newChat);

            // Проверяем, что чат действительно сохранился
            const updatedChatsStr = localStorage.getItem('chats');
            if (updatedChatsStr) {
                const updatedChats = JSON.parse(updatedChatsStr);
                const chatExists = updatedChats.some((c: any) => c.id === chatId);
                if (!chatExists) {
                    console.error('Чат не был сохранен корректно!');
                    return false;
                }
                console.log(`Проверка: чат ${chatId} найден в localStorage`);
            }
        } catch (e) {
            console.error('Ошибка при сохранении чата:', e);
            return false;
        }

        // ВАЖНО! Удаляем пользователей из поиска
        stopSearching(user1.userId);
        stopSearching(user2.userId);

        // Создаем уведомления для обоих пользователей
        createChatNotifications(user1.userId, user2.userId, chatId);

        // Отправляем события для оповещения интерфейса
        // Сначала текущему пользователю
        const currentUser = getCurrentUser();
        if (currentUser && (currentUser.id === user1.userId || currentUser.id === user2.userId)) {
            console.log('Отправляем событие для текущего пользователя');
            const event = new CustomEvent('chatFound', {
                detail: { chatId, userId: currentUser.id }
            });
            window.dispatchEvent(event);
        }

        // Затем всем остальным через небольшую паузу
        setTimeout(() => {
            if (currentUser?.id !== user1.userId) {
                const event1 = new CustomEvent('chatFound', {
                    detail: { chatId, userId: user1.userId }
                });
                window.dispatchEvent(event1);
            }

            if (currentUser?.id !== user2.userId) {
                const event2 = new CustomEvent('chatFound', {
                    detail: { chatId, userId: user2.userId }
                });
                window.dispatchEvent(event2);
            }

            console.log('События chatFound отправлены для обоих пользователей');
        }, 200);

        return true;
    } catch (error) {
        console.error('Критическая ошибка при поиске совпадения:', error);
        return false;
    }
};

// Функция для создания уведомлений о чате для пользователей
function createChatNotifications(userId1: string, userId2: string, chatId: string): void {
    try {
        // Создаем уведомление для первого пользователя
        const notification1: NewChatNotification = {
            chatId,
            createdAt: Date.now(),
            otherUserId: userId2,
            isRead: false
        };

        // Создаем уведомление для второго пользователя
        const notification2: NewChatNotification = {
            chatId,
            createdAt: Date.now(),
            otherUserId: userId1,
            isRead: false
        };

        // Сохраняем уведомления в localStorage
        localStorage.setItem(`${NEW_CHAT_KEY}_${userId1}`, JSON.stringify(notification1));
        localStorage.setItem(`${NEW_CHAT_KEY}_${userId2}`, JSON.stringify(notification2));

        // Устанавливаем флаги о новых чатах
        localStorage.setItem(`new_chat_flag_${userId1}`, 'true');
        localStorage.setItem(`new_chat_flag_${userId2}`, 'true');

        console.log(`Уведомления о чате ${chatId} созданы для пользователей ${userId1} и ${userId2}`);
    } catch (error) {
        console.error('Ошибка при создании уведомлений о чате:', error);
    }
}

// Сохранить уведомление о новом чате для пользователя
export const saveNewChatNotification = (userId: string, chatId: string, otherUserId: string): void => {
    try {
        const notification: NewChatNotification = {
            chatId,
            createdAt: Date.now(),
            otherUserId,
            isRead: false
        };

        // Сохраняем в localStorage
        localStorage.setItem(`${NEW_CHAT_KEY}_${userId}`, JSON.stringify(notification));

        // Устанавливаем флаг для нового чата
        localStorage.setItem(`new_chat_flag_${userId}`, 'true');

        console.log(`Сохранено уведомление о чате ${chatId} для пользователя ${userId}`);
    } catch (error) {
        console.error('Ошибка при сохранении уведомления о чате:', error);
    }
};

// Получить уведомление о новом чате для пользователя
export const getNewChatNotification = (userId: string): NewChatNotification | null => {
    try {
        const data = localStorage.getItem(`${NEW_CHAT_KEY}_${userId}`);
        if (!data) {
            if (DEBUG) console.log(`Уведомления о чате для ${userId} не найдены`);
            return null;
        }

        const notification = JSON.parse(data);
        if (DEBUG) console.log(`Получено уведомление о чате для ${userId}:`, notification);

        return notification;
    } catch (error) {
        console.error('Ошибка при получении уведомления о чате:', error);
        return null;
    }
};

// Проверить наличие нового чата
export const hasNewChat = (userId: string): boolean => {
    try {
        const hasFlag = localStorage.getItem(`new_chat_flag_${userId}`) === 'true';
        const notification = getNewChatNotification(userId);
        const validNotification = notification !== null;

        console.log(`Проверка наличия нового чата для ${userId}:`, {
            hasFlag,
            notification: validNotification ? notification : 'отсутствует'
        });

        return validNotification && hasFlag;
    } catch (error) {
        console.error('Ошибка при проверке наличия нового чата:', error);
        return false;
    }
};

// Отметить чат как прочитанный
export const markChatNotificationAsRead = (userId: string): void => {
    try {
        const notification = getNewChatNotification(userId);
        if (!notification) {
            console.log(`Нет уведомлений для пользователя ${userId}`);
            return;
        }

        notification.isRead = true;
        localStorage.setItem(`${NEW_CHAT_KEY}_${userId}`, JSON.stringify(notification));

        // Снимаем флаг нового чата
        localStorage.removeItem(`new_chat_flag_${userId}`);

        console.log(`Уведомление о чате для ${userId} отмечено как прочитанное`);
    } catch (error) {
        console.error('Ошибка при отметке уведомления о чате как прочитанного:', error);
    }
};

// Улучшенный сервис подбора пар - запускается регулярно
export const startMatchmakingService = (intervalMs: number = 3000): number => {
    console.log(`Запуск сервиса подбора собеседников с интервалом ${intervalMs} мс`);

    // Очищаем предыдущий интервал, если он был
    if (window._matchmakingIntervalId) {
        clearInterval(window._matchmakingIntervalId);
    }

    // Запускаем проверку через небольшую задержку
    setTimeout(() => {
        const searchingUsers = getSearchingUsers();
        console.log(`Начальная проверка. Пользователей в поиске: ${searchingUsers.length}`);

        if (searchingUsers.length >= 2) {
            findMatch()
                .then(result => {
                    if (result) {
                        console.log('Найдено совпадение при начальной проверке!');
                    } else {
                        console.log('Совпадение не найдено при начальной проверке');
                    }
                })
                .catch(error => console.error('Ошибка в сервисе подбора:', error));
        }
    }, 1000);

    // Создаем новый интервал для регулярных проверок
    const intervalId = window.setInterval(() => {
        console.log('Регулярная проверка совпадений...');

        const searchingUsers = getSearchingUsers();

        if (searchingUsers.length >= 2) {
            console.log(`Пользователи в поиске (${searchingUsers.length}):`,
                searchingUsers.map(u => u.userId).join(', '));

            findMatch()
                .then(result => {
                    if (result) {
                        console.log('🎯 Найдено совпадение!');
                    } else {
                        console.log('⚠️ Совпадение не найдено, хотя пользователей достаточно');
                    }
                })
                .catch(error => console.error('Ошибка в сервисе подбора:', error));
        } else {
            console.log(`Недостаточно пользователей для поиска (${searchingUsers.length})`);
        }
    }, intervalMs);

    // Сохраняем ID интервала в глобальной переменной
    window._matchmakingIntervalId = intervalId;

    return intervalId;
};

// Остановить сервис подбора пар
export const stopMatchmakingService = (intervalId: number): void => {
    clearInterval(intervalId);
    if (window._matchmakingIntervalId === intervalId) {
        window._matchmakingIntervalId = null;
        console.log('Сервис подбора остановлен');
    }
};

// Ручной запуск поиска совпадения
export const triggerMatchmaking = async (): Promise<boolean> => {
    console.log('🔄 Ручной запуск поиска совпадения');
    const result = await findMatch();
    console.log(`Результат ручного поиска: ${result ? 'Найдено' : 'Не найдено'}`);
    return result;
};

// Объявление для TypeScript - глобальная переменная для ID интервала
declare global {
    interface Window {
        _matchmakingIntervalId: number | null;
        _newChatCheckInterval: number | null;
        demoUserAdded: boolean;
    }
}

export { getChatById };

