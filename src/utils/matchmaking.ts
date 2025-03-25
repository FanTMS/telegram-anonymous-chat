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
const NEW_CHAT_FLAG_KEY = 'new_chat_flag';

// Интерфейс для хранения данных о новом чате
interface NewChatNotification {
    chatId: string;
    createdAt: number;
    otherUserId: string;
    isRead: boolean;
}

// Импортируем необходимые функции
import { getCurrentUser, getUserById } from './user';
import { createChat, getChatById } from './chat';

// Получить список ищущих пользователей
export const getSearchingUsers = (): SearchingUser[] => {
    try {
        const data = localStorage.getItem(SEARCHING_USERS_KEY);
        if (!data) {
            if (DEBUG) console.log('[getSearchingUsers] Нет данных о пользователях в поиске');
            return [];
        }

        const users = JSON.parse(data);
        if (!Array.isArray(users)) {
            console.error('[getSearchingUsers] Данные не являются массивом, возвращаем пустой массив');
            return [];
        }

        return users;
    } catch (error) {
        console.error('[getSearchingUsers] Ошибка при получении списка ищущих пользователей:', error);
        return [];
    }
};

// Сохранить список ищущих пользователей
const saveSearchingUsers = (users: SearchingUser[]): void => {
    try {
        localStorage.setItem(SEARCHING_USERS_KEY, JSON.stringify(users));
        if (DEBUG) console.log(`[saveSearchingUsers] Сохранено ${users.length} пользователей в поиске`);
    } catch (error) {
        console.error('[saveSearchingUsers] Ошибка при сохранении списка ищущих пользователей:', error);
    }
};

// Добавить пользователя в поиск
export const startSearching = (
    isRandom: boolean = false,
    interests: string[] = [],
    ageRange: [number, number] = [0, 100],
    specificUserId?: string
): boolean => {
    try {
        // Определяем ID пользователя
        let userId;
        if (specificUserId) {
            userId = specificUserId;
        } else {
            const currentUser = getCurrentUser();
            if (!currentUser) {
                console.error('[startSearching] Текущий пользователь не найден');
                return false;
            }
            userId = currentUser.id;
        }

        if (DEBUG) console.log(`[startSearching] Начало поиска для пользователя ${userId}`);

        // Проверяем, не ищет ли пользователь уже
        const searchingUsers = getSearchingUsers();
        const alreadySearching = searchingUsers.some(user => user.userId === userId);

        if (alreadySearching) {
            if (DEBUG) console.log(`[startSearching] Пользователь ${userId} уже в поиске`);
            return true; // Уже в поиске
        }

        // Добавляем пользователя в список ищущих
        const newSearchingUser: SearchingUser = {
            userId,
            startedAt: Date.now(),
            preferences: {
                random: isRandom,
                interests,
                ageRange
            }
        };

        const updatedUsers = [...searchingUsers, newSearchingUser];
        saveSearchingUsers(updatedUsers);

        if (DEBUG) console.log(`[startSearching] Пользователь ${userId} добавлен в поиск`);
        return true;
    } catch (error) {
        console.error('[startSearching] Ошибка при начале поиска:', error);
        return false;
    }
};

// Прекратить поиск для пользователя
export const stopSearching = (userId?: string): boolean => {
    try {
        // Определяем ID пользователя
        let targetUserId;
        if (userId) {
            targetUserId = userId;
        } else {
            const currentUser = getCurrentUser();
            if (!currentUser) {
                console.error('[stopSearching] Текущий пользователь не найден');
                return false;
            }
            targetUserId = currentUser.id;
        }

        if (DEBUG) console.log(`[stopSearching] Остановка поиска для пользователя ${targetUserId}`);

        // Обновляем список ищущих пользователей
        const searchingUsers = getSearchingUsers();
        const wasSearching = searchingUsers.some(user => user.userId === targetUserId);

        if (!wasSearching) {
            if (DEBUG) console.log(`[stopSearching] Пользователь ${targetUserId} не был в поиске`);
            return false;
        }

        const updatedUsers = searchingUsers.filter(user => user.userId !== targetUserId);
        saveSearchingUsers(updatedUsers);

        if (DEBUG) console.log(`[stopSearching] Поиск для пользователя ${targetUserId} остановлен`);
        return true;
    } catch (error) {
        console.error('[stopSearching] Ошибка при остановке поиска:', error);
        return false;
    }
};

