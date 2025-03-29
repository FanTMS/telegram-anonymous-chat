// filepath: c:\Users\user\Desktop\Project\telegram-anonymous-chat\src\components\InitialRegistrationCheck.tsx
import { useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getUserByTelegramId, setCurrentUser } from '../utils/user';
import { telegramApi } from '../utils/database';
import { telegramSessionManager, getCurrentSessionTelegramId } from '../utils/telegram-session';
import WebApp from '@twa-dev/sdk';

interface InitialRegistrationCheckProps {
    children: ReactNode;
}

/**
 * Компонент для проверки необходимости регистрации при первом запуске
 */
export const InitialRegistrationCheck: React.FC<InitialRegistrationCheckProps> = ({ children }) => {
    const navigate = useNavigate();
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const checkRegistration = async () => {
            try {
                // Инициализируем Telegram API
                await telegramApi.initialize();

                // Получаем Telegram ID пользователя сначала
                const telegramId = telegramApi.getUserId();
                if (!telegramId) {
                    console.log('Не удалось получить Telegram ID, перенаправляем на регистрацию');
                    navigate('/registration', { replace: true });
                    return;
                }

                // Проверяем, не сменился ли пользователь Telegram
                const currentSessionTelegramId = getCurrentSessionTelegramId();
                const userChanged = currentSessionTelegramId !== null && currentSessionTelegramId !== telegramId;

                if (userChanged) {
                    console.log(`Обнаружена смена пользователя Telegram с ${currentSessionTelegramId} на ${telegramId}`);
                }

                // Создаем или обновляем сессию, принудительно создавая новую при смене пользователя
                const userFromSession = await telegramSessionManager.createOrUpdateSession(telegramId, userChanged);

                if (!userFromSession) {
                    console.log(`Не удалось создать/обновить сессию для Telegram ID ${telegramId}, перенаправляем на регистрацию`);
                    navigate('/registration', { replace: true });
                    return;
                }

                // Проверяем существующего пользователя с таким Telegram ID
                const existingUser = getUserByTelegramId(telegramId);

                // Если пользователь не существует в системе вообще
                if (!existingUser) {
                    console.log(`Пользователь с Telegram ID ${telegramId} не найден, перенаправляем на регистрацию`);

                    // Показываем приветственное сообщение
                    if (WebApp.isExpanded) {
                        WebApp.showPopup({
                            title: 'Добро пожаловать!',
                            message: 'Для начала работы с приложением, пожалуйста, заполните профиль.',
                            buttons: [{ type: 'ok' }]
                        });
                    }

                    navigate('/registration', { replace: true });
                } else {
                    console.log(`Найден пользователь с Telegram ID ${telegramId}, устанавливаем как текущего`);
                    // Устанавливаем найденного пользователя как текущего
                    try {
                        setCurrentUser(existingUser.id);
                        setChecked(true);
                    } catch (error) {
                        console.error('Ошибка при установке текущего пользователя:', error);
                        navigate('/registration', { replace: true });
                    }
                }

            } catch (error) {
                console.error('Ошибка при проверке регистрации:', error);
                // В случае ошибки также отправляем на регистрацию
                navigate('/registration', { replace: true });
            }
        };

        checkRegistration();
    }, [navigate]);

    // Показываем содержимое только после проверки регистрации
    return checked ? <>{children}</> : null;
};