import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../utils/user';
import { hasNewChat, getNewChatNotification, markChatNotificationAsRead } from '../utils/matchmaking';

interface ChatRedirectHandlerProps {
    enabled?: boolean;
    checkInterval?: number;
}

/**
 * Компонент для автоматического перенаправления на новые чаты
 * Проверяет наличие новых чатов и перенаправляет пользователя
 */
export const ChatRedirectHandler: React.FC<ChatRedirectHandlerProps> = ({
    enabled = true,
    checkInterval = 3000
}) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isChecking, setIsChecking] = useState(false);

    // Проверяем наличие новых чатов и перенаправляем при необходимости
    useEffect(() => {
        if (!enabled) return;

        // Не проверяем, если уже находимся на странице чата
        if (location.pathname.includes('/chat/')) return;

        // Не запускаем повторные проверки
        if (isChecking) return;

        const checkForNewChats = () => {
            try {
                const currentUser = getCurrentUser();

                if (!currentUser) {
                    console.log('ChatRedirectHandler: пользователь не авторизован');
                    return;
                }

                // Проверяем есть ли новый чат
                if (hasNewChat(currentUser.id)) {
                    console.log('ChatRedirectHandler: Обнаружен новый чат');

                    // Получаем информацию о новом чате
                    const notification = getNewChatNotification(currentUser.id);

                    if (notification && !notification.isRead) {
                        console.log(`ChatRedirectHandler: Перенаправление на чат ${notification.chatId}`);

                        // Сохраняем ID активного чата перед переходом
                        localStorage.setItem('active_chat_id', notification.chatId);

                        // Перенаправляем на страницу чата
                        navigate(`/chat/${notification.chatId}`);

                        // Отмечаем уведомление как прочитанное
                        markChatNotificationAsRead(currentUser.id);
                    }
                }
            } catch (error) {
                console.error('Ошибка при проверке новых чатов:', error);
            }
        };

        setIsChecking(true);

        // Проверяем при монтировании
        checkForNewChats();

        // Запускаем периодическую проверку
        const intervalId = setInterval(checkForNewChats, checkInterval);

        return () => {
            clearInterval(intervalId);
            setIsChecking(false);
        };
    }, [enabled, navigate, location.pathname, checkInterval, isChecking]);

    // Этот компонент не рендерит UI
    return null;
};

export default ChatRedirectHandler;
