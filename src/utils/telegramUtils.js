import WebApp from '@twa-dev/sdk';

/**
 * Утилиты для взаимодействия с Telegram Web App
 */

/**
 * Проверяет, запущено ли приложение внутри Telegram
 */
export const isTelegramApp = () => {
    return window.Telegram && window.Telegram.WebApp;
};

/**
 * Получает экземпляр Telegram WebApp API
 */
export const getTelegramWebApp = () => {
    if (isTelegramApp()) {
        return window.Telegram.WebApp;
    }
    return null;
};

/**
 * Получает данные пользователя из Telegram WebApp
 * @returns {Object|null} Данные пользователя или null
 */
export const getTelegramUser = () => {
    try {
        // First try to get data from Telegram WebApp
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
            const userData = window.Telegram.WebApp.initDataUnsafe.user;
            console.log('Получены данные пользователя из Telegram WebApp (window.Telegram):', userData);
            
            // Save data in both sessionStorage and localStorage for persistence
            try {
                const persistentData = {
                    ...userData,
                    timestamp: Date.now()
                };
                localStorage.setItem('telegram_user_persistent', JSON.stringify(persistentData));
                sessionStorage.setItem('telegram_last_user', JSON.stringify(userData));
                sessionStorage.setItem('telegramUser', JSON.stringify(userData));
                localStorage.setItem('is_telegram_webapp', 'true');
            } catch (e) {
                console.warn('Не удалось сохранить данные Telegram в хранилище:', e);
            }
            
            return userData;
        }
        
        // Try to get data from twa-dev/sdk
        if (typeof WebApp !== 'undefined' && WebApp.initDataUnsafe && WebApp.initDataUnsafe.user) {
            const userData = WebApp.initDataUnsafe.user;
            console.log('Получены данные пользователя из Telegram WebApp (twa-dev/sdk):', userData);
            
            try {
                const persistentData = {
                    ...userData,
                    timestamp: Date.now()
                };
                localStorage.setItem('telegram_user_persistent', JSON.stringify(persistentData));
                sessionStorage.setItem('telegram_last_user', JSON.stringify(userData));
                sessionStorage.setItem('telegramUser', JSON.stringify(userData));
                localStorage.setItem('is_telegram_webapp', 'true');
            } catch (e) {
                console.warn('Не удалось сохранить данные Telegram в хранилище:', e);
            }
            
            return userData;
        }

        // Try to get data from persistent storage first
        const persistentData = localStorage.getItem('telegram_user_persistent');
        if (persistentData) {
            try {
                const parsed = JSON.parse(persistentData);
                // Check if data is not too old (7 days)
                if (parsed.timestamp && (Date.now() - parsed.timestamp) < 7 * 24 * 60 * 60 * 1000) {
                    console.log('Используем сохраненные данные пользователя Telegram из localStorage:', parsed);
                    
                    // Restore session storage data
                    sessionStorage.setItem('telegram_last_user', JSON.stringify(parsed));
                    sessionStorage.setItem('telegramUser', JSON.stringify(parsed));
                    return parsed;
                }
            } catch (e) {
                console.warn('Ошибка при чтении сохраненных данных Telegram:', e);
            }
        }
        
        // Проверяем data из URL параметров (часто используется на мобильных устройствах)
        const urlParams = new URLSearchParams(window.location.search);
        const initData = urlParams.get('tgWebAppData') || window.location.hash.replace('#tgWebAppData=', '');
        
        if (initData) {
            try {
                console.log('Найдены данные в URL параметрах', initData);
                
                // Пытаемся декодировать и разобрать initData
                let initDataObj = {};
                try {
                    // Разбираем параметры initData из формата ключ=значение&ключ=значение
                    const paramPairs = decodeURIComponent(initData).split('&');
                    paramPairs.forEach(pair => {
                        const [key, value] = pair.split('=');
                        initDataObj[key] = value;
                    });
                    
                    // Если есть поле user, пытаемся его распарсить
                    if (initDataObj.user) {
                        try {
                            const user = JSON.parse(initDataObj.user);
                            if (user && user.id) {
                                const userData = {
                                    id: user.id.toString(),
                                    first_name: user.first_name || 'Пользователь Telegram',
                                    username: user.username || '',
                                    last_name: user.last_name || '',
                                    language_code: user.language_code || 'ru',
                                    from_init_data: true
                                };
                                
                                // Сохраняем только в sessionStorage
                                sessionStorage.setItem('telegram_last_user', JSON.stringify(userData));
                                sessionStorage.setItem('telegramUser', JSON.stringify(userData));
                                
                                return userData;
                            }
                        } catch (e) {
                            console.warn('Ошибка при парсинге поля user из initData:', e);
                        }
                    }
                } catch (e) {
                    console.warn('Ошибка при разборе initData:', e);
                }
                
                // Получаем user_id из параметров (запасной вариант)
                const userId = urlParams.get('tgWebAppUser') || urlParams.get('user') || initDataObj.user_id;
                if (userId) {
                    console.log('Получен ID пользователя из URL параметров:', userId);
                    const telegramId = userId.toString().replace('tg', '');
                    const userData = {
                        id: telegramId,
                        first_name: urlParams.get('first_name') || initDataObj.first_name || 'Пользователь Telegram',
                        username: urlParams.get('username') || initDataObj.username || '',
                        language_code: urlParams.get('language') || initDataObj.language_code || 'ru',
                        from_url_params: true
                    };
                    
                    // Сохраняем данные только в sessionStorage
                    sessionStorage.setItem('telegram_last_user', JSON.stringify(userData));
                    sessionStorage.setItem('telegramUser', JSON.stringify(userData));
                    
                    return userData;
                }
            } catch (e) {
                console.error('Ошибка при обработке данных из URL:', e);
            }
        }
        
        // Проверяем сохраненные данные из предыдущей сессии
        try {
            const cachedData = sessionStorage.getItem('telegram_last_user') || sessionStorage.getItem('telegramUser');
            if (cachedData) {
                const userData = JSON.parse(cachedData);
                console.log('Используем кешированные данные пользователя Telegram из sessionStorage:', userData);
                return userData;
            }
        } catch (e) {
            console.warn('Ошибка при извлечении кешированных данных Telegram:', e);
        }
        
        // Если все способы не сработали
        console.warn('Данные пользователя Telegram не доступны через стандартные методы');
        
        // Проверяем, возможно мы на мобильном Telegram без явных данных в WebApp
        const isMobileTelegram = /Telegram/i.test(navigator.userAgent) || 
                               document.referrer.includes('t.me') || 
                               window.location.href.includes('tg://');
        
        if (isMobileTelegram) {
            console.log('Обнаружен мобильный Telegram, создаем временные данные пользователя');
            // Генерируем временный ID для пользователя мобильного Telegram
            const tempUserData = {
                id: 'tg_mobile_' + Date.now(),
                first_name: 'Пользователь Telegram',
                is_mobile_telegram: true
            };
            
            // Сохраняем временные данные в sessionStorage
            try {
                sessionStorage.setItem('telegram_mobile_user', JSON.stringify(tempUserData));
            } catch (e) {
                console.warn('Не удалось сохранить временные данные мобильного Telegram:', e);
            }
            
            return tempUserData;
        }
        
        return null;
    } catch (error) {
        console.error('Ошибка при получении данных пользователя Telegram:', error);
        return null;
    }
};

