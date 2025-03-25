import { User, getCurrentUser, getUsers, saveUser } from './user';
import { getChatById, addSystemMessage } from './chat';

// Интерфейс для запроса в друзья
export interface FriendRequest {
    id: string;
    fromUserId: string;
    toUserId: string;
    chatId: string;
    status: 'pending' | 'accepted' | 'rejected';
    timestamp: number;
}

// Ключ для хранения в localStorage
const FRIEND_REQUESTS_KEY = 'friend_requests';
const FRIENDS_KEY = 'user_friends';

// Получить все запросы в друзья
export const getAllFriendRequests = (): FriendRequest[] => {
    try {
        const data = localStorage.getItem(FRIEND_REQUESTS_KEY);
        if (!data) return [];
        return JSON.parse(data);
    } catch (error) {
        console.error('Ошибка при получении запросов в друзья:', error);
        return [];
    }
};

// Получить входящие запросы для пользователя
export const getIncomingFriendRequests = (userId: string): FriendRequest[] => {
    const requests = getAllFriendRequests();
    return requests.filter(req => req.toUserId === userId && req.status === 'pending');
};

// Получить исходящие запросы от пользователя
export const getOutgoingFriendRequests = (userId: string): FriendRequest[] => {
    const requests = getAllFriendRequests();
    return requests.filter(req => req.fromUserId === userId && req.status === 'pending');
};

// Отправить запрос в друзья
export const sendFriendRequest = (fromUserId: string, toUserId: string, chatId?: string): boolean => {
    try {
        // Проверяем, есть ли уже запрос между этими пользователями
        const existingRequests = getAllFriendRequests();
        const existingRequest = existingRequests.find(
            req =>
                (req.fromUserId === fromUserId && req.toUserId === toUserId) ||
                (req.fromUserId === toUserId && req.toUserId === fromUserId)
        );

        if (existingRequest) {
            console.log('Запрос в друзья уже существует');
            return false;
        }

        // Создаем новый запрос
        const newRequest: FriendRequest = {
            id: `fr_${Date.now()}`,
            fromUserId,
            toUserId,
            chatId: chatId || '',
            status: 'pending',
            timestamp: Date.now()
        };

        // Сохраняем запрос
        const requests = [...existingRequests, newRequest];
        localStorage.setItem(FRIEND_REQUESTS_KEY, JSON.stringify(requests));

        // Если указан chatId, обновляем информацию о чате
        if (chatId) {
            try {
                const chatsData = localStorage.getItem('chats');
                if (chatsData) {
                    const chats = JSON.parse(chatsData);
                    const chatIndex = chats.findIndex((chat: any) => chat.id === chatId);

                    if (chatIndex !== -1) {
                        chats[chatIndex].friendRequestSent = true;
                        localStorage.setItem('chats', JSON.stringify(chats));
                    }
                }
            } catch (error) {
                console.error('Ошибка при обновлении данных чата:', error);
            }
        }

        return true;
    } catch (error) {
        console.error('Ошибка при отправке запроса в друзья:', error);
        return false;
    }
};

// Принять запрос в друзья
export const acceptFriendRequest = (requestId: string): boolean => {
    try {
        const requests = getAllFriendRequests();
        const requestIndex = requests.findIndex(req => req.id === requestId);

        if (requestIndex === -1) return false;

        // Обновляем статус запроса
        requests[requestIndex].status = 'accepted';
        localStorage.setItem(FRIEND_REQUESTS_KEY, JSON.stringify(requests));

        // Добавляем пользователей в списки друзей друг друга
        const request = requests[requestIndex];
        addFriend(request.fromUserId, request.toUserId);

        return true;
    } catch (error) {
        console.error('Ошибка при принятии запроса в друзья:', error);
        return false;
    }
};

// Отклонить запрос в друзья
export const rejectFriendRequest = (requestId: string): boolean => {
    try {
        const requests = getAllFriendRequests();
        const requestIndex = requests.findIndex(req => req.id === requestId);

        if (requestIndex === -1) return false;

        // Обновляем статус запроса
        requests[requestIndex].status = 'rejected';
        localStorage.setItem(FRIEND_REQUESTS_KEY, JSON.stringify(requests));

        return true;
    } catch (error) {
        console.error('Ошибка при отклонении запроса в друзья:', error);
        return false;
    }
};

// Добавить друга в список друзей
const addFriend = (userId1: string, userId2: string): void => {
    try {
        // Получаем текущие списки друзей
        const friendsData = localStorage.getItem(FRIENDS_KEY) || '{}';
        const friends = JSON.parse(friendsData);

        // Добавляем пользователей в списки друзей друг друга
        if (!friends[userId1]) friends[userId1] = [];
        if (!friends[userId2]) friends[userId2] = [];

        if (!friends[userId1].includes(userId2)) {
            friends[userId1].push(userId2);
        }

        if (!friends[userId2].includes(userId1)) {
            friends[userId2].push(userId1);
        }

        // Сохраняем обновленные списки
        localStorage.setItem(FRIENDS_KEY, JSON.stringify(friends));
    } catch (error) {
        console.error('Ошибка при добавлении друга:', error);
    }
};

// Получить список друзей пользователя
export const getUserFriends = (userId: string): string[] => {
    try {
        const friendsData = localStorage.getItem(FRIENDS_KEY);
        if (!friendsData) return [];

        const friends = JSON.parse(friendsData);
        return friends[userId] || [];
    } catch (error) {
        console.error('Ошибка при получении списка друзей:', error);
        return [];
    }
};

// Проверить, являются ли пользователи друзьями
export const areFriends = (userId1: string, userId2: string): boolean => {
    const friends = getUserFriends(userId1);
    return friends.includes(userId2);
};