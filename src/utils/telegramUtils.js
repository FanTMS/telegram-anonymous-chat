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
        // Проверяем WebApp через window.Telegram
        if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe && window.Telegram.WebApp.initDataUnsafe.user) {
            const userData = window.Telegram.WebApp.initDataUnsafe.user;
            console.log('Получены данные пользователя из Telegram WebApp (window.Telegram):', userData);
            
            // Сохраняем данные в sessionStorage
            try {
                sessionStorage.setItem('telegram_last_user', JSON.stringify(userData));
                sessionStorage.setItem('telegramUser', JSON.stringify(userData));
            } catch (e) {
                console.warn('Не удалось сохранить данные Telegram в sessionStorage:', e);
            }
            
            return userData;
        }
        
        // Проверяем WebApp через twa-dev/sdk
        if (typeof WebApp !== 'undefined' && WebApp.initDataUnsafe && WebApp.initDataUnsafe.user) {
            const userData = WebApp.initDataUnsafe.user;
            console.log('Получены данные пользователя из Telegram WebApp (twa-dev/sdk):', userData);
            
            // Сохраняем данные для последующего восстановления
            try {
                sessionStorage.setItem('telegram_last_user', JSON.stringify(userData));
                sessionStorage.setItem('telegramUser', JSON.stringify(userData));
            } catch (e) {
                console.warn('Не удалось сохранить данные Telegram в sessionStorage:', e);
            }
            
            return userData;
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