/**
 * Проверяет валидность initData из Telegram WebApp
 * @returns {boolean} Результат проверки
 */
export const isTelegramInitDataValid = () => {
    try {
        return !!WebApp && !!WebApp.initData && WebApp.initData.length > 0;
    } catch (error) {
        return false;
    }
};

/**
 * Выполняет хаптическую обратную связь (вибрацию)
 * @param {string} type - тип обратной связи ('impact', 'notification', 'selection')
 */
export const triggerHapticFeedback = (type = 'impact') => {
    const webApp = getTelegramWebApp();
    if (webApp && webApp.HapticFeedback) {
        try {
            switch (type) {
                case 'impact':
                    webApp.HapticFeedback.impactOccurred('medium');
                    break;
                case 'notification':
                    webApp.HapticFeedback.notificationOccurred('success');
                    break;
                case 'selection':
                    webApp.HapticFeedback.selectionChanged();
                    break;
                default:
                    webApp.HapticFeedback.impactOccurred('medium');
            }
        } catch (error) {
            console.warn('Haptic feedback error:', error);
        }
    }
};

/**
 * Безопасный вызов тактильной обратной связи
 * @param {string} type - Тип тактильной обратной связи ('impact', 'notification', 'selection')
 * @param {string|null} style - Интенсивность для impact ('light', 'medium', 'heavy', 'rigid', 'soft')
 * @param {string|null} notificationType - Тип уведомления ('success', 'warning', 'error')
 * @returns {boolean} Результат операции
 */
