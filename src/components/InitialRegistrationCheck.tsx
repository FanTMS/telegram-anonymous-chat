// filepath: c:\Users\user\Desktop\Project\telegram-anonymous-chat\src\components\InitialRegistrationCheck.tsx
import { useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, getUserByTelegramId } from '../utils/user';
import { telegramApi } from '../utils/database';
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

                // Получаем текущего пользователя
                const currentUser = getCurrentUser();

                // Если пользователь уже зарегистрирован, продолжаем отображение приложения
                if (currentUser) {
                    console.log('Пользователь уже зарегистрирован:', currentUser.id);
                    setChecked(true);
                    return;
                }

                // Получаем Telegram ID пользователя
                const telegramId = telegramApi.getUserId();
                if (!telegramId) {
                    console.log('Не удалось получить Telegram ID, перенаправляем на регистрацию');
                    navigate('/registration', { replace: true });
                    return;
                }

                // Проверяем, существует ли пользователь с таким Telegram ID
                const existingUser = getUserByTelegramId(telegramId);

                if (!existingUser) {
                    // Если пользователя с таким Telegram ID нет, перенаправляем на регистрацию
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
                    console.log(`Найден пользователь с Telegram ID ${telegramId}, но не установлен как текущий`);
                    setChecked(true);
                }
            } catch (error) {
                console.error('Ошибка при проверке регистрации:', error);
                setChecked(true);
            }
        };

        // Проверяем только один раз при загрузке
        checkRegistration();
    }, [navigate]);

    // Пока идет проверка, можно показать загрузку или ничего не показывать
    if (!checked) {
        return null; // Или показать загрузку: <div>Загрузка...</div>
    }

    // После проверки отображаем основной контент
    return <>{children}</>;
};