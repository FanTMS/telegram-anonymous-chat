/**
 * Мок для Telegram WebApp API при локальной разработке
 */

// Создаем мок пользователя для локальной разработки
const mockUser = {
    id: 123456789,
    first_name: "Локальный",
    last_name: "Пользователь",
    username: "local_user",
    language_code: "ru",
    is_premium: true
};

// Мок для WebApp инициализационных данных
const mockInitData = "mock_init_data";

// Проверка, запущено ли приложение в Telegram
export const isRunningInTelegram = (): boolean => {
    try {
        // Проверяем наличие Telegram WebApp по initData
        if (typeof window !== 'undefined' &&
            typeof window.Telegram !== 'undefined' &&
            typeof window.Telegram.WebApp !== 'undefined') {

            // Если есть initData, значит приложение запущено в Telegram
            const webApp = window.Telegram.WebApp as any;
            return !!webApp && (!!webApp.initData || !!webApp.initDataUnsafe);
        }
        return false;
    } catch (e) {
        console.error('❌ Ошибка при проверке запуска в Telegram:', e);
        return false;
    }
};

// Создаем мок WebApp API
export const createWebAppMock = () => {
    // Проверяем, запущено ли приложение в окружении разработки
    const isLocalDevelopment =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.includes('192.168.') ||
        process.env.NODE_ENV === 'development';

    // Если не в режиме разработки, ничего не делаем
    if (!isLocalDevelopment) {
        console.log('🚫 Не в режиме разработки, не создаем мок');
        return;
    }

    // Если уже запущено в реальном Telegram, не создаем мок
    if (isRunningInTelegram()) {
        console.log('🔍 Приложение запущено в реальном Telegram, не создаем мок');
        return;
    }

    // Если WebApp уже определен, проверяем его свойства
    if (window.Telegram && window.Telegram.WebApp) {
        const webApp = window.Telegram.WebApp as any;

        // Если нет initData, добавляем его
        if (!webApp.initData) {
            console.log('⚠️ WebApp обнаружен, но без initData. Добавляем поле.');
            webApp.initData = mockInitData;
        }

        // Если нет initDataUnsafe, добавляем его
        if (!webApp.initDataUnsafe) {
            console.log('⚠️ WebApp обнаружен, но без initDataUnsafe. Добавляем поле.');
            webApp.initDataUnsafe = {
                user: mockUser,
                query_id: "mock_query_id",
                auth_date: Math.floor(Date.now() / 1000)
            };
        }

        console.log('✅ WebApp уже определен, доработали недостающие поля');
        return;
    }

    console.info('📱 Создаем мок Telegram WebApp API для локальной разработки');

    // Создаем мок объект
    const MockWebApp = {
        isExpanded: true,
        initData: mockInitData,
        initDataUnsafe: {
            user: mockUser,
            query_id: "mock_query_id",
            auth_date: Math.floor(Date.now() / 1000)
        },
        colorScheme: 'light',
        ready: () => {
            console.log('✅ WebApp.ready() вызван (мок)');
            return true;
        },
        expand: () => console.log('WebApp.expand() вызван (мок)'),
        close: () => console.log('WebApp.close() вызван (мок)'),
        showAlert: (message: string) => {
            console.log(`WebApp.showAlert() вызван (мок): ${message}`);
            alert(message);
        },
        showPopup: (params: any, callback: any = null) => {
            console.log(`WebApp.showPopup() вызван (мок):`, params);
            alert(params.message || 'Сообщение WebApp');
            if (callback) callback('ok');
        },
        MainButton: {
            text: 'MAIN BUTTON',
            color: '#3390ec',
            textColor: '#ffffff',
            isVisible: false,
            isActive: true,
            isProgressVisible: false,
            setText: (text: string) => {
                console.log(`MainButton.setText() вызван (мок): ${text}`);
                MockWebApp.MainButton.text = text;
                return MockWebApp.MainButton;
            },
            show: () => {
                console.log('MainButton.show() вызван (мок)');
                MockWebApp.MainButton.isVisible = true;
                return MockWebApp.MainButton;
            },
            hide: () => {
                console.log('MainButton.hide() вызван (мок)');
                MockWebApp.MainButton.isVisible = false;
                return MockWebApp.MainButton;
            },
            onClick: (callback: () => void) => {
                console.log('MainButton.onClick() вызван (мок)');
                return MockWebApp.MainButton;
            },
            offClick: (callback: () => void) => {
                console.log('MainButton.offClick() вызван (мок)');
                return MockWebApp.MainButton;
            },
            showProgress: () => {
                console.log('MainButton.showProgress() вызван (мок)');
                MockWebApp.MainButton.isProgressVisible = true;
                return MockWebApp.MainButton;
            },
            hideProgress: () => {
                console.log('MainButton.hideProgress() вызван (мок)');
                MockWebApp.MainButton.isProgressVisible = false;
                return MockWebApp.MainButton;
            }
        },
        BackButton: {
            isVisible: false,
            show: () => {
                console.log('BackButton.show() вызван (мок)');
                MockWebApp.BackButton.isVisible = true;
                return MockWebApp.BackButton;
            },
            hide: () => {
                console.log('BackButton.hide() вызван (мок)');
                MockWebApp.BackButton.isVisible = false;
                return MockWebApp.BackButton;
            },
            onClick: (callback: () => void) => {
                console.log('BackButton.onClick() вызван (мок)');
                return MockWebApp.BackButton;
            },
            offClick: (callback: () => void) => {
                console.log('BackButton.offClick() вызван (мок)');
                return MockWebApp.BackButton;
            }
        },
        HapticFeedback: {
            impactOccurred: (style: string) => console.log(`HapticFeedback.impactOccurred() вызван (мок): ${style}`),
            notificationOccurred: (type: string) => console.log(`HapticFeedback.notificationOccurred() вызван (мок): ${type}`),
            selectionChanged: () => console.log('HapticFeedback.selectionChanged() вызван (мок)'),
        },
        version: '6.0'
    };

    // Создаем глобальный объект Telegram, если он не существует
    if (!window.Telegram) {
        (window as any).Telegram = {};
    }

    // Добавляем мок WebApp
    (window as any).Telegram.WebApp = MockWebApp;

    // Подписываемся на ошибки для лучшей отладки
    window.addEventListener('error', function (event) {
        console.error('❌ Ошибка в Telegram WebApp Mock:', event.error);
    });

    return MockWebApp;
};