export const safeHapticFeedback = (type, style = null, notificationType = null) => {
    try {
        const WebApp = getTelegramWebApp();
        if (!WebApp || !WebApp.HapticFeedback) {
            console.log('\n [Telegram.WebApp] HapticFeedback is not supported');
            return false;
        }

        switch (type) {
            case 'impact':
                if (WebApp.HapticFeedback && typeof WebApp.HapticFeedback.impactOccurred === 'function') {
                    WebApp.HapticFeedback.impactOccurred(style || 'medium');
                    return true;
                }
                break;
            case 'notification':
                if (WebApp.HapticFeedback && typeof WebApp.HapticFeedback.notificationOccurred === 'function') {
                    WebApp.HapticFeedback.notificationOccurred(notificationType || 'success');
                    return true;
                }
                break;
            case 'selection':
                if (WebApp.HapticFeedback && typeof WebApp.HapticFeedback.selectionChanged === 'function') {
                    WebApp.HapticFeedback.selectionChanged();
                    return true;
                }
                break;
            default:
                console.warn('Unknown haptic feedback type:', type);
        }
    } catch (error) {
        console.warn('Haptic feedback failed:', error);
    }
    return false;
};

/**
 * Адаптирует стили приложения под цветовую схему Telegram
 */
export const adaptToTelegramTheme = () => {
    const webApp = getTelegramWebApp();
    if (webApp) {
        document.body.classList.add('telegram-app');

        // Добавляем переменные с цветами темы Telegram в корневой элемент CSS
        const root = document.documentElement;
        if (webApp.themeParams) {
            Object.entries(webApp.themeParams).forEach(([key, value]) => {
                root.style.setProperty(`--tg-theme-${key}`, value);
            });
        }
    }
};

/**
 * Настраивает кнопку главной панели Telegram
 * @param {string} text - текст кнопки
 * @param {Function} onClick - обработчик нажатия
 */
export const setupMainButton = (text, onClick) => {
    const webApp = getTelegramWebApp();
    if (webApp && webApp.MainButton) {
        webApp.MainButton.setText(text);
        webApp.MainButton.onClick(onClick);

        // Подстраиваем цвета под тему, если они не установлены Telegram
        if (!webApp.MainButton.isVisible) {
            webApp.MainButton.show();
        }
    }
};

/**
 * Скрывает главную кнопку Telegram
 */
export const hideMainButton = () => {
    const webApp = getTelegramWebApp();
    if (webApp && webApp.MainButton && webApp.MainButton.isVisible) {
        webApp.MainButton.hide();
    }
};

/**
 * Показывает всплывающее уведомление в Telegram
 * @param {string} message - текст уведомления
 */
export const showTelegramPopup = (message) => {
    const webApp = getTelegramWebApp();
    if (webApp && webApp.showPopup) {
        webApp.showPopup({
            title: 'Уведомление',
            message: message,
            buttons: [{ type: 'ok' }]
        });
    }
};

/**
 * Инициализирует приложение для Telegram
 * Вызывайте эту функцию при запуске приложения
 */