// Проверить, ищет ли пользователь собеседника
export const isUserSearching = (userId?: string): boolean => {
    try {
        // Определяем ID пользователя
        let targetUserId;
        if (userId) {
            targetUserId = userId;
        } else {
            const currentUser = getCurrentUser();
            if (!currentUser) {
                console.error('[isUserSearching] Текущий пользователь не найден');
                return false;
            }
            targetUserId = currentUser.id;
        }

        // Проверяем наличие пользователя в списке ищущих
        const searchingUsers = getSearchingUsers();
        return searchingUsers.some(user => user.userId === targetUserId);
    } catch (error) {
        console.error('[isUserSearching] Ошибка при проверке статуса поиска:', error);
        return false;
    }
};

// Функция для создания чата между пользователями - улучшенная версия
const createChatBetweenUsers = (participants: string[]): any => {
    try {
        if (DEBUG) console.log(`[createChatBetweenUsers] Создание чата между пользователями: ${participants.join(', ')}`);

        // Проверяем валидность участников
        if (!participants || participants.length !== 2) {
            console.error('[createChatBetweenUsers] Неверное количество участников для создания чата');
            return null;
        }

        // Проверяем, что оба участника существуют
        const user1 = getUserById(participants[0]);
        const user2 = getUserById(participants[1]);

        if (!user1 || !user2) {
            console.error('[createChatBetweenUsers] Один или оба участника не найдены:',
                !user1 ? `Пользователь ${participants[0]} не найден` : '',
                !user2 ? `Пользователь ${participants[1]} не найден` : '');
            return null;
        }

        // Проверяем, не существует ли уже чат между этими пользователями
        const existingChats = getAllChats();
        const existingChat = existingChats.find(chat =>
            chat.participants.includes(participants[0]) &&
            chat.participants.includes(participants[1]) &&
            !chat.ended
        );

        if (existingChat) {
            if (DEBUG) console.log(`[createChatBetweenUsers] Чат между ${participants[0]} и ${participants[1]} уже существует (${existingChat.id})`);

            // Устанавливаем существующий чат как активный для обоих пользователей
            setActiveChat(participants[0], existingChat.id);
            setActiveChat(participants[1], existingChat.id);

            // Создаем уведомления о чате для обоих пользователей
            createChatNotifications(participants[0], participants[1], existingChat.id);

            // Отправляем событие о существующем чате
            dispatchChatFoundEvent(existingChat.id, participants);

            return existingChat;
        }

        // Создаем новый чат
        const newChat = createChat(participants);

        if (!newChat) {
            console.error('[createChatBetweenUsers] Не удалось создать чат');
            return null;
        }

        // Устанавливаем активный чат для обоих пользователей
        setActiveChat(participants[0], newChat.id);
        setActiveChat(participants[1], newChat.id);

        // Создаем уведомления о чате для обоих пользователей
        createChatNotifications(participants[0], participants[1], newChat.id);

        if (DEBUG) console.log(`[createChatBetweenUsers] Чат успешно создан: ${newChat.id}`);

        // Отправляем событие о создании чата
        dispatchChatFoundEvent(newChat.id, participants);

        return newChat;
    } catch (error) {
        console.error('[createChatBetweenUsers] Ошибка при создании чата:', error);
        return null;
    }
};

