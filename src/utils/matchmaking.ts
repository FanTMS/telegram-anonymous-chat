import { User, getCurrentUser, getUserById, createDemoUser, saveUser } from './user';
import { createChat, getChatById } from './chat';

// Включаем подробное логирование
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

        // Для демо-режима, добавляем демо-пользователя если в списке только 1 пользователь
        if (searchingUsers.length === 1 && !window.demoUserAdded) {
            createDemoUserForMatching();
        }

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

// Создать демо-пользователя для поиска совпадений
export const createDemoUserForMatching = (): User | null => {
    try {
        // Создаем демо-пользователя
        const demoUser = createDemoUser("Демо Собеседник");
        if (!demoUser) {
            console.error('Не удалось создать демо-пользователя');
            return null;
        }

        console.log(`Создан демо-пользователь для поиска: ${demoUser.id}`);

        // Добавляем пользователя в поиск
        const searchingUsers = getSearchingUsers();
        searchingUsers.push({
            userId: demoUser.id,
            startedAt: Date.now(),
            preferences: {
                random: true,
                interests: [],
                ageRange: [0, 100]
            }
        });

        // Сохраняем обновленный список
        saveSearchingUsers(searchingUsers);

        // Устанавливаем флаг, что демо-пользователь был добавлен
        window.demoUserAdded = true;

        return demoUser;
    } catch (error) {
        console.error('Ошибка при создании демо-пользователя для поиска:', error);
        return null;
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

// Найти и создать пару между пользователями
export const findMatch = async (): Promise<boolean> => {
    try {
        const searchingUsers = getSearchingUsers();

        if (DEBUG) console.log(`Поиск пары среди ${searchingUsers.length} пользователей`);

        // Если меньше 2 пользователей ищут, выходим
        if (searchingUsers.length < 2) {
            if (DEBUG) console.log('Недостаточно пользователей для поиска пары');
            return false;
        }

        // Выбираем любых двух пользователей из списка
        // В будущем здесь может быть более сложный алгоритм
        const user1 = searchingUsers[0];
        const user2 = searchingUsers[1];

        console.log(`Пытаемся создать пару между ${user1.userId} и ${user2.userId}`);

        // Создаем чат
        const success = await createChatBetweenUsers(user1.userId, user2.userId);

        if (success) {
            console.log(`✅ Успешно создана пара между ${user1.userId} и ${user2.userId}`);
            return true;
        } else {
            console.error(`❌ Не удалось создать пару между ${user1.userId} и ${user2.userId}`);
            return false;
        }
    } catch (error) {
        console.error('Ошибка при поиске совпадения:', error);
        return false;
    }
};

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

// Проверить, есть ли новый чат для пользователя
export const hasNewChat = (userId: string): boolean => {
    const hasChat = localStorage.getItem(`new_chat_flag_${userId}`) === 'true';
    if (DEBUG && hasChat) console.log(`У пользователя ${userId} есть новый чат`);
    return hasChat;
};

// Отметить чат как прочитанный
export const markChatNotificationAsRead = (userId: string): void => {
    try {
        const notification = getNewChatNotification(userId);
        if (!notification) {
            if (DEBUG) console.log(`Нет уведомлений для пользователя ${userId}`);
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
}

// Создать чат между двумя пользователями и удалить их из списка поиска
async function createChatBetweenUsers(userId1: string, userId2: string): Promise<boolean> {
    try {
        console.log(`Создание чата между пользователями ${userId1} и ${userId2}`);

        // Проверяем, существуют ли оба пользователя
        const user1 = await getUserById(userId1);
        const user2 = await getUserById(userId2);

        if (!user1 || !user2) {
            console.error('Один из пользователей не найден');
            return false;
        }

        console.log(`Пользователи найдены: ${user1.name} и ${user2.name}`);

        // Создаем чат
        const chat = createChat([userId1, userId2]);

        if (!chat) {
            console.error('Не удалось создать чат между пользователями');
            return false;
        }

        console.log(`Создан новый чат ${chat.id} между ${user1.name} и ${user2.name}`);

        // Сохраняем уведомления о новом чате для обоих пользователей
        saveNewChatNotification(userId1, chat.id, userId2);
        saveNewChatNotification(userId2, chat.id, userId1);

        // Удаляем пользователей из списка поиска
        stopSearching(userId1);
        stopSearching(userId2);

        return true;
    } catch (error) {
        console.error('Ошибка при создании чата между пользователями:', error);
        return false;
    }
}

// Запускаем периодическую проверку для поиска совпадений
export const startMatchmakingService = (intervalMs: number = 3000): number => {
    console.log(`Запуск сервиса подбора собеседников с интервалом ${intervalMs} мс`);

    // Очищаем предыдущий интервал, если он был
    if (window._matchmakingIntervalId) {
        clearInterval(window._matchmakingIntervalId);
    }

    // Создаем новый интервал для проверки совпадений
    const intervalId = window.setInterval(() => {
        if (DEBUG) console.log('Запуск проверки совпадений...');

        const searchingUsers = getSearchingUsers();
        if (searchingUsers.length >= 2) {
            findMatch()
                .then(result => {
                    if (result) {
                        console.log('🎯 Найдено совпадение!');
                    }
                })
                .catch(error => console.error('Ошибка в сервисе подбора:', error));
        } else if (DEBUG) {
            console.log(`Недостаточно пользователей для поиска (${searchingUsers.length})`);
        }
    }, intervalMs);

    // Сохраняем ID интервала в глобальной переменной для возможности его очистки
    window._matchmakingIntervalId = intervalId;

    return intervalId;
};

// Остановить сервис подбора пар
export const stopMatchmakingService = (intervalId: number): void => {
    clearInterval(intervalId);
    if (window._matchmakingIntervalId === intervalId) {
        window._matchmakingIntervalId = null;
    }
};

// Ручной триггер поиска совпадения (для демо/отладки)
export const triggerMatchmaking = async (): Promise<boolean> => {
    console.log('🔄 Ручной запуск поиска совпадения');
    return await findMatch();
};
