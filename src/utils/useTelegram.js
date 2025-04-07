import { useEffect, useState, useCallback } from 'react';

/**
 * Проверяет доступность Telegram WebApp
 * @returns {boolean} true если доступен, false если нет
 */
const isWebAppAvailable = () => {
    return typeof window.Telegram?.WebApp !== 'undefined';
};

/**
 * Хук для работы с Telegram WebApp
 * @returns {Object} Методы и свойства WebApp
 */
export const useTelegram = () => {
    // Проверяем доступность WebApp
    const isAvailable = isWebAppAvailable();
    const WebAppInstance = isAvailable ? window.Telegram.WebApp : null;
    const [methodsSupported, setMethodsSupported] = useState({});

    useEffect(() => {
        if (WebAppInstance) {
            try {
                WebAppInstance.ready();
            } catch (error) {
                console.warn('Ошибка при вызове WebApp.ready():', error);
            }
        }
    }, [WebAppInstance]);

    // Безопасно вызывает метод WebApp только если он доступен
    const safeWebAppCall = (methodName, ...args) => {
        if (!isAvailable || !WebAppInstance) {
            console.warn(`WebApp не доступен, метод ${methodName} не вызван`);
            return null;
        }

        // Проверяем путь к методу (может быть вложенным, например backButton.show)
        const methodPath = methodName.split('.');
        let method = WebAppInstance;
        
        for (const part of methodPath) {
            method = method[part];
            if (!method) {
                console.warn(`Метод ${methodName} не найден в WebApp`);
                return null;
            }
        }
        
        if (typeof method !== 'function') {
            console.warn(`${methodName} не является функцией`);
            return null;
        }
        
        try {
            const context = methodPath.length > 1 
                ? methodPath.slice(0, -1).reduce((obj, key) => obj[key], WebAppInstance) 
                : WebAppInstance;
            return method.apply(context, args);
        } catch (error) {
            console.warn(`Ошибка при вызове ${methodName}:`, error);
            
            // Обновляем состояние поддержки метода
            if (error.message && error.message.includes('not supported in version')) {
                setMethodsSupported(prev => ({
                    ...prev,
                    [methodName]: false
                }));
                console.log(`\n [Telegram.WebApp] Method ${methodName} is not supported in current version`);
            }
            
            return null;
        }
    };

    // Проверяет поддержку метода в текущей версии WebApp
    const supportsMethod = (methodName) => {
        // Если уже проверяли этот метод, вернем сохраненный результат
        if (methodsSupported[methodName] !== undefined) {
            return methodsSupported[methodName];
        }
        
        if (!isAvailable || !WebAppInstance) return false;

        // Получаем версию WebApp
        const version = WebAppInstance.version || '6.0';
        const versionNumber = parseFloat(version);

        // Карта версий, в которых методы были добавлены
        const methodVersionMap = {
            'setHeaderColor': 6.2,
            'setBackgroundColor': 6.2,
            'expand': 6.1,
            'showPopup': 6.2,
            'HapticFeedback.impactOccurred': 6.1,
            'HapticFeedback.notificationOccurred': 6.1,
            'HapticFeedback.selectionChanged': 6.1
            // Можно добавить другие методы при необходимости
        };

        // Проверяем версию или наличие метода
        const requiredVersion = methodVersionMap[methodName] || 0;
        let isSupported = versionNumber >= requiredVersion;
        
        // Дополнительно проверяем наличие метода, если он должен быть поддержан
        if (isSupported && methodName.includes('.')) {
            const parts = methodName.split('.');
            let obj = WebAppInstance;
            for (const part of parts) {
                if (!obj || typeof obj[part] === 'undefined') {
                    isSupported = false;
                    break;
                }
                obj = obj[part];
            }
            
            // Проверяем, что последний элемент - функция
            if (isSupported && typeof obj !== 'function') {
                isSupported = false;
            }
        }
        
        // Сохраняем результат проверки
        setMethodsSupported(prev => ({
            ...prev,
            [methodName]: isSupported
        }));
        
        return isSupported;
    };

    /**
     * Безопасно вызывает метод HapticFeedback с проверкой поддержки
     * @param {string} type - Тип вибрации ('impact', 'notification', 'selection')
     * @param {string} [style] - Стиль вибрации (только для 'notification': 'error', 'success', 'warning')
     * @param {string} [fallbackType] - Запасной тип, если основной не поддерживается
     * @returns {boolean} - true если успешно, false если не поддерживается
     */
    const safeHapticFeedback = useCallback((type, style, fallbackType) => {
        try {
            if (!WebAppInstance?.HapticFeedback) {
                console.log('\n [Telegram.WebApp] HapticFeedback is not supported');
                return false;
            }

            // Проверка методов в зависимости от типа вибрации
            if (type === 'notification' && typeof WebAppInstance.HapticFeedback.notificationOccurred === 'function') {
                WebAppInstance.HapticFeedback.notificationOccurred(style || 'success');
                return true;
            } else if (type === 'impact' && typeof WebAppInstance.HapticFeedback.impactOccurred === 'function') {
                WebAppInstance.HapticFeedback.impactOccurred(style || 'medium');
                return true;
            } else if (type === 'selection' && typeof WebAppInstance.HapticFeedback.selectionChanged === 'function') {
                WebAppInstance.HapticFeedback.selectionChanged();
                return true;
            } else if (fallbackType && fallbackType !== type) {
                // Пробуем использовать запасной тип
                return safeHapticFeedback(fallbackType, style, null);
            } else {
                console.log(`\n [Telegram.WebApp] HapticFeedback method for ${type} is not supported`);
                return false;
            }
        } catch (error) {
            console.log(`\n [Telegram.WebApp] HapticFeedback error: ${error.message}`);
            
            // Если есть запасной тип, пробуем использовать его
            if (fallbackType && fallbackType !== type) {
                return safeHapticFeedback(fallbackType, style, null);
            }
            
            return false;
        }
    }, [WebAppInstance]);

    /**
     * Безопасно показывает всплывающее окно с проверкой поддержки
     * @param {Object} options - Параметры всплывающего окна
     * @returns {Promise<string>} - Результат взаимодействия с окном
     */
    const safeShowPopup = useCallback(async (options) => {
        try {
            // Проверяем доступность метода showPopup
            if (!WebAppInstance || typeof WebAppInstance.showPopup !== 'function') {
                // Логгируем сообщение о недоступности метода
                console.log('\n [Telegram.WebApp] Method showPopup is not supported');
                
                // Создаем простое сообщение из параметров
                const message = `${options.title || 'Уведомление'}\n\n${options.message || ''}`;

                // Используем стандартный alert как запасной вариант
                if (typeof alert === 'function') {
                    alert(message);

                    // Возвращаем ID первой кнопки как запасной вариант
                    if (options.buttons && options.buttons.length > 0) {
                        return options.buttons[0].id || 'ok';
                    }
                    return 'ok';
                }
                
                // Отмечаем метод как неподдерживаемый
                setMethodsSupported(prev => ({
                    ...prev,
                    'showPopup': false
                }));
                
                throw new Error('WebAppMethodUnsupported');
            }

            return await WebAppInstance.showPopup(options);
        } catch (error) {
            console.log(`\n Show popup failed: ${error.message || error}`);

            // Если это была проверка наличия метода, обновляем статус поддержки
            if (error.message && (
                error.message.includes('not supported') || 
                error.message.includes('is not a function')
            )) {
                setMethodsSupported(prev => ({
                    ...prev,
                    'showPopup': false
                }));
            }

            // Возвращаем значение по умолчанию
            return 'error';
        }
    }, [WebAppInstance]);

    return {
        isAvailable,
        user: isAvailable ? WebAppInstance?.initDataUnsafe?.user : null,
        WebApp: WebAppInstance,
        onClose: () => safeWebAppCall('close'),
        onBack: () => safeWebAppCall('backButton.onClick'),
        showBackButton: (visible) => safeWebAppCall('backButton.show', visible),
        hideBackButton: () => safeWebAppCall('backButton.hide'),
        sendData: (data) => safeWebAppCall('sendData', data),
        ready: () => safeWebAppCall('ready'),
        expand: () => safeWebAppCall('expand'),
        close: () => safeWebAppCall('close'),
        supportsMethod,
        safeWebAppCall,
        safeHapticFeedback,
        safeShowPopup
    };
};

export default useTelegram;