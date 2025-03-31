import { User, getCurrentUser, getUserById } from './user';
import { Chat, saveChat, getChatById } from './chat'; // Добавляем импорт getChatById
import { userStorage } from './userStorage';

// DEBUG флаг для логирования
const DEBUG = false;

// Ключи для хранения данных
export const SEARCHING_USERS_KEY = 'searching_users';
export const NEW_CHAT_KEY = 'new_chat_notification';
export const NEW_CHAT_FLAG_KEY = 'new_chat_flag';

// Тип для пользователей в поиске
export interface SearchingUser {
    userId: string;
    startedAt: number;
    preferences?: SearchPreferences;
}

// Предпочтения для поиска
export interface SearchPreferences {
    interests?: string[];
    ageRange?: {
        min?: number;
        max?: number;
    };
    region?: string;
    similar?: boolean;
    random?: boolean;
}

// Тип для уведомления о новом чате
export interface NewChatNotification {
    chatId: string;
    createdAt: number;
    otherUserId: string;
    isRead: boolean;
}

// Проверить, находится ли пользователь в поиске
export const isUserSearching = (userId: string): boolean => {
    try {
        const searchingUsers = userStorage.getItem<SearchingUser[]>(SEARCHING_USERS_KEY, []);
        return searchingUsers.some(user => user.userId === userId);
    } catch (error) {
        console.error('[isUserSearching] Ошибка при проверке статуса поиска:', error);
        return false;
    }
};

// Получить список пользователей в поиске
export const getSearchingUsers = (): SearchingUser[] => {
    try {
        return userStorage.getItem<SearchingUser[]>(SEARCHING_USERS_KEY, []);
    } catch (error) {
        console.error('[getSearchingUsers] Ошибка при получении списка ищущих:', error);
        return [];
    }
};

// Начать поиск собеседника
export const startSearching = (userId: string, preferences?: SearchPreferences): boolean => {
    try {
        // Проверить, не находится ли пользователь уже в поиске
        if (isUserSearching(userId)) {
            console.log(`[startSearching] Пользователь ${userId} уже в поиске`);
            return false;
        }

        const searchingUser: SearchingUser = {
            userId,
            startedAt: Date.now(),
            preferences
        };

        const searchingUsers = userStorage.getItem<SearchingUser[]>(SEARCHING_USERS_KEY, []);
        searchingUsers.push(searchingUser);
        userStorage.setItem(SEARCHING_USERS_KEY, searchingUsers);

        if (DEBUG) console.log(`[startSearching] Пользователь ${userId} добавлен в поиск`);
        return true;
    } catch (error) {
        console.error('[startSearching] Ошибка при добавлении пользователя в поиск:', error);
        return false;
    }
};

// Остановить поиск собеседника
export const stopSearching = (userId: string): boolean => {
    try {
        const searchingUsers = userStorage.getItem<SearchingUser[]>(SEARCHING_USERS_KEY, []);
        const updatedUsers = searchingUsers.filter(user => user.userId !== userId);

        if (searchingUsers.length === updatedUsers.length) {
            if (DEBUG) console.log(`[stopSearching] Пользователь ${userId} не был в поиске`);
            return false;
        }

        userStorage.setItem(SEARCHING_USERS_KEY, updatedUsers);
        if (DEBUG) console.log(`[stopSearching] Пользователь ${userId} удален из поиска`);
        return true;
    } catch (error) {
        console.error('[stopSearching] Ошибка при удалении пользователя из поиска:', error);
        return false;
    }
};

// Найти совпадение
export const findMatch = async (): Promise<boolean> => {
    try {
        const searchingUsers = getSearchingUsers();

        if (searchingUsers.length < 2) {
            if (DEBUG) console.log('[findMatch] Недостаточно пользователей для поиска совпадений');
            return false;
        }

        // В текущей упрощенной версии просто берем первых двух пользователей
        const user1 = searchingUsers[0];
        const user2 = searchingUsers[1];

        // Создаем чат между найденными пользователями
        const chatId = `chat_${Date.now()}`;
        const now = Date.now();

        const newChat: Chat = {
            id: chatId,
            participants: [user1.userId, user2.userId],
            messages: [],
            isActive: true,
            startedAt: now,
            ended: false, // Исправляем здесь
            userId: user1.userId,
            partnerId: user2.userId,
            createdAt: new Date(),
            lastActivity: new Date()
        };

        // Сохраняем чат для обоих пользователей (создаем копии в их изолированных хранилищах)
        const currentStorage = userStorage.getUserId();

        // Сохранение для первого пользователя
        if (currentStorage !== user1.userId) {
            userStorage.initialize(user1.userId);
        }
        saveChat(newChat);

        // Сохранение для второго пользователя
        if (currentStorage !== user2.userId) {
            userStorage.initialize(user2.userId);
        }
        saveChat(newChat);

        // Возвращаем исходное хранилище
        if (currentStorage) {
            userStorage.initialize(currentStorage);
        }

        // Удаляем пользователей из поиска
        stopSearching(user1.userId);
        stopSearching(user2.userId);

        // Создаем уведомления о новых чатах
        createChatNotifications(user1.userId, user2.userId, chatId);

        if (DEBUG) console.log(`[findMatch] Создан чат ${chatId} между ${user1.userId} и ${user2.userId}`);
        return true;
    } catch (error) {
        console.error('[findMatch] Критическая ошибка в процессе поиска совпадения:', error);
        return false;
    }
};

