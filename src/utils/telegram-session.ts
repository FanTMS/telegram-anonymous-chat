// Файл: telegram-session.ts
// Менеджер для управления сессиями пользователей Telegram в приложении

import { User } from './user';
import { initializeUserByTelegramId } from './telegram-api';
import { saveUser, getUserByTelegramId, setCurrentUser } from './user';
import { storageAPI } from './storage-wrapper';

// Интерфейс сессии пользователя
export interface UserSession {
    userId: string;
    telegramId: string;
    lastActivity: number;
    isActive: boolean;
    sessionId: string; // Уникальный идентификатор сессии
    deviceInfo?: {
        userAgent?: string;
        platform?: string;
        screenSize?: string;
    };
    metadata?: {
        [key: string]: any;
    };
}

/**
 * Класс для управления сессиями пользователей Telegram
 */
export class TelegramSessionManager {
    private static instance: TelegramSessionManager;
    private activeSessions: Map<string, UserSession>; // telegramId -> session
    private sessionTimeout: number; // время в миллисекундах, после которого сессия считается неактивной
    private sessionIdToTelegramId: Map<string, string>; // для быстрого поиска сессии по sessionId

    /**
     * Приватный конструктор (Singleton паттерн)
     */
    private constructor() {
        this.activeSessions = new Map();
        this.sessionIdToTelegramId = new Map();
        this.sessionTimeout = 30 * 60 * 1000; // 30 минут по умолчанию

        // Загружаем сохраненные сессии
        this.loadSessions();

        // Запускаем периодическую проверку неактивных сессий
        setInterval(() => this.cleanInactiveSessions(), 5 * 60 * 1000); // каждые 5 минут
    }

    /**
     * Получить единственный экземпляр менеджера сессий
     */
    public static getInstance(): TelegramSessionManager {
        if (!TelegramSessionManager.instance) {
            TelegramSessionManager.instance = new TelegramSessionManager();
        }
        return TelegramSessionManager.instance;
    }

    /**
     * Установить таймаут для сессий
     * @param minutes - количество минут для таймаута
     */
    public setSessionTimeout(minutes: number): void {
        this.sessionTimeout = minutes * 60 * 1000;
    }

