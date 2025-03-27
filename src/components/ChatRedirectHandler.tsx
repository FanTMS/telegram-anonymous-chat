import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { hasNewChat, getNewChatNotification, markChatNotificationAsRead, getChatById } from '../utils/matchmaking';
import { getCurrentUser } from '../utils/user';

interface ChatRedirectHandlerProps {
    checkIntervalMs?: number;
    redirectDelay?: number;
    onChatFound?: (chatId: string) => void;
}

/**
 * Компонент для автоматического перенаправления пользователя в новый чат
 * при его создании. Регулярно проверяет наличие новых уведомлений о чатах.
 */
export const ChatRedirectHandler: React.FC<ChatRedirectHandlerProps> = ({
    checkIntervalMs = 3000,
    redirectDelay = 1000,
    onChatFound
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [foundChatId, setFoundChatId] = useState<string | null>(null);
    const [isRedirecting, setIsRedirecting] = useState(false);

    // Проверка на наличие новых чатов
    const checkForNewChats = () => {
        try {
            const currentUser = getCurrentUser();
            if (!currentUser) return;

            if (hasNewChat(currentUser.id)) {
                const notification = getNewChatNotification(currentUser.id);
                if (notification && !notification.isRead) {
                    console.log(`[ChatRedirectHandler] Найден новый чат: ${notification.chatId}`);

                    // Проверяем, существует ли чат
                    const chatId = notification.chatId;
                    const chat = getChatById(chatId);

                    if (chat) {
                        console.log(`[ChatRedirectHandler] Чат найден, участники: ${chat.participants.join(', ')}`);
                        setFoundChatId(chatId);

                        // Вызываем callback, если он предоставлен
                        if (onChatFound) {
                            onChatFound(chatId);
                        }

                        // Начинаем процесс перенаправления
                        setIsRedirecting(true);
                    } else {
                        console.error(`[ChatRedirectHandler] Чат ${chatId} не найден`);
                    }
                }
            }
        } catch (error) {
            console.error('[ChatRedirectHandler] Ошибка при проверке чатов:', error);
        }
    };

    // Обработчик события для обнаружения новых чатов
    const handleChatFound = (event: CustomEvent) => {
        console.log('[ChatRedirectHandler] Получено событие chatFound', event.detail);

        try {
            const currentUser = getCurrentUser();
            if (!currentUser) return;

            const { chatId, participants } = event.detail;

            // Проверяем, является ли текущий пользователь участником чата
            if (participants && Array.isArray(participants) && participants.includes(currentUser.id)) {
                console.log(`[ChatRedirectHandler] Текущий пользователь участник чата ${chatId}`);
                setFoundChatId(chatId);

                // Вызываем callback, если он предоставлен
                if (onChatFound) {
                    onChatFound(chatId);
                }

                // Начинаем процесс перенаправления
                setIsRedirecting(true);
            }
        } catch (error) {
            console.error('[ChatRedirectHandler] Ошибка при обработке события chatFound:', error);
        }
    };

    // Перенаправление в чат с задержкой
    useEffect(() => {
        if (isRedirecting && foundChatId) {
            const timer = setTimeout(() => {
                try {
                    const currentUser = getCurrentUser();
                    if (!currentUser) return;

                    // Отмечаем уведомление как прочитанное
                    markChatNotificationAsRead(currentUser.id);

                    // Извлекаем ID чата без префикса "chat_"
                    const normalizedChatId = foundChatId.startsWith('chat_')
                        ? foundChatId.substring(5)
                        : foundChatId;

                    console.log(`[ChatRedirectHandler] Перенаправление в чат ${normalizedChatId}`);

                    // Перенаправляем пользователя в чат
                    navigate(`/chat/${normalizedChatId}`);

                    // Сбрасываем состояние после перенаправления
                    setIsRedirecting(false);
                    setFoundChatId(null);
                } catch (error) {
                    console.error('[ChatRedirectHandler] Ошибка при перенаправлении:', error);
                }
            }, redirectDelay);

            return () => clearTimeout(timer);
        }
    }, [isRedirecting, foundChatId, navigate, redirectDelay]);

    // Настраиваем периодическую проверку и слушатель событий
    useEffect(() => {
        // Проверяем при монтировании компонента
        checkForNewChats();

        // Устанавливаем слушатель события chatFound
        window.addEventListener('chatFound', handleChatFound as EventListener);

        // Настраиваем интервал для периодической проверки
        const intervalId = setInterval(checkForNewChats, checkIntervalMs);

        // Очистка при размонтировании компонента
        return () => {
            clearInterval(intervalId);
            window.removeEventListener('chatFound', handleChatFound as EventListener);
        };
    }, [checkIntervalMs]);

    // Компонент ничего не рендерит
    return null;
};
