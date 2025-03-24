import { getUsers, saveUser, User } from './user';
import { getChatsByUserId, endChat } from './chat';
import { isTestUser } from './friends';

// Удаление всех тестовых пользователей
export const removeTestUsers = (): boolean => {
    try {
        const users = getUsers();
        const testUsers = users.filter(user => isTestUser(user));

        // Завершаем все чаты с тестовыми пользователями
        testUsers.forEach(user => {
            const userChats = getChatsByUserId(user.id);
            userChats.forEach(chat => {
                endChat(chat.id);
            });
        });

        // Удаляем тестовых пользователей из списков друзей у реальных пользователей
        const realUsers = users.filter(user => !isTestUser(user));
        realUsers.forEach(user => {
            if (user.favorites) {
                user.favorites = user.favorites.filter(
                    friendId => !testUsers.some(testUser => testUser.id === friendId)
                );
                saveUser(user);
            }
        });

        return true;
    } catch (error) {
        console.error('Failed to remove test users:', error);
        return false;
    }
};

// Очистка всей системы для производственного использования
export const prepareForProduction = (): boolean => {
    try {
        // Удаляем тестовых пользователей
        removeTestUsers();

        return true;
    } catch (error) {
        console.error('Failed to prepare for production:', error);
        return false;
    }
};
