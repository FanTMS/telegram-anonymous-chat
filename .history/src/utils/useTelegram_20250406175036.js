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

    useEffect(() => {
        if (WebAppInstance) {
            WebAppInstance.ready();
        }
    }, [WebAppInstance]);

    // Безопасно вызывает метод WebApp только если он доступен
    const safeWebAppCall = (methodName, ...args) => {
        if (isAvailable && WebAppInstance && typeof WebAppInstance[methodName] === 'function') {
            try {
                return WebAppInstance[methodName](...args);
            } catch (error) {
                console.warn(`Ошибка при вызове ${methodName}:`, error);
                return null;
            }
        }
        return null;
    };

    // Проверяет поддержку метода в текущей версии WebApp
    const supportsMethod = (methodName) => {
        if (!isAvailable || !WebAppInstance) return false;

        const version = WebAppInstance.version || '6.0';
        const versionNumber = parseFloat(version);

        // Карта версий, в которых методы были добавлены
        const methodVersionMap = {
            'setHeaderColor': 6.2,
            'setBackgroundColor': 6.2
            // Можно добавить другие методы при необходимости
        };

        return versionNumber >= (methodVersionMap[methodName] || 0);
    };

    /**
     * Безопасно вызывает метод HapticFeedback с проверкой поддержки
     * @param {string} type - Тип вибрации ('impact', 'notification', 'selection')
     * @param {string} [style] - Стиль вибрации (только для 'notification': 'error', 'success', 'warning')
     * @returns {boolean} - true если успешно, false если не поддерживается
     */
    const safeHapticFeedback = useCallback((type, style) => {
        try {
            if (!WebAppInstance?.HapticFeedback) {
                console.log('\n [Telegram.WebApp] HapticFeedback is not available');
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
            } else {
                console.log(`\n [Telegram.WebApp] HapticFeedback method for ${type} is not supported`);
                return false;
            }
        } catch (error) {
            console.log(`\n [Telegram.WebApp] HapticFeedback error: ${error.message}`);
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
            // Если метод showPopup недоступен, используем alert в качестве запасного варианта
            if (!WebAppInstance?.showPopup || typeof WebAppInstance.showPopup !== 'function') {
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

                throw new Error('WebAppMethodUnsupported');
            }

            return await WebAppInstance.showPopup(options);
        } catch (error) {
            console.log(`\n Show popup failed: ${error}`);

            // Возвращаем значение по умолчанию
            return 'error';
        }
    }, [WebAppInstance]);

    return {
        isAvailable,
        user: isAvailable ? WebAppInstance.initDataUnsafe?.user : null,
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