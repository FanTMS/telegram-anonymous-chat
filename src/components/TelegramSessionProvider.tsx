import React, { useEffect, useState, createContext, useContext } from 'react';
import { User } from '../utils/user';
import { telegramSessionManager } from '../utils/telegram-session';
import WebApp from '@twa-dev/sdk';

// Контекст сессии Telegram
interface TelegramSessionContextType {
    user: User | null;
    telegramId: string | null;
    isLoading: boolean;
    error: string | null;
    refreshSession: () => Promise<void>;
}

const TelegramSessionContext = createContext<TelegramSessionContextType>({
    user: null,
    telegramId: null,
    isLoading: true,
    error: null,
    refreshSession: async () => { }
});

// Хук для использования контекста сессии
export const useTelegramSession = () => useContext(TelegramSessionContext);

interface TelegramSessionProviderProps {
    children: React.ReactNode;
}

export const TelegramSessionProvider: React.FC<TelegramSessionProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [telegramId, setTelegramId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Получаем Telegram ID из WebApp
    const getTelegramId = (): string | null => {
        try {
            // Проверяем, запущено ли приложение в Telegram
            if (WebApp.initData && WebApp.initData.length > 0) {
                const user = WebApp.initDataUnsafe?.user;
                if (user && user.id) {
                    return user.id.toString();
                }
            }

            // Для отладки - получаем из localStorage
            const debugTelegramId = localStorage.getItem('debug_telegram_id');
            if (debugTelegramId) {
                console.log(`Используем отладочный Telegram ID: ${debugTelegramId}`);
                return debugTelegramId;
            }

            return null;
        } catch (e) {
            console.error('Ошибка при получении Telegram ID:', e);
            return null;
        }
    };

    // Функция для обновления сессии
    const refreshSession = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const currentTelegramId = telegramId || getTelegramId();

            if (!currentTelegramId) {
                setError('Не удалось получить Telegram ID');
                setIsLoading(false);
                return;
            }

            // Активируем или создаем сессию
            const success = await telegramSessionManager.activateSession(currentTelegramId);

            if (!success) {
                setError('Ошибка при активации сессии');
                setIsLoading(false);
                return;
            }

            // Получаем сессию
            const session = telegramSessionManager.getSession(currentTelegramId);

            if (session) {
                // Получаем данные пользователя
                const userData = await import('../utils/user');
                const updatedUser = userData.getUserById(session.userId);

                if (updatedUser) {
                    setUser(updatedUser);
                    setTelegramId(currentTelegramId);
                } else {
                    setError('Пользователь не найден');
                }
            } else {
                setError('Сессия не найдена после активации');
            }
        } catch (e) {
            console.error('Ошибка при обновлении сессии:', e);
            setError('Неизвестная ошибка при обновлении сессии');
        } finally {
            setIsLoading(false);
        }
    };

    // Инициализация при монтировании компонента
    useEffect(() => {
        const initializeSession = async () => {
            const id = getTelegramId();

            if (id) {
                setTelegramId(id);

                try {
                    // Создаем или обновляем сессию
                    const userFromSession = await telegramSessionManager.createOrUpdateSession(id);

                    if (userFromSession) {
                        setUser(userFromSession);
                        console.log(`Сессия инициализирована для пользователя: ${userFromSession.name}`);
                    } else {
                        setError('Не удалось инициализировать сессию');
                    }
                } catch (e) {
                    console.error('Ошибка при инициализации сессии:', e);
                    setError('Ошибка при инициализации сессии');
                }
            } else {
                setError('Не удалось получить Telegram ID');
            }

            setIsLoading(false);
        };

        initializeSession();

        // Обработка события закрытия окна для сохранения сессии
        const handleBeforeUnload = () => {
            if (telegramId) {
                console.log(`Сохранение состояния сессии для ${telegramId} перед закрытием`);
                // Тут мы можем выполнить дополнительные действия перед закрытием страницы
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        // Периодическое обновление сессии для поддержания активности
        const sessionRefreshInterval = setInterval(() => {
            if (telegramId) {
                telegramSessionManager.activateSession(telegramId);
            }
        }, 5 * 60 * 1000); // Обновление сессии каждые 5 минут

        // Очистка при размонтировании
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            clearInterval(sessionRefreshInterval);
        };
    }, []);

    // Контекст, предоставляемый компонентом
    const contextValue = {
        user,
        telegramId,
        isLoading,
        error,
        refreshSession
    };

    return (
        <TelegramSessionContext.Provider value={contextValue}>
            {children}
        </TelegramSessionContext.Provider>
    );
};

export default TelegramSessionProvider;