    /**
     * Генерирует уникальный идентификатор сессии
     */
    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    }

    /**
     * Получает информацию об устройстве
     */
    private getDeviceInfo(): UserSession['deviceInfo'] {
        try {
            const userAgent = navigator.userAgent;
            return {
                userAgent: userAgent,
                platform: navigator.platform,
                screenSize: `${window.screen.width}x${window.screen.height}`
            };
        } catch (error) {
            console.error('Ошибка при получении информации об устройстве:', error);
            return {};
        }
    }

    /**
     * Создать или обновить сессию пользователя
     * @param telegramId - Telegram ID пользователя
     * @param forceNewSession - Принудительно создать новую сессию
     * @returns Promise с объектом пользователя или null в случае ошибки
     */
    public async createOrUpdateSession(telegramId: string, forceNewSession: boolean = false): Promise<User | null> {
        try {
            console.log(`Создание/обновление сессии для Telegram ID: ${telegramId}`);

            // Принудительно создаем новую сессию, если телеграм ID отличается от сохраненного в сессии
            const currentSessionId = getCurrentSessionId();
            if (currentSessionId) {
                const sessionTelegramId = this.sessionIdToTelegramId.get(currentSessionId);
                if (sessionTelegramId && sessionTelegramId !== telegramId) {
                    console.log(`Обнаружено несоответствие Telegram ID: сессия содержит ${sessionTelegramId}, но запрошено ${telegramId}`);
                    forceNewSession = true;
                }
            }

            // Инициализируем пользователя
            const user = await initializeUserByTelegramId(telegramId);

            if (!user) {
                console.error(`Не удалось инициализировать пользователя с Telegram ID: ${telegramId}`);
                return null;
            }

            // Проверяем существующую сессию
            const existingSession = this.activeSessions.get(telegramId);

            // Создаем новую сессию или обновляем существующую
            if (!existingSession || forceNewSession) {
                // Создаем новую сессию
                const sessionId = this.generateSessionId();
                const deviceInfo = this.getDeviceInfo();

                const session: UserSession = {
                    userId: user.id,
                    telegramId: telegramId,
                    lastActivity: Date.now(),
                    isActive: true,
                    sessionId: sessionId,
                    deviceInfo: deviceInfo,
                    metadata: {
                        createdAt: Date.now(),
                        lastIp: this.getClientIp()
                    }
                };

                // Если уже есть сессия, и мы принудительно создаем новую, деактивируем старую
                if (existingSession && forceNewSession) {
                    existingSession.isActive = false;
                    console.log(`Деактивирована предыдущая сессия для Telegram ID: ${telegramId}`);
                }

                this.activeSessions.set(telegramId, session);
                this.sessionIdToTelegramId.set(sessionId, telegramId);

                // Устанавливаем новую сессию как текущую
                setCurrentSessionId(sessionId, telegramId);

                console.log(`Создана новая сессия ${sessionId} для пользователя: ${user.name} (${user.id})`);
            } else {
                // Обновляем существующую сессию
                existingSession.lastActivity = Date.now();
                existingSession.isActive = true;

                // Устанавливаем существующую сессию как текущую
                setCurrentSessionId(existingSession.sessionId, telegramId);

                console.log(`Обновлена существующая сессия ${existingSession.sessionId} для пользователя: ${user.name} (${user.id})`);
            }

            // Сохраняем сессии
            this.saveSessions();

            // Обновляем пользователя в хранилище
            user.lastActive = Date.now();
            await saveUser(user);

            return user;
        } catch (error) {
            console.error(`Ошибка при создании/обновлении сессии для Telegram ID ${telegramId}:`, error);
            return null;
        }
    }

    /**
     * Получаем IP адрес клиента (заглушка)
     */
    private getClientIp(): string {
        return "unknown"; // В реальном приложении здесь был бы код для получения IP
    }

    /**
     * Получить активную сессию по Telegram ID
     * @param telegramId - Telegram ID пользователя
     * @returns Сессия пользователя или null, если сессия не найдена
     */
    public getSession(telegramId: string): UserSession | null {
        const session = this.activeSessions.get(telegramId);

        if (session) {
            // Проверяем, не истекла ли сессия
            if (Date.now() - session.lastActivity > this.sessionTimeout) {
                session.isActive = false;
                return null;
            }
            return session;
        }

        return null;
    }

    /**
     * Получить сессию по её идентификатору
     * @param sessionId - Идентификатор сессии
     */
    public getSessionById(sessionId: string): UserSession | null {
        const telegramId = this.sessionIdToTelegramId.get(sessionId);
        if (!telegramId) return null;
        return this.getSession(telegramId);
    }

    /**
     * Активировать существующую сессию пользователя
     * @param telegramId - Telegram ID пользователя
     * @returns true если сессия активирована успешно
     */
    public async activateSession(telegramId: string): Promise<boolean> {
        try {
            // Проверяем, совпадает ли Telegram ID с ID текущей сессии
            const currentSessionId = getCurrentSessionId();
            let currentTelegramId = null;
            if (currentSessionId) {
                currentTelegramId = this.sessionIdToTelegramId.get(currentSessionId);
            }

            // Если текущая сессия принадлежит другому пользователю Telegram, принудительно создаем новую
            if (currentTelegramId && currentTelegramId !== telegramId) {
                console.log(`Обнаружено несоответствие Telegram ID: текущая сессия для ${currentTelegramId}, но запрошено ${telegramId}`);
                const result = await this.createOrUpdateSession(telegramId, true);
                return result !== null;
            }

            // Проверяем, есть ли сессия
            let session = this.activeSessions.get(telegramId);

            if (session) {
                // Проверяем, не истек ли таймаут
                if (Date.now() - session.lastActivity > this.sessionTimeout) {
                    console.log(`Сессия истекла для Telegram ID: ${telegramId}. Создаем новую.`);
                    const result = await this.createOrUpdateSession(telegramId, true);
                    return result !== null;
                }

                // Обновляем время последней активности
                session.lastActivity = Date.now();
                session.isActive = true;

                // Устанавливаем текущего пользователя
                setCurrentUser(session.userId);

                // Устанавливаем сессию как текущую
                setCurrentSessionId(session.sessionId, telegramId);

                // Обновляем пользователя в хранилище
                const user = getUserByTelegramId(telegramId);
                if (user) {
                    user.lastActive = Date.now();
                    await saveUser(user);
                }

                this.saveSessions(); // Сохраняем изменения
                console.log(`Сессия активирована для Telegram ID: ${telegramId} (session_id: ${session.sessionId})`);
                return true;
            } else {
                // Если сессии нет, создаем новую
                const result = await this.createOrUpdateSession(telegramId, true);
                return result !== null;
            }
        } catch (error) {
            console.error(`Ошибка при активации сессии для Telegram ID ${telegramId}:`, error);
            return false;
        }
    }

    /**
     * Деактивировать сессию пользователя
     * @param telegramId - Telegram ID пользователя
     */
    public deactivateSession(telegramId: string): void {
        const session = this.activeSessions.get(telegramId);

        if (session) {
            session.isActive = false;
            this.saveSessions();
            console.log(`Сессия деактивирована для Telegram ID: ${telegramId} (session_id: ${session.sessionId})`);
        }
    }

    /**
     * Деактивировать сессию по её идентификатору
     * @param sessionId - Идентификатор сессии
     */
    public deactivateSessionById(sessionId: string): void {
        const telegramId = this.sessionIdToTelegramId.get(sessionId);
        if (telegramId) {
            this.deactivateSession(telegramId);
        }
    }

    /**
     * Удалить сессию пользователя
     * @param telegramId - Telegram ID пользователя
     */
    public removeSession(telegramId: string): void {
        const session = this.activeSessions.get(telegramId);
        if (session) {
            this.sessionIdToTelegramId.delete(session.sessionId);
        }
        this.activeSessions.delete(telegramId);
        this.saveSessions();
        console.log(`Сессия удалена для Telegram ID: ${telegramId}`);
    }

    /**
     * Удалить все сессии кроме текущей
     * @param currentSessionId - ID текущей сессии, которую нужно сохранить
     */
    public removeAllSessionsExcept(currentSessionId: string): number {
        let removedCount = 0;
        const currentTelegramId = this.sessionIdToTelegramId.get(currentSessionId);

        if (!currentTelegramId) return 0;

        const sessionsToRemove = [];

        // Собираем сессии для удаления
        this.activeSessions.forEach((session, telegramId) => {
            if (telegramId === currentTelegramId && session.sessionId !== currentSessionId) {
                sessionsToRemove.push(telegramId);
            }
        });

        // Удаляем собранные сессии
        for (const telegramId of sessionsToRemove) {
            const session = this.activeSessions.get(telegramId);
            if (session) {
                this.sessionIdToTelegramId.delete(session.sessionId);
            }
            this.activeSessions.delete(telegramId);
            removedCount++;
        }

        if (removedCount > 0) {
            console.log(`Удалено ${removedCount} других сессий для пользователя с Telegram ID: ${currentTelegramId}`);
            this.saveSessions();
        }

        return removedCount;
    }

    /**
     * Получить все активные сессии
     * @returns Массив активных сессий
     */
    public getAllActiveSessions(): UserSession[] {
        const activeSessions: UserSession[] = [];

        this.activeSessions.forEach((session) => {
            if (session.isActive && (Date.now() - session.lastActivity <= this.sessionTimeout)) {
                activeSessions.push(session);
            }
        });

        return activeSessions;
    }

    /**
     * Получить все активные сессии конкретного пользователя
     * @param userId - ID пользователя
     */
    public getUserActiveSessions(userId: string): UserSession[] {
        const userSessions: UserSession[] = [];

        this.activeSessions.forEach((session) => {
            if (session.userId === userId &&
                session.isActive &&
                (Date.now() - session.lastActivity <= this.sessionTimeout)) {
                userSessions.push(session);
            }
        });

        return userSessions;
    }

    /**
     * Очистка неактивных сессий
     */
    private cleanInactiveSessions(): void {
        const now = Date.now();
        let cleaned = 0;

        const sessionsToRemove: string[] = [];

        this.activeSessions.forEach((session, telegramId) => {
            if (!session.isActive || (now - session.lastActivity > this.sessionTimeout)) {
                sessionsToRemove.push(telegramId);
                this.sessionIdToTelegramId.delete(session.sessionId);
                cleaned++;
            }
        });

        // Удаляем сессии
        for (const telegramId of sessionsToRemove) {
            this.activeSessions.delete(telegramId);
        }

        if (cleaned > 0) {
            console.log(`Очищено неактивных сессий: ${cleaned}`);
            this.saveSessions();
        }
    }

    /**
     * Сохранить сессии в хранилище
     */
    private saveSessions(): void {
        try {
            const sessions: Record<string, UserSession> = {};

            this.activeSessions.forEach((session, telegramId) => {
                sessions[telegramId] = session;
            });

            storageAPI.setItem('telegram_sessions', JSON.stringify(sessions));

            // Сохраняем также индекс sessionId -> telegramId
            const sessionIdMap: Record<string, string> = {};
            this.sessionIdToTelegramId.forEach((telegramId, sessionId) => {
                sessionIdMap[sessionId] = telegramId;
            });
            storageAPI.setItem('telegram_session_ids', JSON.stringify(sessionIdMap));
        } catch (error) {
            console.error('Ошибка при сохранении сессий:', error);
        }
    }

    /**
     * Загрузить сессии из хранилища
     */
    private loadSessions(): void {
        try {
            const sessionsJson = storageAPI.getItem('telegram_sessions');

            if (sessionsJson) {
                const sessions = JSON.parse(sessionsJson);

                for (const telegramId in sessions) {
                    // Проверяем, что у сессии есть sessionId
                    if (!sessions[telegramId].sessionId) {
                        sessions[telegramId].sessionId = this.generateSessionId();
                    }
                    this.activeSessions.set(telegramId, sessions[telegramId]);
                }

                // Восстанавливаем индекс sessionId -> telegramId
                this.activeSessions.forEach((session, telegramId) => {
                    this.sessionIdToTelegramId.set(session.sessionId, telegramId);
                });

                // Для совместимости со старыми версиями проверяем наличие сохраненного индекса
                const sessionIdMapJson = storageAPI.getItem('telegram_session_ids');
                if (sessionIdMapJson) {
                    const sessionIdMap = JSON.parse(sessionIdMapJson);
                    for (const sessionId in sessionIdMap) {
                        this.sessionIdToTelegramId.set(sessionId, sessionIdMap[sessionId]);
                    }
                }

                console.log(`Загружено ${this.activeSessions.size} сессий из хранилища`);
            }
        } catch (error) {
            console.error('Ошибка при загрузке сессий:', error);
        }
    }
}