// ПОЛНОСТЬЮ ПЕРЕРАБОТАНА функция поиска совпадений
export const findMatch = async (): Promise<boolean> => {
    if (DEBUG) console.log('[findMatch] Начинаем поиск совпадений...');

    try {
        const searchingUsers = getSearchingUsers();
        if (searchingUsers.length < 2) {
            if (DEBUG) console.log('[findMatch] Недостаточно пользователей для создания пары');
            return false;
        }

        // Сортируем пользователей по времени начала поиска (сначала самые давние)
        // Приоритет отдаем тем, кто дольше всех ждет
        const sortedUsers = [...searchingUsers].sort((a, b) => a.startedAt - b.startedAt);

        if (DEBUG) console.log('[findMatch] Отсортированные пользователи по времени ожидания:',
            sortedUsers.map(u => `${u.userId} (ждет ${Math.floor((Date.now() - u.startedAt) / 1000)}с)`));

        // Берем первого пользователя, который ждет дольше всех
        const firstUser = sortedUsers[0];
        const firstUserData = getUserById(firstUser.userId);

        if (!firstUserData) {
            console.error(`[findMatch] Пользователь ${firstUser.userId} не найден, удаляем из поиска`);
            stopSearching(firstUser.userId);
            return false;
        }

        // Оценка совместимости по интересам (0-100%)
        const calculateCompatibility = (user1: SearchingUser, user2: SearchingUser): number => {
            // Если любой из пользователей предпочитает случайный поиск, совместимость высокая
            if (user1.preferences.random || user2.preferences.random) {
                return 100;
            }

            let score = 50; // базовая совместимость

            // Проверяем совпадение интересов
            const interests1 = user1.preferences.interests || [];
            const interests2 = user2.preferences.interests || [];

            if (interests1.length > 0 && interests2.length > 0) {
                const commonInterests = interests1.filter(i => interests2.includes(i));
                if (commonInterests.length > 0) {
                    // Добавляем до 40% за общие интересы
                    score += Math.min(40, (commonInterests.length / Math.max(interests1.length, interests2.length)) * 40);
                }
            }

            // Проверяем совпадение возрастных диапазонов
            const ageRange1 = user1.preferences.ageRange || [0, 100];
            const ageRange2 = user2.preferences.ageRange || [0, 100];

            // Проверяем перекрытие возрастных диапазонов
            const overlapStart = Math.max(ageRange1[0], ageRange2[0]);
            const overlapEnd = Math.min(ageRange1[1], ageRange2[1]);

            if (overlapEnd >= overlapStart) {
                // Есть перекрытие возрастных диапазонов
                const overlap = overlapEnd - overlapStart;
                const totalRange = Math.max(ageRange1[1] - ageRange1[0], ageRange2[1] - ageRange2[0]);

                // Добавляем до 10% за совпадение возрастных диапазонов
                score += Math.min(10, (overlap / totalRange) * 10);
            }

            return score;
        };

        // Найдем наиболее совместимого партнера для первого пользователя
        let bestMatch = null;
        let bestScore = -1;

        for (let i = 1; i < sortedUsers.length; i++) {
            const potentialMatch = sortedUsers[i];

            // Проверяем существование
            const matchData = getUserById(potentialMatch.userId);
            if (!matchData) {
                console.error(`[findMatch] Потенциальный партнер ${potentialMatch.userId} не найден, удаляем из поиска`);
                stopSearching(potentialMatch.userId);
                continue;
            }

            const compatibilityScore = calculateCompatibility(firstUser, potentialMatch);

            if (DEBUG) console.log(`[findMatch] Совместимость между ${firstUser.userId} и ${potentialMatch.userId}: ${compatibilityScore}%`);

            if (compatibilityScore > bestScore) {
                bestScore = compatibilityScore;
                bestMatch = potentialMatch;
            }
        }

        // Если нашли подходящего партнера
        if (bestMatch) {
            if (DEBUG) console.log(`[findMatch] Лучшая пара: ${firstUser.userId} и ${bestMatch.userId} (совместимость: ${bestScore}%)`);

            // Создаем чат между пользователями
            const newChat = createChatBetweenUsers([firstUser.userId, bestMatch.userId]);

            if (!newChat) {
                console.error('[findMatch] Не удалось создать чат для пары');
                return false;
            }

            // Удаляем пользователей из списка поиска
            stopSearching(firstUser.userId);
            stopSearching(bestMatch.userId);

            if (DEBUG) console.log(`[findMatch] Успешно создана пара с чатом ${newChat.id}`);

            return true;
        }

        if (DEBUG) console.log('[findMatch] Не удалось найти подходящую пару');
        return false;
    } catch (error) {
        console.error('[findMatch] Критическая ошибка в процессе поиска совпадения:', error);
        return false;
    }
};

// Функция для создания уведомлений о чате для пользователей
function createChatNotifications(userId1: string, userId2: string, chatId: string): void {
    try {
        if (DEBUG) console.log(`[createChatNotifications] Создание уведомлений для пользователей ${userId1} и ${userId2} о чате ${chatId}`);

        // Создаем уведомления для обоих пользователей
        saveNewChatNotification(userId1, chatId, userId2);
        saveNewChatNotification(userId2, chatId, userId1);

        if (DEBUG) console.log('[createChatNotifications] Уведомления успешно созданы');
    } catch (error) {
        console.error('[createChatNotifications] Ошибка при создании уведомлений:', error);
    }
}

