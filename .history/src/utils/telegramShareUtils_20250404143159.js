import WebApp from '@twa-dev/sdk';

/**
 * Безопасно проверяет доступность метода Telegram WebApp
 * @param {string} methodName - Имя метода для проверки
 * @returns {boolean} Результат проверки
 */
const isMethodSupported = (methodName) => {
    try {
        const parts = methodName.split('.');
        let obj = WebApp;
        
        for (let i = 0; i < parts.length; i++) {
            if (!obj[parts[i]]) return false;
            obj = obj[parts[i]];
        }
        
        return typeof obj === 'function';
    } catch (e) {
        return false;
    }
};

/**
 * Делится текстовым сообщением через Telegram
 * @param {string} text - Текст для отправки
 * @returns {Promise<boolean>} Успешность операции
 */
export const shareText = async (text) => {
    try {
        if (!isMethodSupported('shareMessageWithResults')) {
            console.warn('shareMessageWithResults is not supported');
            return false;
        }
        
        const result = await WebApp.shareMessageWithResults({
            text
        });
        
        return result && result.ok;
    } catch (error) {
        console.warn('Error sharing text:', error);
        return false;
    }
};

/**
 * Делится подсказкой из руководства через Telegram
 * @param {string} tipTitle - Заголовок подсказки
 * @param {string} tipContent - Содержание подсказки
 * @returns {Promise<boolean>} Успешность операции
 */
export const shareTip = async (tipTitle, tipContent) => {
    const text = `💡 *${tipTitle}*\n\n${tipContent}\n\nПодсказка из руководства по общению в Анонимном чате`;
    return shareText(text);
};
