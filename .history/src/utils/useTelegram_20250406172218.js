import { useEffect } from 'react';

const useTelegram = () => {
    const WebApp = window.Telegram?.WebApp;

    useEffect(() => {
        if (WebApp) {
            WebApp.ready();
        }
    }, [WebApp]);

    /**
     * Безопасно вызывает метод HapticFeedback с проверкой поддержки
     * @param {string} type - Тип вибрации ('impact', 'notification', 'selection')
     * @param {string} [style] - Стиль вибрации (только для 'notification': 'error', 'success', 'warning')
     * @returns {boolean} - true если успешно, false если не поддерживается
     */
    const safeHapticFeedback = (type, style) => {
        try {
            if (!WebApp?.HapticFeedback) {
                console.log('\n [Telegram.WebApp] HapticFeedback is not available');
                return false;
            }

            // Проверка методов в зависимости от типа вибрации
            if (type === 'notification' && typeof WebApp.HapticFeedback.notificationOccurred === 'function') {
                WebApp.HapticFeedback.notificationOccurred(style || 'success');
                return true;
            } else if (type === 'impact' && typeof WebApp.HapticFeedback.impactOccurred === 'function') {
                WebApp.HapticFeedback.impactOccurred(style || 'medium');
                return true;
            } else if (type === 'selection' && typeof WebApp.HapticFeedback.selectionChanged === 'function') {
                WebApp.HapticFeedback.selectionChanged();
                return true;
            } else {
                console.log(`\n [Telegram.WebApp] HapticFeedback method for ${type} is not supported in version ${WebApp.version}`);
                return false;
            }
        } catch (error) {
            console.log(`\n [Telegram.WebApp] HapticFeedback error: ${error.message}`);
            return false;
        }
    };

    /**
     * Безопасно показывает всплывающее окно с проверкой поддержки
     * @param {Object} options - Параметры всплывающего окна
     * @returns {Promise<string>} - Результат взаимодействия с окном
     */
    const safeShowPopup = async (options) => {
        try {
            // Если метод showPopup недоступен, используем alert в качестве запасного варианта
            if (!WebApp?.showPopup || typeof WebApp.showPopup !== 'function') {
                console.log(`\n [Telegram.WebApp] Method showPopup is not supported in version ${WebApp.version}`);

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

            return await WebApp.showPopup(options);
        } catch (error) {
            console.log(`\n Show popup failed: ${error}`);

            // Возвращаем значение по умолчанию
            return 'error';
        }
    };

    return {
        WebApp,
        safeHapticFeedback,
        safeShowPopup
    };
};

export default useTelegram;