// Сохранить уведомление о новом чате для пользователя
export const saveNewChatNotification = (userId: string, chatId: string, otherUserId: string): void => {
    try {
        if (DEBUG) console.log(`[saveNewChatNotification] Сохранение уведомления для ${userId} о чате ${chatId}`);

        const notification: NewChatNotification = {
            chatId,
            createdAt: Date.now(),
            otherUserId,
            isRead: false
        };

        localStorage.setItem(`${NEW_CHAT_KEY}_${userId}`, JSON.stringify(notification));
        localStorage.setItem(`${NEW_CHAT_FLAG_KEY}_${userId}`, 'true');

        if (DEBUG) console.log(`[saveNewChatNotification] Уведомление сохранено для ${userId}`);
    } catch (error) {
        console.error('[saveNewChatNotification] Ошибка при сохранении уведомления:', error);
    }
};

// Получить уведомление о новом чате для пользователя
export const getNewChatNotification = (userId: string): NewChatNotification | null => {
    try {
        const data = localStorage.getItem(`${NEW_CHAT_KEY}_${userId}`);

        if (!data) {
            if (DEBUG) console.log(`[getNewChatNotification] Нет уведомлений для ${userId}`);
            return null;
        }

        const notification = JSON.parse(data);
        if (DEBUG) console.log(`[getNewChatNotification] Получено уведомление для ${userId}: `, notification);

        // Проверяем, существует ли чат
        const chatExists = getChatById(notification.chatId);
        if (!chatExists) {
            console.log(`[getNewChatNotification] Чат ${notification.chatId} не найден, очищаем уведомление`);
            localStorage.removeItem(`${NEW_CHAT_FLAG_KEY}_${userId}`);
            localStorage.removeItem(`${NEW_CHAT_KEY}_${userId}`);
            return null;
        }

        return notification;
    } catch (error) {
        console.error('[getNewChatNotification] Ошибка при получении уведомления о чате:', error);
        return null;
    }
};

// Проверить наличие нового чата для пользователя
export const hasNewChat = (userId: string): boolean => {
    try {
        if (!userId) {
            console.warn('[hasNewChat] userId не указан');
            return false;
        }

        const hasFlag = localStorage.getItem(`${NEW_CHAT_FLAG_KEY}_${userId}`) === 'true';
        if (DEBUG) console.log(`[hasNewChat] Проверка флага для ${userId}: ${hasFlag}`);

        if (!hasFlag) {
            return false;
        }

        const notificationData = localStorage.getItem(`${NEW_CHAT_KEY}_${userId}`);
        if (!notificationData) {
            // Если флаг есть, но данных нет, очищаем флаг
            localStorage.removeItem(`${NEW_CHAT_FLAG_KEY}_${userId}`);
            console.log(`[hasNewChat] Найден флаг, но нет данных уведомления для ${userId}`);
            return false;
        }

        try {
            const notification = JSON.parse(notificationData);

            // Проверяем, что чат действительно существует
            const chat = getChatById(notification.chatId);

            if (!chat) {
                // Если чат не существует, очищаем уведомление
                localStorage.removeItem(`${NEW_CHAT_FLAG_KEY}_${userId}`);
                localStorage.removeItem(`${NEW_CHAT_KEY}_${userId}`);
                console.log(`[hasNewChat] Чат ${notification.chatId} не найден, очищаем уведомление`);
                return false;
            }

            // Проверяем, что пользователь действительно участник этого чата
            if (!chat.participants.includes(userId)) {
                localStorage.removeItem(`${NEW_CHAT_FLAG_KEY}_${userId}`);
                localStorage.removeItem(`${NEW_CHAT_KEY}_${userId}`);
                console.log(`[hasNewChat] Пользователь ${userId} не является участником чата ${notification.chatId}`);
                return false;
            }

            console.log(`[hasNewChat] Для ${userId} найден активный чат: ${notification.chatId}`);
            return true;
        } catch (parseError) {
            console.error('[hasNewChat] Ошибка при парсинге уведомления:', parseError);
            return false;
        }
    } catch (error) {
        console.error('[hasNewChat] Ошибка в hasNewChat:', error);
        return false;
    }
};

