/**
 * Система управления событиями чатов
 */

// Типы событий чата
export type ChatEventType = 'chatCreated' | 'chatUpdated' | 'chatDeleted' | 'newMessage' | 'newChatNotification';

// Структура данных события чата
export interface ChatEvent {
    type: ChatEventType;
    chatId: string;
    timestamp: number;
    meta?: Record<string, any>;
}

// Класс для управления событиями чата через глобальные события
export class ChatEventManager {
    // Имя события, используемое для передачи через CustomEvent
    private static readonly EVENT_NAME = 'chat-event';

    /**
     * Отправить событие о создании чата
     */
    static emitChatCreated(chatId: string, participants: string[]): void {
        const event: ChatEvent = {
            type: 'chatCreated',
            chatId,
            timestamp: Date.now(),
            meta: { participants }
        };

        console.log(`[ChatEventManager] Отправка события о создании чата: ${chatId}`);
        this.emitEvent(event);

        // Также отправляем устаревшее событие для обратной совместимости
        this.emitLegacyChatFoundEvent(chatId, participants);
    }

    /**
     * Отправить событие о новом уведомлении чата
     */
    static emitNewChatNotification(chatId: string, userId: string, otherUserId: string): void {
        const event: ChatEvent = {
            type: 'newChatNotification',
            chatId,
            timestamp: Date.now(),
            meta: { userId, otherUserId }
        };

        console.log(`[ChatEventManager] Отправка уведомления о новом чате для пользователя: ${userId}`);
        this.emitEvent(event);
    }

    /**
     * Отправить событие об обновлении чата
     */
    static emitChatUpdated(chatId: string, changes: Record<string, any>): void {
        const event: ChatEvent = {
            type: 'chatUpdated',
            chatId,
            timestamp: Date.now(),
            meta: { changes }
        };

        this.emitEvent(event);
    }

    /**
     * Отправить событие о новом сообщении
     */
    static emitNewMessage(chatId: string, messageId: string, senderId: string): void {
        const event: ChatEvent = {
            type: 'newMessage',
            chatId,
            timestamp: Date.now(),
            meta: { messageId, senderId }
        };

        this.emitEvent(event);
    }

    /**
     * Прослушивание событий чата
     */
    static addEventListener(callback: (event: ChatEvent) => void): () => void {
        const handler = (e: CustomEvent) => {
            callback(e.detail as ChatEvent);
        };

        window.addEventListener(this.EVENT_NAME, handler as EventListener);

        // Возвращаем функцию для удаления слушателя
        return () => {
            window.removeEventListener(this.EVENT_NAME, handler as EventListener);
        };
    }

    /**
     * Прослушивание событий определенного типа
     */
    static addEventListenerByType(type: ChatEventType, callback: (event: ChatEvent) => void): () => void {
        const handler = (e: CustomEvent) => {
            const detail = e.detail as ChatEvent;
            if (detail.type === type) {
                callback(detail);
            }
        };

        window.addEventListener(this.EVENT_NAME, handler as EventListener);

        // Возвращаем функцию для удаления слушателя
        return () => {
            window.removeEventListener(this.EVENT_NAME, handler as EventListener);
        };
    }

    /**
     * Внутренний метод для отправки события
     */
    private static emitEvent(event: ChatEvent): void {
        const customEvent = new CustomEvent(this.EVENT_NAME, {
            detail: event,
            bubbles: true,
            cancelable: true
        });

        window.dispatchEvent(customEvent);
    }

    /**
     * Отправка устаревшего события chatFound для обратной совместимости
     */
    private static emitLegacyChatFoundEvent(chatId: string, participants: string[]): void {
        const legacyEvent = new CustomEvent('chatFound', {
            detail: {
                chatId,
                participants,
                timestamp: Date.now()
            }
        });

        window.dispatchEvent(legacyEvent);
        console.log(`[ChatEventManager] Отправлено устаревшее событие chatFound: ${chatId}`);
    }
}

// Экспортируем класс для использования в других файлах
export default ChatEventManager;