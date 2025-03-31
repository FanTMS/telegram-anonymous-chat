import { userStorage } from './userStorage';
import { getCurrentUser } from './user';

/**
 * Типы событий для аналитики
 */
export enum EventType {
    ERROR = 'error',
    NAVIGATION = 'navigation',
    CHAT_ACTION = 'chat_action',
    USER_ACTION = 'user_action',
    PERFORMANCE = 'performance',
    LIFECYCLE = 'lifecycle'
}

/**
 * Сервис для сбора аналитики и отправки логов
 * В рабочей версии можно подключить настоящие сервисы аналитики
 */
class AnalyticsService {
    private events: any[] = [];
    private isEnabled = true;
    private maxEvents = 100;
    private userId: string | null = null;

    /**
     * Инициализация аналитики для пользователя
     */
    initialize(userId?: string | null): void {
        // Если ID передан явно, используем его
        if (userId) {
            this.userId = userId;
            return;
        }

        // Пытаемся получить ID из хранилища
        try {
            if (userStorage.isInitialized()) {
                this.userId = userStorage.getUserId();
            } else {
                // Проверяем текущего пользователя
                const user = getCurrentUser();
                if (user) {
                    this.userId = user.id;
                }
            }
        } catch (error) {
            console.error('Ошибка при инициализации аналитики:', error);
        }
    }

    /**
     * Включение/выключение аналитики
     */
    setEnabled(enabled: boolean): void {
        this.isEnabled = enabled;
        if (!enabled) {
            this.events = []; // Очищаем события при отключении
        }
    }

    /**
     * Запись события в лог
     */
    track(type: EventType, action: string, data?: any): void {
        if (!this.isEnabled) return;

        try {
            const event = {
                type,
                action,
                data,
                timestamp: Date.now(),
                userId: this.userId || 'unknown',
                sessionId: this.getSessionId(),
                platform: this.getPlatformInfo()
            };

            this.events.push(event);

            // Ограничиваем размер буфера событий
            if (this.events.length > this.maxEvents) {
                this.events.shift();
            }

            // В продакшене здесь можно отправлять события на сервер
            console.debug('Analytics event:', event);
        } catch (error) {
            // Не логируем ошибки самой аналитики, чтобы не вызвать рекурсию
        }
    }

    /**
     * Логирование ошибок
     */
    logError(error: Error, context?: string): void {
        this.track(EventType.ERROR, context || 'uncaught_error', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
    }

    /**
     * Логирование навигации
     */
    trackNavigation(path: string): void {
        this.track(EventType.NAVIGATION, 'page_view', { path });
    }

    /**
     * Логирование действий с чатом
     */
    trackChatAction(action: string, chatId: string, data?: any): void {
        this.track(EventType.CHAT_ACTION, action, { chatId, ...data });
    }

    /**
     * Логирование пользовательских действий
     */
    trackUserAction(action: string, data?: any): void {
        this.track(EventType.USER_ACTION, action, data);
    }

    /**
     * Получение журнала событий для отладки
     */
    getEvents(): any[] {
        return [...this.events];
    }

    /**
     * Очистка журнала событий
     */
    clearEvents(): void {
        this.events = [];
    }

    /**
     * Получение ID сессии пользователя
     */
    private getSessionId(): string {
        const sessionIdKey = 'analytics_session_id';
        let sessionId = localStorage.getItem(sessionIdKey);

        if (!sessionId) {
            sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            localStorage.setItem(sessionIdKey, sessionId);
        }

        return sessionId;
    }

    /**
     * Получение информации о платформе
     */
    private getPlatformInfo(): object {
        return {
            userAgent: navigator.userAgent,
            language: navigator.language,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            devicePixelRatio: window.devicePixelRatio || 1
        };
    }
}

export const analytics = new AnalyticsService();
export default analytics;