export const initTelegramApp = () => {
    const webApp = getTelegramWebApp();
    if (webApp) {
        adaptToTelegramTheme();

        // Расширяем область для отображения веб-приложения на весь экран
        try {
            webApp.expand();
        } catch (e) {
            console.warn('Ошибка при расширении области WebApp:', e);
        }

        // Готовность приложения к работе
        try {
            webApp.ready();
        } catch (e) {
            console.warn('Ошибка при вызове WebApp.ready():', e);
        }
        
        // Отключаем оверлей с индикатором загрузки, если он есть
        try {
            if (webApp.disableClosingConfirmation) {
                webApp.disableClosingConfirmation();
            }
        } catch (e) {
            console.warn('Ошибка при отключении запроса подтверждения закрытия:', e);
        }
        
        // Добавляем маркер запуска внутри Telegram
        try {
            document.body.classList.add('in-telegram');
            sessionStorage.setItem('is_telegram_webapp', 'true');
        } catch (e) {
            console.warn('Ошибка при установке маркера Telegram WebApp:', e);
        }
        
        // Обработка хэша и URL-параметров при запуске в Telegram Mini App
        try {
            // Передаем параметры из URL в WebApp, если они есть
            const urlParams = new URLSearchParams(window.location.search);
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            
            // Ищем параметры Telegram в URL
            const tgWebAppData = urlParams.get('tgWebAppData') || hashParams.get('tgWebAppData');
            const tgWebAppUser = urlParams.get('tgWebAppUser') || hashParams.get('tgWebAppUser');
            
            if (tgWebAppData || tgWebAppUser) {
                console.log('Обнаружены параметры Telegram в URL, сохраняем для последующего использования');
                sessionStorage.setItem('tgWebAppData', tgWebAppData || '');
                sessionStorage.setItem('tgWebAppUser', tgWebAppUser || '');
            }
        } catch (e) {
            console.warn('Ошибка при обработке URL-параметров:', e);
        }
    }
    return null;
};

/**
 * Безопасный вызов Telegram Popup
 * @param {Object} params - Параметры для popup
 * @returns {Promise<Object|null>} Результат операции
 */
export const safeShowPopup = async (params) => {
    return new Promise((resolve) => {
        try {
            if (!WebApp || !WebApp.showPopup) {
                alert(params.message || '');
                resolve(null);
                return;
            }

            WebApp.showPopup(params, resolve);
        } catch (error) {
            console.warn('Error showing popup:', error);
            alert(params.message || '');
            resolve(null);
        }
    });
};

/**
 * Determine if the current Telegram WebApp is in compact mode
 * @returns {boolean} True if in compact mode
 */
export const isCompactMode = () => {
  if (typeof window === 'undefined') return false;
  
  try {
    if (window.Telegram && window.Telegram.WebApp) {
      // Telegram Web App API indicates if in compact mode
      return window.Telegram.WebApp.isCompact === true;
    } else if (typeof WebApp !== 'undefined') {
      return WebApp.isCompact === true;
    }
  } catch (err) {
    console.warn('Error checking compact mode:', err);
  }
  
  // Fallback: check viewport width (compact is typically under 600px)
  return window.innerWidth < 600;
};

/**
 * Get viewport dimensions from Telegram WebApp
 * @returns {Object} Object containing width, height, and stableHeight
 */
export const getTelegramViewportDimensions = () => {
  const defaultDimensions = {
    width: window.innerWidth,
    height: window.innerHeight,
    stableHeight: window.innerHeight
  };
  
  try {
    if (window.Telegram && window.Telegram.WebApp) {
      return {
        width: window.Telegram.WebApp.viewportWidth || defaultDimensions.width,
        height: window.Telegram.WebApp.viewportHeight || defaultDimensions.height,
        stableHeight: window.Telegram.WebApp.viewportStableHeight || defaultDimensions.height
      };
    } else if (typeof WebApp !== 'undefined') {
      return {
        width: WebApp.viewportWidth || defaultDimensions.width,
        height: WebApp.viewportHeight || defaultDimensions.height,
        stableHeight: WebApp.viewportStableHeight || defaultDimensions.height
      };
    }
  } catch (err) {
    console.warn('Error getting viewport dimensions:', err);
  }
  
  return defaultDimensions;
};

