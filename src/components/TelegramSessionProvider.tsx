import React, { useEffect, useState, createContext, useContext } from 'react';
import { User, getUserById } from '../utils/user';
import { telegramSessionManager, getCurrentSessionId, getCurrentSessionTelegramId } from '../utils/telegram-session';
import WebApp from '@twa-dev/sdk';

// Контекст сессии Telegram
interface TelegramSessionContextType {
    user: User | null;
    telegramId: string | null;
    isLoading: boolean;
    error: string | null;
    refreshSession: () => Promise<void>;
    logout: () => void;
}

const TelegramSessionContext = createContext<TelegramSessionContextType>({
    user: null,
    telegramId: null,
    isLoading: true,
    error: null,
    refreshSession: async () => { },
    logout: () => { }
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

    // Проверка на смену пользователя Telegram
    const checkTelegramUserChange = (currentId: string | null): boolean => {
        if (!currentId) return false;

        // Получаем ID из текущей сессии
        const sessionTelegramId = getCurrentSessionTelegramId();

        // Если ID из сессии существует и отличается от текущего, значит пользователь сменился
        return sessionTelegramId !== null && sessionTelegramId !== currentId;
    };

    // Функция выхода из сессии
    const logout = () => {
        console.log('Выход из сессии');

        // Очищаем сессию в sessionStorage
        sessionStorage.removeItem('current_session_id');
        sessionStorage.removeItem('current_session_telegram_id');

        // Сбрасываем состояние
        setUser(null);
        setTelegramId(null);
        setError(null);

        // Перезагружаем страницу для гарантированного обновления состояния
        window.location.reload();
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

            // Проверяем, сменился ли пользователь Telegram
            const userChanged = checkTelegramUserChange(currentTelegramId);
            if (userChanged) {
                console.log('Обнаружена смена пользователя Telegram, создаем новую сессию');
                // Если пользователь сменился, принудительно создаем новую сессию
                const userFromSession = await telegramSessionManager.createOrUpdateSession(currentTelegramId, true);

                if (userFromSession) {
                    setUser(userFromSession);
                    setTelegramId(currentTelegramId);
                    console.log(`Создана новая сессия для пользователя: ${userFromSession.name}`);
                } else {
                    setError('Не удалось создать новую сессию для сменившегося пользователя');
                }

                setIsLoading(false);
                return;
            }

            // Если нет смены пользователя, просто активируем или создаем сессию
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
                const updatedUser = getUserById(session.userId);

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

            if (!id) {
                setError('Не удалось получить Telegram ID');
                setIsLoading(false);
                return;
            }

            setTelegramId(id);

            // Проверяем, сменился ли пользователь Telegram
            const userChanged = checkTelegramUserChange(id);

            try {
                // Создаем или обновляем сессию, принудительно создаем новую если сменился пользователь
                const userFromSession = await telegramSessionManager.createOrUpdateSession(id, userChanged);

                if (userFromSession) {
                    setUser(userFromSession);
                    console.log(`Сессия ${userChanged ? 'создана' : 'обновлена'} для пользователя: ${userFromSession.name}`);
                } else {
                    setError('Не удалось инициализировать сессию');
                }
            } catch (e) {
                console.error('Ошибка при инициализации сессии:', e);
                setError('Ошибка при инициализации сессии');
            } finally {
                setIsLoading(false);
            }
        };

        initializeSession();

        // Обработка события закрытия окна для сохранения сессии
        const handleBeforeUnload = () => {
            if (telegramId) {
                console.log(`Сохранение состояния сессии для ${telegramId} перед закрытием`);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        // Периодическое обновление сессии для поддержания активности
        const sessionRefreshInterval = setInterval(() => {
            if (telegramId) {
                // Используем тихое обновление сессии (без обновления состояния компонента)
                telegramSessionManager.activateSession(telegramId).catch(err =>
                    console.error('Ошибка при периодическом обновлении сессии:', err)
                );
            }
        }, 5 * 60 * 1000); // Обновление сессии каждые 5 минут

        // Обработчик для мониторинга изменений в Telegram WebApp
        const handleVisibilityChange = async () => {
            if (!document.hidden && telegramId) {
                // При возвращении на вкладку проверяем, не сменился ли пользователь
                const currentId = getTelegramId();
                if (currentId && currentId !== telegramId) {
                    console.log('Обнаружена смена пользователя при возвращении на вкладку');
                    // Если пользователь сменился, обновляем сессию
                    refreshSession();
                }
            }
        };

        // Добавляем обработчик изменения видимости страницы
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Очистка при размонтировании
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            clearInterval(sessionRefreshInterval);
        };
    }, [telegramId]); // Добавляем telegramId в массив зависимостей для корректной работы эффекта

    // Контекст, предоставляемый компонентом
    const contextValue = {
        user,
        telegramId,
        isLoading,
        error,
        refreshSession,
        logout
    };

    return (
        <TelegramSessionContext.Provider value={contextValue}>
            {children}
        </TelegramSessionContext.Provider>
    );
};

export default TelegramSessionProvider;