// Функция для создания уведомлений о чате для пользователей
function createChatNotifications(userId1: string, userId2: string, chatId: string): void {
    saveNewChatNotification(userId1, chatId, userId2);
    saveNewChatNotification(userId2, chatId, userId1);
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

        // Сохраняем уведомление в изолированное хранилище пользователя
        const currentStorage = userStorage.getUserId();

        // Переключаемся на хранилище нужного пользователя
        if (currentStorage !== userId) {
            userStorage.initialize(userId);
        }

        userStorage.setItem(`${NEW_CHAT_KEY}_${userId}`, notification);
        userStorage.setItem(`${NEW_CHAT_FLAG_KEY}_${userId}`, true);

        // Возвращаемся к исходному хранилищу
        if (currentStorage !== userId && currentStorage) {
            userStorage.initialize(currentStorage);
        }

        if (DEBUG) console.log(`[saveNewChatNotification] Уведомление сохранено для ${userId}`);
    } catch (error) {
        console.error('[saveNewChatNotification] Ошибка при сохранении уведомления:', error);
    }
};

// Получить уведомление о новом чате для пользователя
export const getNewChatNotification = (userId: string): NewChatNotification | null => {
    try {
        // Получаем уведомление из изолированного хранилища
        const notification = userStorage.getItem<NewChatNotification>(`${NEW_CHAT_KEY}_${userId}`, null);

        if (!notification) {
            if (DEBUG) console.log(`[getNewChatNotification] Нет уведомлений для ${userId}`);
            return null;
        }

        if (DEBUG) console.log(`[getNewChatNotification] Получено уведомление для ${userId}:`, notification);

        // Проверяем существование чата
        const chatExists = getChatById(notification.chatId);

        if (!chatExists) {
            console.log(`[getNewChatNotification] Чат ${notification.chatId} не найден, очищаем уведомление`);
            userStorage.removeItem(`${NEW_CHAT_FLAG_KEY}_${userId}`);
            userStorage.removeItem(`${NEW_CHAT_KEY}_${userId}`);
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

        // Получаем флаг из изолированного хранилища
        const hasFlag = userStorage.getItem<boolean>(`${NEW_CHAT_FLAG_KEY}_${userId}`, false);

        if (DEBUG) console.log(`[hasNewChat] Проверка флага для ${userId}: ${hasFlag}`);
        return hasFlag;
    } catch (error) {
        console.error('[hasNewChat] Ошибка при проверке наличия нового чата:', error);
        return false;
    }
};

// Отметить уведомление о чате как прочитанное
export const markChatNotificationAsRead = (userId: string): boolean => {
    try {
        // Получаем уведомление из изолированного хранилища
        const notification = userStorage.getItem<NewChatNotification>(`${NEW_CHAT_KEY}_${userId}`, null);
        if (!notification) {
            return false;
        }

        // Отмечаем как прочитанное
        notification.isRead = true;
        userStorage.setItem(`${NEW_CHAT_KEY}_${userId}`, notification);

        // Снимаем флаг нового чата
        userStorage.removeItem(`${NEW_CHAT_FLAG_KEY}_${userId}`);

        return true;
    } catch (error) {
        console.error('[markChatNotificationAsRead] Ошибка при обновлении статуса уведомления:', error);
        return false;
    }
};

// Запуск сервиса подбора пар
export const startMatchmakingService = (intervalMs: number = 5000): number => {
    try {
        console.log('[startMatchmakingService] Запуск сервиса подбора пар');

        // Выполняем начальную проверку с небольшой задержкой
        const initialTimeout = window.setTimeout(async () => {
            try {
                const searchingUsers = getSearchingUsers();
                if (searchingUsers.length >= 2) {
                    if (DEBUG) console.log('[startMatchmakingService] Проверка совпадений при старте');
                    await findMatch();
                }
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
    } catch (error) {
        console.error('[stopMatchmakingService] Ошибка при остановке сервиса:', error);
    }
};

// Ручной запуск поиска совпадений (для отладки)
export const triggerMatchmaking = async (): Promise<boolean> => {
    return await findMatch();
};