/**
 * Apply viewport constraints based on whether page should be static or scrollable
 * @param {HTMLElement} element - The element to apply constraints to
 * @param {boolean} allowScroll - Whether scrolling should be allowed
 */
export const applyViewportConstraints = (element, allowScroll = false) => {
  if (!element) return;
  
  if (allowScroll) {
    // For scrollable pages (chats, lists)
    element.style.overflowY = 'auto';
    element.style.overflowX = 'hidden';
    element.style.height = '100%';
    element.style.touchAction = 'pan-y';
    element.classList.add('scrollable');
  } else {
    // For static pages
    element.style.overflowY = 'hidden';
    element.style.overflowX = 'hidden';
    element.style.height = '100%';
    element.style.touchAction = 'none';
    element.classList.remove('scrollable');
  }
};

/**
 * Check if the current page should allow scrolling (chats and list pages)
 * @param {string} pathname - Current URL pathname
 * @returns {boolean} Whether scrolling should be allowed
 */
export const shouldAllowScrolling = (pathname) => {
  // Pages that should be scrollable
  const scrollablePages = [
    '/chats',
    '/chat/',
    '/groups',
    '/friends',
    '/admin-support'
  ];
  
  // Check if current path matches any scrollable pages
  return scrollablePages.some(page => 
    pathname === page || 
    (page.endsWith('/') && pathname.startsWith(page))
  );
};

// Apply compact mode styles to the document
export const applyCompactModeStyles = () => {
  if (isCompactMode()) {
    document.documentElement.classList.add('tg-compact-mode');
    
    // Apply any additional compact mode specific styles
    const viewportDimensions = getTelegramViewportDimensions();
    document.documentElement.style.setProperty('--tg-viewport-width', `${viewportDimensions.width}px`);
    document.documentElement.style.setProperty('--tg-viewport-height', `${viewportDimensions.height}px`);
    document.documentElement.style.setProperty('--tg-viewport-stable-height', `${viewportDimensions.stableHeight}px`);
  } else {
    document.documentElement.classList.remove('tg-compact-mode');
  }
};

/**
 * Проверяет, загружено ли приложение на мобильном устройстве
 * @returns {boolean} true если на мобильном устройстве
 */
export const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (window.innerWidth <= 768);
};

/**
 * Проверяет, является ли текущее устройство iPhone с вырезом
 * @returns {boolean} true если iPhone с вырезом (X и новее)
 */
export const isIphoneWithNotch = () => {
    // Проверка на поддержку CSS env()
    const hasEnv = CSS && CSS.supports && (
        CSS.supports('padding-top: env(safe-area-inset-top)') || 
        CSS.supports('padding-top: constant(safe-area-inset-top)')
    );
    
    // Проверка на iPhone по user agent
    const isIphone = /iPhone/i.test(navigator.userAgent) && !window.MSStream;
    
    // Проверка соотношения сторон экрана (iPhone X и новее имеют соотношение около 2:1)
    const aspectRatio = window.screen.height / window.screen.width;
    const hasNewAspectRatio = aspectRatio > 1.8;
    
    return hasEnv && isIphone && hasNewAspectRatio;
};

/**
 * Обновляет переменные CSS для безопасной области и размеров клавиатуры
 * @returns {void}
 */
