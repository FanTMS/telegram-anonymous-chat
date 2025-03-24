import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser } from '../utils/user';
import { hasNewChat, getNewChatNotification, markChatNotificationAsRead } from '../utils/matchmaking';

// Компонент для обработки перенаправления на новый чат
export const ChatRedirectHandler = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Если пользователь уже на странице чата, не перенаправляем
        if (location.pathname.includes('/chat/')) {
            return;
        }

        // Функция для проверки новых чатов
        const checkForNewChats = () => {
            const currentUser = getCurrentUser();
            if (!currentUser) return;

            try {
                // Проверяем, есть ли новый чат
                const hasNew = hasNewChat(currentUser.id);
                console.log(`Проверка наличия новых чатов для ${currentUser.id}: ${hasNew}`);

                if (hasNew) {
                    const notification = getNewChatNotification(currentUser.id);

                    if (notification && !notification.isRead) {
                        console.log(`Обнаружен новый чат: ${notification.chatId}`, notification);

                        // Сохраняем ID чата, чтобы использовать его на странице чата
                        localStorage.setItem('active_chat_id', notification.chatId);

                        // Перенаправляем на страницу чата
                        console.log(`Перенаправление на чат: /chat/${notification.chatId}`);
                        navigate(`/chat/${notification.chatId}`);
                    }
                }
            } catch (error) {
                console.error('Ошибка при проверке новых чатов:', error);
            }
        };

        // Проверяем сразу после монтирования
        checkForNewChats();

        // Запускаем периодическую проверку
        const intervalId = setInterval(checkForNewChats, 3000);

        return () => {
            clearInterval(intervalId);
        };
    }, [navigate, location.pathname]);

    return null;
};
