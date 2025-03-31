import WebApp from '@twa-dev/sdk';

/**
 * Функция для немедленного вызова WebApp.ready()
 * Вызывается сразу при импорте модуля
 */
export function triggerWebAppReady() {
    try {
        // Проверяем наличие WebApp
        if (typeof WebApp !== 'undefined') {
            console.log('🚀 Немедленный вызов WebApp.ready() из webAppHelper');
            WebApp.ready();
            console.log('✅ WebApp.ready() вызван успешно из webAppHelper');
            return true;
        }
    } catch (e) {
        console.error('❌ Ошибка при вызове WebApp.ready() из webAppHelper:', e);
    }
    return false;
}

/**
 * Функция для проверки доступности WebApp
 */
export function isWebAppAvailable(): boolean {
    try {
        return typeof WebApp !== 'undefined';
    } catch (e) {
        return false;
    }
}

/**
 * Экспортируем готовность WebApp сразу при импорте модуля
 */
export const isReady = triggerWebAppReady();

export default {
    triggerWebAppReady,
    isWebAppAvailable,
    isReady
};