export const updateSafeAreaVars = () => {
    // Получаем размеры безопасной области используя env() или резервные значения
    let safeAreaTop = 0;
    let safeAreaBottom = 0;
    let safeAreaLeft = 0;
    let safeAreaRight = 0;
    
    try {
        const style = window.getComputedStyle(document.documentElement);
        
        // Пытаемся получить значения из CSS с помощью env()
        safeAreaTop = parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0', 10);
        safeAreaBottom = parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0', 10);
        safeAreaLeft = parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0', 10);
        safeAreaRight = parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0', 10);
        
        // Если значения недоступны через getComputedStyle, пробуем через window.env
        if (isNaN(safeAreaTop) && window.env) {
            safeAreaTop = window.env('safe-area-inset-top', 0);
            safeAreaBottom = window.env('safe-area-inset-bottom', 0); 
            safeAreaLeft = window.env('safe-area-inset-left', 0);
            safeAreaRight = window.env('safe-area-inset-right', 0);
        }
        
        // Резервные значения для iPhone с вырезом, если не удалось получить значения другими способами
        if (isIphoneWithNotch() && safeAreaTop === 0) {
            safeAreaTop = 44; // Стандартная высота вырезы на iPhone X и новее
            safeAreaBottom = 34; // Высота нижней панели на iPhone X и новее в портретной ориентации
            
            // Проверка ориентации
            if (window.innerWidth > window.innerHeight) {
                safeAreaTop = 0; // В ландшафтной ориентации верхняя вырезка может отсутствовать
                safeAreaLeft = 44; // Боковая вырезка в ландшафтной ориентации
                safeAreaRight = 44; // Боковая вырезка с другой стороны
            }
        }
    } catch (error) {
        console.warn('Ошибка при получении значений безопасной области:', error);
    }
    
    // Устанавливаем CSS переменные
    document.documentElement.style.setProperty('--safe-area-top', `${safeAreaTop}px`);
    document.documentElement.style.setProperty('--safe-area-bottom', `${safeAreaBottom}px`);
    document.documentElement.style.setProperty('--safe-area-left', `${safeAreaLeft}px`);
    document.documentElement.style.setProperty('--safe-area-right', `${safeAreaRight}px`);
    
    console.log(`Установлены значения безопасной области: top=${safeAreaTop}px, bottom=${safeAreaBottom}px, left=${safeAreaLeft}px, right=${safeAreaRight}px`);
};

/**
 * Обрабатывает события мобильной клавиатуры
 * @returns {object} Объект с функциями для добавления и удаления обработчиков
 */
