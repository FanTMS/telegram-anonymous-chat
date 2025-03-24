import { User, getCurrentUser, getUsers, saveUser } from './user';
import { getChatById, addSystemMessage } from './chat';

// Интерфейс для запроса на дружбу
export interface FriendRequest {
    id: string;
    fromUserId: string;
    toUserId: string;
    timestamp: number;
    status: 'pending' | 'accepted' | 'rejected';
    message?: string;
}

// Ключ для хранения запросов на дружбу
const FRIEND_REQUESTS_KEY = 'friend_requests';

// Получение всех запросов на дружбу
export const getAllFriendRequests = (): FriendRequest[] => {
    try {
        const data = localStorage.getItem(FRIEND_REQUESTS_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Ошибка при получении запросов на дружбу:', error);
        return [];
    }
};

// Сохранение запросов на дружбу
const saveFriendRequests = (requests: FriendRequest[]): void => {
    try {
        localStorage.setItem(FRIEND_REQUESTS_KEY, JSON.stringify(requests));
    } catch (error) {
        console.error('Ошибка при сохранении запросов на дружбу:', error);
    }
};

// Отправка запроса на дружбу
export const sendFriendRequest = (toUserId: string, message?: string): boolean => {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) return false;

        // Проверяем, существует ли пользователь
        const users = getUsers();
        const targetUser = users.find(user => user.id === toUserId);
        if (!targetUser) return false;

        // Проверяем, не являются ли пользователи уже друзьями
        if (currentUser.favorites?.includes(toUserId)) {
            console.log('Пользователи уже являются друзьями');
            return false;
        }

        // Проверяем, не отправлен ли уже запрос
        const requests = getAllFriendRequests();
        const existingRequest = requests.find(
            req => req.fromUserId === currentUser.id && req.toUserId === toUserId && req.status === 'pending'
        );

        if (existingRequest) {
            console.log('Запрос на дружбу уже отправлен');
            return false;
        }

        // Создаем новый запрос
        const newRequest: FriendRequest = {
            id: `freq_${Date.now()}`,
            fromUserId: currentUser.id,
            toUserId,
            timestamp: Date.now(),
            status: 'pending',
            message
        };

        // Сохраняем запрос
        requests.push(newRequest);
        saveFriendRequests(requests);

        // Если запрос отправлен из чата, добавляем системное сообщение
        const chatId = message?.startsWith('chat_') ? message : undefined;
        if (chatId) {
            addSystemMessage(chatId, `${currentUser.name} отправил запрос на добавление в друзья.`);
        }

        console.log(`Запрос на дружбу отправлен пользователю ${toUserId}`);
        return true;
    } catch (error) {
        console.error('Ошибка при отправке запроса на дружбу:', error);
        return false;
    }
};

// Получение входящих запросов на дружбу
export const getIncomingFriendRequests = (userId?: string): FriendRequest[] => {
    try {
        const currentId = userId || getCurrentUser()?.id;
        if (!currentId) return [];

        const requests = getAllFriendRequests();
        return requests.filter(req => req.toUserId === currentId && req.status === 'pending');
    } catch (error) {
        console.error('Ошибка при получении входящих запросов на дружбу:', error);
        return [];
    }
};

// Получение исходящих запросов на дружбу
export const getOutgoingFriendRequests = (userId?: string): FriendRequest[] => {
    try {
        const currentId = userId || getCurrentUser()?.id;
        if (!currentId) return [];

        const requests = getAllFriendRequests();
        return requests.filter(req => req.fromUserId === currentId && req.status === 'pending');
    } catch (error) {
        console.error('Ошибка при получении исходящих запросов на дружбу:', error);
        return [];
    }
};

