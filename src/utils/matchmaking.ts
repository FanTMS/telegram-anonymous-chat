import { User, getCurrentUser, getUserById, saveUser } from './user';
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

// Улучшенная версия findMatch для более надежного поиска совпадений
export const findMatch = async (): Promise<boolean> => {
    try {
        const searchingUsers = getSearchingUsers();

        if (DEBUG) console.log(`Поиск пары среди ${searchingUsers.length} пользователей:`, searchingUsers);

        // Если меньше 2 пользователей ищут, выходим
        if (searchingUsers.length < 2) {
            if (DEBUG) console.log('Недостаточно пользователей для поиска пары');
            return false;
        }

        // Упрощаем поиск - просто берем двух первых пользователей
        const user1 = searchingUsers[0];
        const user2 = searchingUsers[1];

        console.log(`Пытаемся создать пару между ${user1.userId} и ${user2.userId}`);

        // Создаем чат между пользователями
        const success = await createChatBetweenUsers(user1.userId, user2.userId);

        if (success) {
            console.log(`✅ Успешно создана пара между ${user1.userId} и ${user2.userId}`);

            // Формируем событие для каждого пользователя
            for (const userId of [user1.userId, user2.userId]) {
                const notification = getNewChatNotification(userId);
                if (notification) {
                    console.log(`Создано уведомление о чате для ${userId}: ${notification.chatId}`);

                    // Генерируем глобальное событие для информирования о новом чате
                    const chatFoundEvent = new CustomEvent('chatFound', {
                        detail: { chatId: notification.chatId }
                    });
                    window.dispatchEvent(chatFoundEvent);
                }
            }

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

// Улучшенная версия проверки наличия нового чата
export const hasNewChat = (userId: string): boolean => {
    try {
        const hasFlag = localStorage.getItem(`new_chat_flag_${userId}`) === 'true';
        const notification = getNewChatNotification(userId);
        const validNotification = notification !== null;

        if (DEBUG) {
            console.log(`Проверка наличия нового чата для ${userId}:`);
            console.log(`- Флаг: ${hasFlag}`);
            console.log(`- Уведомление: ${validNotification ? JSON.stringify(notification) : 'отсутствует'}`);
        }

        // Упрощаем условие - достаточно, чтобы было уведомление
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

// Улучшенная версия создания чата между пользователями
async function createChatBetweenUsers(userId1: string, userId2: string): Promise<boolean> {
    try {
        console.log(`Создание чата между пользователями ${userId1} и ${userId2}`);

        // Получаем данные пользователей
        const user1 = await getUserById(userId1);
        const user2 = await getUserById(userId2);

        if (!user1 || !user2) {
            console.error('Один из пользователей не найден');
            return false;
        }

        console.log(`Пользователи найдены: ${user1.name} и ${user2.name}`);

        // Создаем структуру чата
        const newChat = {
            id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            participants: [userId1, userId2],
            messages: [],
            createdAt: new Date(),
            isActive: true,
            startedAt: Date.now(),
            userId: userId1,
            partnerId: userId2,
            lastActivity: new Date()
        };

        // Получаем текущие чаты
        const chatsData = localStorage.getItem('chats');
        let chats = [];

        if (chatsData) {
            try {
                chats = JSON.parse(chatsData);
                if (!Array.isArray(chats)) {
                    console.warn('Данные чатов повреждены, создаем новый массив');
                    chats = [];
                }
            } catch (e) {
                console.error('Ошибка при чтении данных чатов:', e);
                chats = [];
            }
        }

        // Добавляем новый чат в список
        chats.push(newChat);
        localStorage.setItem('chats', JSON.stringify(chats));

        console.log(`Создан новый чат ${newChat.id} между ${user1.name} и ${user2.name}`);

        // Создаем уведомления для обоих пользователей
        saveNewChatNotification(userId1, newChat.id, userId2);
        saveNewChatNotification(userId2, newChat.id, userId1);

        // Устанавливаем флаги наличия нового чата
        localStorage.setItem(`new_chat_flag_${userId1}`, 'true');
        localStorage.setItem(`new_chat_flag_${userId2}`, 'true');

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

    // Для отладки проверяем сразу при старте
    setTimeout(() => {
        const searchingUsers = getSearchingUsers();
        if (searchingUsers.length >= 2) {
            findMatch()
                .then(result => {
                    if (result) console.log('🎯 Найдено совпадение при начальной проверке!');
                })
                .catch(error => console.error('Ошибка в сервисе подбора:', error));
        }
    }, 1000);

    // Создаем новый интервал для проверки совпадений
    const intervalId = window.setInterval(() => {
        console.log('Запуск проверки совпадений...');

        const searchingUsers = getSearchingUsers();
        console.log(`Пользователи в поиске (${searchingUsers.length}):`, searchingUsers);

        if (searchingUsers.length >= 2) {
            findMatch()
                .then(result => {
                    if (result) {
                        console.log('🎯 Найдено совпадение!');
                    } else {
                        console.log('⚠️ Совпадение не найдено, хотя пользователей достаточно');
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

// Ручной триггер поиска совпадения (для отладки)
export const triggerMatchmaking = async (): Promise<boolean> => {
    console.log('🔄 Ручной запуск поиска совпадения');
    return await findMatch();
};