export const mobileKeyboardHandlers = () => {
    // Сохраняем исходную высоту вьюпорта при загрузке
    const originalWindowHeight = window.innerHeight;
    let keyboardHeight = 0;
    let isKeyboardVisible = false;
    
    // Обработчик для определения показа клавиатуры
    const handleKeyboardShow = (event) => {
        // Для iOS мы можем использовать visualViewport
        if (window.visualViewport) {
            const viewportHeight = window.visualViewport.height;
            const windowHeight = window.innerHeight;
            keyboardHeight = windowHeight - viewportHeight;
            
            // Проверяем, что высота клавиатуры значительна (не просто изменение размера окна)
            if (keyboardHeight > 150) {
                document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
                
                if (!isKeyboardVisible) {
                    isKeyboardVisible = true;
                    document.body.classList.add('keyboard-visible');
                    
                    // Найти и добавить класс ко всем контейнерам сообщений
                    const messagesContainers = document.querySelectorAll('.chat-messages, [class*="MessagesContainer"]');
                    messagesContainers.forEach(container => {
                        container.classList.add('keyboard-visible');
                    });
                    
                    // Добавить класс к контейнерам ввода
                    const inputContainers = document.querySelectorAll('.message-input, [class*="InputContainer"]');
                    inputContainers.forEach(container => {
                        container.classList.add('keyboard-visible');
                    });
                    
                    // Установка дополнительных переменных CSS для высоты
                    const vh = window.visualViewport.height * 0.01;
                    document.documentElement.style.setProperty('--vh', `${vh}px`);
                    document.documentElement.style.setProperty('--viewport-height', `${window.visualViewport.height}px`);
                    
                    console.log(`Клавиатура показана. Высота: ${keyboardHeight}px, Viewport: ${viewportHeight}px`);
                }
            }
        } else {
            // Альтернативный подход для устройств без visualViewport
            // Определяем высоту клавиатуры по разнице исходной высоты и текущей высоты окна
            const currentWindowHeight = window.innerHeight;
            keyboardHeight = originalWindowHeight - currentWindowHeight;
            
            if (keyboardHeight > 150) {
                document.documentElement.style.setProperty('--keyboard-height', `${keyboardHeight}px`);
                
                if (!isKeyboardVisible) {
                    isKeyboardVisible = true;
                    document.body.classList.add('keyboard-visible');
                    
                    // Обновляем CSS переменные
                    const vh = currentWindowHeight * 0.01;
                    document.documentElement.style.setProperty('--vh', `${vh}px`);
                    document.documentElement.style.setProperty('--viewport-height', `${currentWindowHeight}px`);
                    
                    console.log(`Клавиатура показана (alt). Высота: ${keyboardHeight}px`);
                }
            }
        }
    };
    
    // Обработчик для определения скрытия клавиатуры
    const handleKeyboardHide = () => {
        const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        
        // Проверяем, действительно ли клавиатура скрыта
        // Например, если viewportHeight близок к исходной высоте окна
        if (Math.abs(viewportHeight - originalWindowHeight) < 100) {
            if (isKeyboardVisible) {
                isKeyboardVisible = false;
                keyboardHeight = 0;
                document.documentElement.style.setProperty('--keyboard-height', '0px');
                document.body.classList.remove('keyboard-visible');
                
                // Найти и удалить класс со всех контейнеров сообщений
                const messagesContainers = document.querySelectorAll('.chat-messages, [class*="MessagesContainer"]');
                messagesContainers.forEach(container => {
                    container.classList.remove('keyboard-visible');
                });
                
                // Удалить класс с контейнеров ввода
                const inputContainers = document.querySelectorAll('.message-input, [class*="InputContainer"]');
                inputContainers.forEach(container => {
                    container.classList.remove('keyboard-visible');
                });
                
                // Восстанавливаем оригинальные значения CSS переменных
                const vh = originalWindowHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
                document.documentElement.style.setProperty('--viewport-height', `${originalWindowHeight}px`);
                
                console.log(`Клавиатура скрыта. Восстановлен viewport: ${viewportHeight}px`);
            }
        }
    };
    
    // Функция для добавления обработчиков
    const addListeners = () => {
        if (window.visualViewport) {
            console.log('Добавлены обработчики visualViewport для клавиатуры');
            window.visualViewport.addEventListener('resize', handleKeyboardShow);
            window.visualViewport.addEventListener('scroll', handleKeyboardShow);
        }
        
        // Слушаем изменения размера окна для устройств без visualViewport
        window.addEventListener('resize', handleKeyboardShow);
        
        // Обработчики фокуса для полей ввода (особенно важно для iOS)
        document.addEventListener('focusin', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                // Для iOS добавляем задержку, чтобы клавиатура успела появиться
                setTimeout(handleKeyboardShow, 300);
            }
        });
        
        document.addEventListener('focusout', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                // Для iOS добавляем задержку, чтобы клавиатура успела скрыться
                setTimeout(handleKeyboardHide, 300);
            }
        });
        
        // Обработчик ориентации экрана
        window.addEventListener('orientationchange', () => {
            // Сбрасываем значения при изменении ориентации
            isKeyboardVisible = false;
            handleKeyboardHide();
            
            // Повторно устанавливаем после небольшой задержки
            setTimeout(() => {
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', `${vh}px`);
                
                // Обновляем исходную высоту, так как она изменится при повороте
                if (!isKeyboardVisible) {
                    // Устанавливаем новую оригинальную высоту только если клавиатура скрыта
                    // Иначе можем получить неверное значение
                    // originalWindowHeight = window.innerHeight;
                }
            }, 300);
        });
    };
    
    // Функция для удаления обработчиков
    const removeListeners = () => {
        if (window.visualViewport) {
            window.visualViewport.removeEventListener('resize', handleKeyboardShow);
            window.visualViewport.removeEventListener('scroll', handleKeyboardShow);
        }
        
        window.removeEventListener('resize', handleKeyboardShow);
        
        document.removeEventListener('focusin', handleKeyboardShow);
        document.removeEventListener('focusout', handleKeyboardHide);
        window.removeEventListener('orientationchange', handleKeyboardHide);
        
        // Возвращаем значения по умолчанию
        document.documentElement.style.setProperty('--keyboard-height', '0px');
        document.body.classList.remove('keyboard-visible');
    };
    
    return { addListeners, removeListeners, handleKeyboardShow, handleKeyboardHide };
};