// Экспортируем синглтон-экземпляр для удобства использования
export const telegramSessionManager = TelegramSessionManager.getInstance();

/**
 * Хук для использования в компонентах React, обеспечивающий автоматическую активацию сессии
 * @param telegramId - Telegram ID пользователя
 */
export const useActiveTelegramSession = (telegramId: string | null | undefined): void => {
    if (telegramId) {
        telegramSessionManager.activateSession(telegramId);
    }
};

/**
 * Получить идентификатор текущей сессии
 */
export const getCurrentSessionId = (): string | null => {
    try {
        // Получаем идентификатор из sessionStorage, который уникален для вкладки браузера
        let sessionId = sessionStorage.getItem('current_session_id');

        // Если идентификатора нет, то создаем новый и сохраняем
        if (!sessionId) {
            return null;
        }

        return sessionId;
    } catch (error) {
        console.error('Ошибка при получении идентификатора текущей сессии:', error);
        return null;
    }
};

/**
 * Получить Telegram ID текущей сессии
 */
export const getCurrentSessionTelegramId = (): string | null => {
    try {
        return sessionStorage.getItem('current_session_telegram_id');
    } catch (error) {
        console.error('Ошибка при получении Telegram ID текущей сессии:', error);
        return null;
    }
};

/**
 * Установить идентификатор текущей сессии
 */
export const setCurrentSessionId = (sessionId: string, telegramId: string): void => {
    try {
        sessionStorage.setItem('current_session_id', sessionId);
        sessionStorage.setItem('current_session_telegram_id', telegramId);
    } catch (error) {
        console.error('Ошибка при установке идентификатора текущей сессии:', error);
    }
};