import { userStorage } from './userStorage';
import { Message } from './chat'; // Импортируем тип Message из chat.ts

/**
 * Получить сообщения чата
 */
export const getChatMessages = (chatId: string): Message[] => {
    try {
        if (!chatId) return [];
        return userStorage.getItem<Message[]>(`messages_${chatId}`, []);
    } catch (error) {
        console.error(`Ошибка при получении сообщений чата ${chatId}:`, error);
        return [];
    }
}

/**
 * Сохранить сообщение в чате
 */
export const saveChatMessage = (chatId: string, message: Message): boolean => {
    try {
        if (!chatId || !message) return false;

        const messages = userStorage.getItem<Message[]>(`messages_${chatId}`, []);
        messages.push(message);
        userStorage.setItem(`messages_${chatId}`, messages);

        return true;
    } catch (error) {
        console.error(`Ошибка при сохранении сообщения в чате ${chatId}:`, error);
        return false;
    }
}

/**
 * Обновить сообщение в чате
 */
export const updateChatMessage = (chatId: string, messageId: string, updates: Partial<Message>): boolean => {
    try {
        if (!chatId || !messageId) return false;

        const messages = userStorage.getItem<Message[]>(`messages_${chatId}`, []);
        const messageIndex = messages.findIndex(msg => msg.id === messageId);

        if (messageIndex === -1) return false;

        messages[messageIndex] = { ...messages[messageIndex], ...updates };
        userStorage.setItem(`messages_${chatId}`, messages);

        return true;
    } catch (error) {
        console.error(`Ошибка при обновлении сообщения ${messageId} в чате ${chatId}:`, error);
        return false;
    }
}

/**
 * Удалить сообщение из чата
 */
export const deleteChatMessage = (chatId: string, messageId: string): boolean => {
    try {
        if (!chatId || !messageId) return false;

        const messages = userStorage.getItem<Message[]>(`messages_${chatId}`, []);
        const filteredMessages = messages.filter(msg => msg.id !== messageId);
        userStorage.setItem(`messages_${chatId}`, filteredMessages);

        return true;
    } catch (error) {
        console.error(`Ошибка при удалении сообщения ${messageId} из чата ${chatId}:`, error);
        return false;
    }
}
