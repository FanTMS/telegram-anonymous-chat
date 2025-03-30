import { getCurrentUser, createDemoUser } from './user';

// Импортируем функцию проверки соединения из модуля dbService
// Используем require для совместимости между JS и TS
let checkMongoDbConnection;
try {
    const dbService = require('./dbService');
    checkMongoDbConnection = dbService.checkMongoDbConnection;
} catch (e) {
    console.error("Не удалось импортировать checkMongoDbConnection из dbService", e);
    // Создаем заглушку
    checkMongoDbConnection = async () => false;
}

// Константы для определения среды выполнения
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

// Флаги для настройки
const AUTO_CREATE_DEMO_USER = IS_DEVELOPMENT;
const ENABLE_ERROR_TRACKING = !IS_DEVELOPMENT;

/**
 * Инициализирует приложение, подготавливая все необходимые зависимости
 */
export const initializeApp = async (): Promise<void> => {
    console.log(`[init] Инициализация приложения в режиме: ${IS_DEVELOPMENT ? 'Разработка' : 'Продакшн'}`);

    try {
        // Проверяем соединение с базой данных
        const dbAvailable = await checkMongoDbConnection();
        console.log(`[init] База данных ${dbAvailable ? 'доступна' : 'недоступна'}, используется ${dbAvailable ? 'MongoDB' : 'локальное хранилище'}`);

        // Если разработка и разрешено создание демо-пользователя, проверяем наличие пользователя
        if (IS_DEVELOPMENT && AUTO_CREATE_DEMO_USER) {
            const user = await getCurrentUser();
            if (!user) {
                console.log('[init] Создаем демо-пользователя для разработки');
                const demoUser = await createDemoUser();
                console.log('[init] Демо-пользователь создан:', demoUser);
            } else {
                console.log('[init] Пользователь уже существует:', user.name);
            }
        }

        // Настраиваем обработчик необработанных ошибок
        if (ENABLE_ERROR_TRACKING) {
            setupErrorHandling();
        }

        console.log('[init] Инициализация завершена успешно');
    } catch (error) {
        console.error('[init] Ошибка при инициализации приложения:', error);
    }
};

/**
 * Настраивает глобальную обработку необработанных ошибок
 */
function setupErrorHandling() {
    window.addEventListener('error', (event) => {
        console.error('[Global Error]', event.error);

        // Здесь можно добавить логирование ошибок в сервис аналитики
        // или отправку на сервер для дальнейшего анализа
    });

    window.addEventListener('unhandledrejection', (event) => {
        console.error('[Unhandled Promise Rejection]', event.reason);

        // Аналогично, здесь можно добавить логирование отклоненных Promise
    });
}

// Автоматически запускаем инициализацию при импорте модуля
initializeApp();

// Экспортируем функцию проверки соединения с базой данных для переиспользования
export { checkMongoDbConnection };
