import WebApp from '@twa-dev/sdk';

// Функция для безопасной инициализации Telegram WebApp
export const initTelegramApp = () => {
    try {
        // Проверяем, что мы находимся в контексте Telegram WebApp
        if (WebApp.initData) {
            console.log('Telegram WebApp инициализирован успешно');
            
            // Расширяем WebApp на весь экран
            WebApp.expand();
            
            // Сообщаем Telegram, что приложение готово
            WebApp.ready();
            
            return WebApp;
        }
        console.log('Запуск в режиме разработки (не в Telegram WebApp)');
        // Если не в Telegram WebApp, возвращаем заглушку
        return {
            isSupported: false,
            ready: () => { console.log('WebApp.ready() вызван в режиме разработки'); },
            expand: () => { console.log('WebApp.expand() вызван в режиме разработки'); },
            MainButton: {
                show: () => { },
                hide: () => { },
                setText: () => { },
                onClick: () => { }
            },
            initDataUnsafe: {
                user: {
                    id: 123456789,
                    first_name: "Тестовый",
                    last_name: "Пользователь",
                    username: "testuser",
                    language_code: "ru"
                }
            }
        };
    } catch (error) {
        console.error('Ошибка при инициализации Telegram WebApp:', error);
        // Возвращаем заглушку в случае ошибки
        return {
            isSupported: false,
            ready: () => { },
            expand: () => { },
            MainButton: {
                show: () => { },
                hide: () => { },
                setText: () => { },
                onClick: () => { }
            },
            initDataUnsafe: {
                user: {
                    id: 123456789,
                    first_name: "Тестовый",
                    last_name: "Пользователь",
                    username: "testuser",
                    language_code: "ru"
                }
            }
        };
    }
};

// Экспортируем экземпляр для использования в компонентах
export const telegramApp = initTelegramApp();