// Отметить чат как прочитанный
export const markChatNotificationAsRead = (userId: string): void => {
    try {
        if (DEBUG) console.log(`[markChatNotificationAsRead] Отмечаем уведомление как прочитанное для ${userId}`);

        const notificationData = localStorage.getItem(`${NEW_CHAT_KEY}_${userId}`);
        if (notificationData) {
            const notification = JSON.parse(notificationData);
            notification.isRead = true;

            localStorage.setItem(`${NEW_CHAT_KEY}_${userId}`, JSON.stringify(notification));
            localStorage.removeItem(`${NEW_CHAT_FLAG_KEY}_${userId}`);

            if (DEBUG) console.log(`[markChatNotificationAsRead] Уведомление отмечено как прочитанное для ${userId}`);
        }
    } catch (error) {
        console.error('[markChatNotificationAsRead] Ошибка при отметке уведомления как прочитанного:', error);
    }
};

// Улучшенный сервис подбора пар - запускается регулярно
export const startMatchmakingService = (intervalMs: number = 2000): number => {
    if (DEBUG) console.log(`[startMatchmakingService] Запуск сервиса с интервалом ${intervalMs}ms`);

    try {
        // Останавливаем предыдущий интервал, если он был
        if (typeof window !== 'undefined' && window._matchmakingIntervalId) {
            clearInterval(window._matchmakingIntervalId);
            window._matchmakingIntervalId = null;
            if (DEBUG) console.log('[startMatchmakingService] Предыдущий интервал очищен');
        }

        // Немедленно выполняем первый поиск
        setTimeout(async () => {
            try {
                const result = await findMatch();
                if (DEBUG) console.log(`[startMatchmakingService] Начальный поиск: ${result ? 'найдена пара' : 'пара не найдена'}`);
            } catch (error) {
                console.error('[startMatchmakingService] Ошибка при выполнении начального поиска:', error);
            }
        }, 100);

        // Создаем новый интервал с более частой проверкой
        const intervalId = window.setInterval(async () => {
            try {
                const searchingUsers = getSearchingUsers();
                if (searchingUsers.length >= 2) {
                    const result = await findMatch();
                    if (DEBUG && result) console.log('[startMatchmakingService] Найдено совпадение в регулярной проверке');
                }
            } catch (error) {
                console.error('[startMatchmakingService] Ошибка при выполнении matchmaking:', error);
            }
        }, intervalMs);

        // Сохраняем ID интервала в глобальной переменной
        if (typeof window !== 'undefined') {
            window._matchmakingIntervalId = intervalId;
        }

        if (DEBUG) console.log(`[startMatchmakingService] Сервис успешно запущен с ID: ${intervalId}`);

        return intervalId;
    } catch (error) {
        console.error('[startMatchmakingService] Ошибка при запуске сервиса:', error);
        return 0;
    }
};

// Остановить сервис подбора пар
export const stopMatchmakingService = (intervalId: number): void => {
    if (DEBUG) console.log(`[stopMatchmakingService] Остановка сервиса с ID: ${intervalId}`);

    try {
        if (intervalId) {
            clearInterval(intervalId);
        }

        // Очищаем глобальную переменную, если это наш интервал
        if (typeof window !== 'undefined' && window._matchmakingIntervalId === intervalId) {
            window._matchmakingIntervalId = null;
        }

        if (DEBUG) console.log('[stopMatchmakingService] Сервис успешно остановлен');
    } catch (error) {
        console.error('[stopMatchmakingService] Ошибка при остановке сервиса:', error);
    }
};

// Ручной запуск поиска совпадения - улучшенная версия
export const triggerMatchmaking = async (): Promise<boolean> => {
    if (DEBUG) console.log('[triggerMatchmaking] Запуск ручного поиска совпадения');

    try {
        // Проверяем количество пользователей в поиске перед запуском
        const searchingUsers = getSearchingUsers();
        if (searchingUsers.length < 2) {
            if (DEBUG) console.log('[triggerMatchmaking] Недостаточно пользователей в поиске (нужно минимум 2)');
            return false;
        }

        return await findMatch();
    } catch (error) {
        console.error('[triggerMatchmaking] Ошибка при ручном поиске:', error);
        return false;
    }
};

