// Файл: telegram-session.ts
// Менеджер для управления сессиями пользователей Telegram в приложении

import { User } from './user';
import { initializeUserByTelegramId } from './telegram-api';
import { saveUser, getUserByTelegramId, setCurrentUser } from './user';

// Интерфейс сессии пользователя
export interface UserSession {
    userId: string;
    telegramId: string;
    lastActivity: number;
    isActive: boolean;
}

/**
 * Класс для управления сессиями пользователей Telegram
 */
export class TelegramSessionManager {
    private static instance: TelegramSessionManager;
    private activeSessions: Map<string, UserSession>; // telegramId -> session
    private sessionTimeout: number; // время в миллисекундах, после которого сессия считается неактивной

    /**
     * Приватный конструктор (Singleton паттерн)
     */
    private constructor() {
        this.activeSessions = new Map();
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
     * Создать или обновить сессию пользователя
     * @param telegramId - Telegram ID пользователя
     * @returns Promise с объектом пользователя или null в случае ошибки
     */
    public async createOrUpdateSession(telegramId: string): Promise<User | null> {
        try {
            console.log(`Создание/обновление сессии для Telegram ID: ${telegramId}`);

            // Инициализируем пользователя
            const user = await initializeUserByTelegramId(telegramId);

            if (!user) {
                console.error(`Не удалось инициализировать пользователя с Telegram ID: ${telegramId}`);
                return null;
            }

            // Создаем или обновляем сессию
            const session: UserSession = {
                userId: user.id,
                telegramId: telegramId,
                lastActivity: Date.now(),
                isActive: true
            };

            this.activeSessions.set(telegramId, session);

            // Сохраняем сессии
            this.saveSessions();

            console.log(`Сессия создана/обновлена для пользователя: ${user.name} (${user.id})`);
            return user;
        } catch (error) {
            console.error(`Ошибка при создании/обновлении сессии для Telegram ID ${telegramId}:`, error);
            return null;
        }
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
     * Активировать существующую сессию пользователя
     * @param telegramId - Telegram ID пользователя
     * @returns true если сессия активирована успешно
     */
    public async activateSession(telegramId: string): Promise<boolean> {
        try {
            // Проверяем, есть ли сессия
            let session = this.activeSessions.get(telegramId);

            if (session) {
                // Обновляем время последней активности
                session.lastActivity = Date.now();
                session.isActive = true;

                // Устанавливаем текущего пользователя
                setCurrentUser(session.userId);

                // Обновляем пользователя в хранилище
                const user = getUserByTelegramId(telegramId);
                if (user) {
                    user.lastActive = Date.now();
                    await saveUser(user);
                }

                console.log(`Сессия активирована для Telegram ID: ${telegramId}`);
                return true;
            } else {
                // Если сессии нет, создаем новую
                const result = await this.createOrUpdateSession(telegramId);
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
            console.log(`Сессия деактивирована для Telegram ID: ${telegramId}`);
        }
    }

    /**
     * Удалить сессию пользователя
     * @param telegramId - Telegram ID пользователя
     */
    public removeSession(telegramId: string): void {
        this.activeSessions.delete(telegramId);
        this.saveSessions();
        console.log(`Сессия удалена для Telegram ID: ${telegramId}`);
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
     * Очистка неактивных сессий
     */
    private cleanInactiveSessions(): void {
        const now = Date.now();
        let cleaned = 0;

        this.activeSessions.forEach((session, telegramId) => {
            if (!session.isActive || (now - session.lastActivity > this.sessionTimeout)) {
                this.activeSessions.delete(telegramId);
                cleaned++;
            }
        });

        if (cleaned > 0) {
            console.log(`Очищено неактивных сессий: ${cleaned}`);
            this.saveSessions();
        }
    }

    /**
     * Сохранить сессии в localStorage
     */
    private saveSessions(): void {
        try {
            const sessions: Record<string, UserSession> = {};

            this.activeSessions.forEach((session, telegramId) => {
                sessions[telegramId] = session;
            });

            localStorage.setItem('telegram_sessions', JSON.stringify(sessions));
        } catch (error) {
            console.error('Ошибка при сохранении сессий:', error);
        }
    }

    /**
     * Загрузить сессии из localStorage
     */
    private loadSessions(): void {
        try {
            const sessionsJson = localStorage.getItem('telegram_sessions');

            if (sessionsJson) {
                const sessions = JSON.parse(sessionsJson);

                for (const telegramId in sessions) {
                    this.activeSessions.set(telegramId, sessions[telegramId]);
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