// Принятие запроса на дружбу
export const acceptFriendRequest = (requestId: string): boolean => {
    try {
        const requests = getAllFriendRequests();
        const requestIndex = requests.findIndex(req => req.id === requestId);

        if (requestIndex === -1) return false;

        const request = requests[requestIndex];

        // Получаем обоих пользователей
        const users = getUsers();
        const fromUser = users.find(user => user.id === request.fromUserId);
        const toUser = users.find(user => user.id === request.toUserId);

        if (!fromUser || !toUser) return false;

        // Добавляем пользователей в список друзей друг друга
        if (!fromUser.favorites) fromUser.favorites = [];
        if (!toUser.favorites) toUser.favorites = [];

        if (!fromUser.favorites.includes(toUser.id)) {
            fromUser.favorites.push(toUser.id);
            saveUser(fromUser);
        }

        if (!toUser.favorites.includes(fromUser.id)) {
            toUser.favorites.push(fromUser.id);
            saveUser(toUser);
        }

        // Обновляем статус запроса
        requests[requestIndex].status = 'accepted';
        saveFriendRequests(requests);

        // Если запрос был связан с чатом, добавляем системное сообщение
        const chatId = request.message?.startsWith('chat_') ? request.message : undefined;
        if (chatId) {
            addSystemMessage(chatId, `${toUser.name} принял запрос на добавление в друзья.`);
        }

        console.log(`Запрос на дружбу от ${fromUser.name} принят пользователем ${toUser.name}`);
        return true;
    } catch (error) {
        console.error('Ошибка при принятии запроса на дружбу:', error);
        return false;
    }
};

// Отклонение запроса на дружбу
export const rejectFriendRequest = (requestId: string): boolean => {
    try {
        const requests = getAllFriendRequests();
        const requestIndex = requests.findIndex(req => req.id === requestId);

        if (requestIndex === -1) return false;

        const request = requests[requestIndex];

        // Обновляем статус запроса
        requests[requestIndex].status = 'rejected';
        saveFriendRequests(requests);

        // Если запрос был связан с чатом, добавляем системное сообщение
        const chatId = request.message?.startsWith('chat_') ? request.message : undefined;
        if (chatId) {
            // Получаем имена пользователей
            const users = getUsers();
            const toUser = users.find(user => user.id === request.toUserId);

            if (toUser) {
                addSystemMessage(chatId, `${toUser.name} отклонил запрос на добавление в друзья.`);
            }
        }

        console.log(`Запрос на дружбу с ID ${requestId} отклонен`);
        return true;
    } catch (error) {
        console.error('Ошибка при отклонении запроса на дружбу:', error);
        return false;
    }
};

// Получение списка друзей текущего пользователя
export const getUserFriends = (userId?: string): User[] => {
    const currentUser = userId ? getUsers().find(user => user.id === userId) : getCurrentUser();
    if (!currentUser || !currentUser.favorites || currentUser.favorites.length === 0) return [];

    const allUsers = getUsers();
    const friends = allUsers.filter(user =>
        currentUser.favorites?.includes(user.id) &&
        !isTestUser(user)
    );

    return friends;
};

// Определение тестового пользователя
export const isTestUser = (user: User): boolean => {
    return (
        (user.name && (
            user.name.toLowerCase().includes('test') ||
            user.name.toLowerCase().includes('демо') ||
            user.name.toLowerCase().includes('demo')
        )) ||
        (user.id && user.id.includes('demo')) ||
        (user.bio && user.bio.toLowerCase().includes('тест'))
    );
};

// Проверка есть ли у пользователя новые запросы на дружбу
export const hasNewFriendRequests = (userId?: string): boolean => {
    return getIncomingFriendRequests(userId).length > 0;
};

// Удаление из друзей
export const removeFriend = (friendId: string): boolean => {
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) return false;

        // Обновляем список друзей пользователя
        if (currentUser.favorites) {
            currentUser.favorites = currentUser.favorites.filter(id => id !== friendId);
            saveUser(currentUser);
        }

        // Также удаляем обратную связь
        const friend = getUsers().find(user => user.id === friendId);
        if (friend && friend.favorites) {
            friend.favorites = friend.favorites.filter(id => id !== currentUser.id);
            saveUser(friend);
        }

        console.log(`Пользователь ${friendId} удален из друзей`);
        return true;
    } catch (error) {
        console.error('Ошибка при удалении из друзей:', error);
        return false;
    }
};