// Принудительно создать пару между двумя конкретными пользователями - улучшенная версия
const forceMatchUsers = (userId1: string, userId2: string): boolean => {
    if (DEBUG) console.log(`[forceMatchUsers] Принудительное создание пары между ${userId1} и ${userId2}`);

    try {
        // Проверяем существование пользователей
        const user1 = getUserById(userId1);
        const user2 = getUserById(userId2);

        if (!user1 || !user2) {
            console.error('[forceMatchUsers] Один или оба пользователя не найдены');
            return false;
        }

        // Удаляем пользователей из списка поиска, если они там есть
        if (isUserSearching(userId1)) stopSearching(userId1);
        if (isUserSearching(userId2)) stopSearching(userId2);

        // Создаем чат между указанными пользователями
        const newChat = createChatBetweenUsers([userId1, userId2]);

        if (!newChat) {
            console.error('[forceMatchUsers] Не удалось создать чат');
            return false;
        }

        // Активный чат уже устанавливается в createChatBetweenUsers

        if (DEBUG) console.log(`[forceMatchUsers] Пара успешно создана с чатом ${newChat.id}`);
        return true;
    } catch (error) {
        console.error('[forceMatchUsers] Ошибка при создании принудительной пары:', error);
        return false;
    }
};

// Установить активный чат для пользователя - улучшенная версия
const setActiveChat = (userId: string, chatId: string): void => {
    try {
        if (DEBUG) console.log(`[setActiveChat] Установка активного чата ${chatId} для пользователя ${userId}`);

        // Проверяем существование чата
        const chat = getChatById(chatId);
        if (!chat) {
            console.error(`[setActiveChat] Чат ${chatId} не найден`);
            return;
        }

        // Проверяем, что пользователь действительно участник чата
        if (!chat.participants.includes(userId)) {
            console.error(`[setActiveChat] Пользователь ${userId} не является участником чата ${chatId}`);
            return;
        }

        // Проверяем, не завершен ли чат
        if (chat.ended) {
            console.error(`[setActiveChat] Попытка установить завершенный чат ${chatId} как активный`);
            return;
        }

        // Устанавливаем активный чат для конкретного пользователя
        localStorage.setItem(`active_chat_${userId}`, chatId);

        // Для совместимости также сохраняем общий ключ активного чата
        // Это решает проблему с переходом в активный чат
        localStorage.setItem('active_chat_id', chatId);

        if (DEBUG) console.log(`[setActiveChat] Активный чат успешно установлен для ${userId}`);
    } catch (error) {
        console.error('[setActiveChat] Ошибка при установке активного чата:', error);
    }
};

// Получить активный чат пользователя
const getActiveChat = (userId: string): string | null => {
    try {
        const chatId = localStorage.getItem(`active_chat_${userId}`);
        if (!chatId) return null;

        // Проверяем существование чата
        const chat = getChatById(chatId);
        if (!chat) {
            localStorage.removeItem(`active_chat_${userId}`);
            return null;
        }

        return chatId;
    } catch (error) {
        console.error('[getActiveChat] Ошибка при получении активного чата:', error);
        return null;
    }
};

// Получить все чаты
const getAllChats = (): any[] => {
    try {
        const chatsData = localStorage.getItem('chats');
        if (!chatsData) return [];

        const chats = JSON.parse(chatsData);
        if (!Array.isArray(chats)) return [];

        return chats;
    } catch (error) {
        console.error('[getAllChats] Ошибка при получении списка чатов:', error);
        return [];
    }
};

// Выделяем отправку события в отдельную функцию для переиспользования
const dispatchChatFoundEvent = (chatId: string, participants: string[]): void => {
    try {
        const event = new CustomEvent('chatFound', {
            detail: {
                chatId,
                participants,
                timestamp: Date.now()
            }
        });
        window.dispatchEvent(event);
        if (DEBUG) console.log(`[dispatchChatFoundEvent] Событие chatFound отправлено для чата ${chatId}`);
    } catch (eventError) {
        console.error('[dispatchChatFoundEvent] Ошибка при отправке события chatFound:', eventError);
    }
};

// Объявление для TypeScript - глобальная переменная для ID интервала
declare global {
    interface Window {
        _matchmakingIntervalId: number | null;
        _newChatCheckInterval: number | null;
        demoUserAdded: boolean;
    }
}

// Экспортируем функции
export {
    getChatById,
    getActiveChat,
    setActiveChat,
    forceMatchUsers,
    getAllChats
};

