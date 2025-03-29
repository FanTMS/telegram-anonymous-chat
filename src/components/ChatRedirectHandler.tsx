import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/user';
import { getNewChatNotification, hasNewChat, markChatNotificationAsRead } from '../utils/matchmaking';

interface ChatRedirectHandlerProps {
    enabled?: boolean;
}

export const ChatRedirectHandler: React.FC<ChatRedirectHandlerProps> = ({ enabled = true }) => {
    const navigate = useNavigate();
    const [checking, setChecking] = useState(false);

    useEffect(() => {
        if (!enabled) return;

        let isComponentMounted = true;
        let checkInterval: ReturnType<typeof setInterval> | null = null;

        const checkForNewChat = async () => {
            if (checking || !isComponentMounted) return;

            try {
                setChecking(true);
                const currentUser = getCurrentUser();

                if (currentUser && hasNewChat(currentUser.id)) {
                    console.log('[ChatRedirectHandler] Обнаружен новый чат для пользователя', currentUser.id);
                    const notification = getNewChatNotification(currentUser.id);

                    if (notification && !notification.isRead) {
                        console.log('[ChatRedirectHandler] Перенаправление в чат:', notification.chatId);

                        // Сохраняем ID чата в localStorage для надежности
                        localStorage.setItem('active_chat_id', notification.chatId);

                        // Перенаправляем в чат
                        navigate(`/chat/${notification.chatId}`);
                    }
                }
            } catch (error) {
                console.error('[ChatRedirectHandler] Ошибка при проверке новых чатов:', error);
            } finally {
                if (isComponentMounted) {
                    setChecking(false);
                }
            }
        };

        // Проверяем при монтировании компонента
        checkForNewChat();

        // Устанавливаем интервал для периодической проверки
        checkInterval = setInterval(checkForNewChat, 3000);

        // Настраиваем слушатель событий для нового чата
        const handleChatFound = (event: CustomEvent) => {
            const { chatId, userId } = event.detail;
            console.log('[ChatRedirectHandler] Получено событие chatFound:', chatId, userId);

            const currentUser = getCurrentUser();
            if (currentUser && currentUser.id === userId) {
                console.log('[ChatRedirectHandler] Это наш чат, перенаправляем...');
                localStorage.setItem('active_chat_id', chatId);
                navigate(`/chat/${chatId}`);
            }
        };

        window.addEventListener('chatFound', handleChatFound as EventListener);

        return () => {
            isComponentMounted = false;
            if (checkInterval) {
                clearInterval(checkInterval);
            }
            window.removeEventListener('chatFound', handleChatFound as EventListener);
        };
    }, [navigate, enabled, checking]);

    return null; // Этот компонент не рендерит никакой UI
};
