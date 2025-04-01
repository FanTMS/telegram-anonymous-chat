/**
 * Создает эмуляцию Telegram WebApp для локальной разработки
 */
export const createMockTelegramWebApp = () => {
    if (typeof window === 'undefined') return;
    
    // Проверяем, находимся ли мы в режиме разработки
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Проверяем, существует ли уже объект window.Telegram
    if (!isDevelopment || window.Telegram) return;
    
    console.log('Создаю моки для Telegram WebApp в режиме разработки');
    
    // Создаем мок для Telegram WebApp
    window.Telegram = {
        WebApp: {
            ready: () => console.log('MockTelegram: WebApp.ready() called'),
            initData: 'mock_init_data',
            initDataUnsafe: {
                user: {
                    id: 123456789,
                    first_name: 'Тестовый',
                    last_name: 'Пользователь',
                    username: 'test_user',
                    language_code: 'ru',
                    is_dev_mode: true
                },
                start_param: 'test_start_param'
            },
            colorScheme: 'light',
            themeParams: {
                bg_color: '#ffffff',
                text_color: '#000000',
                hint_color: '#999999',
                link_color: '#2481cc',
                button_color: '#2481cc',
                button_text_color: '#ffffff',
                secondary_bg_color: '#f7f7f7',
            },
            isExpanded: true,
            viewportHeight: window.innerHeight,
            viewportStableHeight: window.innerHeight,
            MainButton: {
                text: '',
                color: '#2481cc',
                textColor: '#ffffff',
                isVisible: false,
                isActive: true,
                isProgressVisible: false,
                setText: (text) => {
                    console.log(`MockTelegram: MainButton.setText("${text}")`);
                    window.Telegram.WebApp.MainButton.text = text;
                    return window.Telegram.WebApp.MainButton;
                },
                show: () => {
                    console.log('MockTelegram: MainButton.show()');
                    window.Telegram.WebApp.MainButton.isVisible = true;
                    return window.Telegram.WebApp.MainButton;
                },
                hide: () => {
                    console.log('MockTelegram: MainButton.hide()');
                    window.Telegram.WebApp.MainButton.isVisible = false;
                    return window.Telegram.WebApp.MainButton;
                },
                enable: () => {
                    console.log('MockTelegram: MainButton.enable()');
                    window.Telegram.WebApp.MainButton.isActive = true;
                    return window.Telegram.WebApp.MainButton;
                },
                disable: () => {
                    console.log('MockTelegram: MainButton.disable()');
                    window.Telegram.WebApp.MainButton.isActive = false;
                    return window.Telegram.WebApp.MainButton;
                },
                showProgress: () => {
                    console.log('MockTelegram: MainButton.showProgress()');
                    window.Telegram.WebApp.MainButton.isProgressVisible = true;
                    return window.Telegram.WebApp.MainButton;
                },
                hideProgress: () => {
                    console.log('MockTelegram: MainButton.hideProgress()');
                    window.Telegram.WebApp.MainButton.isProgressVisible = false;
                    return window.Telegram.WebApp.MainButton;
                },
                onClick: (callback) => {
                    console.log('MockTelegram: MainButton.onClick()');
                    window.Telegram.WebApp.MainButton._callbacks = 
                        window.Telegram.WebApp.MainButton._callbacks || [];
                    window.Telegram.WebApp.MainButton._callbacks.push(callback);
                },
                offClick: (callback) => {
                    console.log('MockTelegram: MainButton.offClick()');
                    if (!window.Telegram.WebApp.MainButton._callbacks) return;
                    window.Telegram.WebApp.MainButton._callbacks = 
                        window.Telegram.WebApp.MainButton._callbacks.filter(cb => cb !== callback);
                }
            },
            showPopup: (params) => {
                console.log('MockTelegram: showPopup()', params);
                alert(`${params.title}\n\n${params.message}`);
            },
            showAlert: (message) => {
                console.log('MockTelegram: showAlert()', message);
                alert(message);
            },
            showConfirm: (message) => {
                console.log('MockTelegram: showConfirm()', message);
                return confirm(message);
            },
            expand: () => {
                console.log('MockTelegram: expand()');
            },
            close: () => {
                console.log('MockTelegram: close()');
            }
        }
    };
    
    console.log('Мок для Telegram WebApp создан успешно');
};
