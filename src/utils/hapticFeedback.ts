import WebApp from '@twa-dev/sdk';

// Типы вибротактильных откликов
export type ImpactStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
export type NotificationStyle = 'error' | 'success' | 'warning';

/**
 * Утилита для работы с тактильной обратной связью в Telegram Mini App
 */
export const hapticFeedback = {
    /**
     * Проверка доступности haptic feedback
     */
    isAvailable(): boolean {
        try {
            return typeof WebApp !== 'undefined' &&
                !!WebApp.HapticFeedback &&
                typeof WebApp.HapticFeedback.impactOccurred === 'function';
        } catch (e) {
            console.warn('Ошибка при проверке доступности HapticFeedback:', e);
            return false;
        }
    },

    /**
     * Вызов тактильного воздействия (для нажатия кнопок, переключателей и т.д.)
     */
    impact(style: ImpactStyle = 'medium'): void {
        try {
            if (this.isAvailable()) {
                WebApp.HapticFeedback.impactOccurred(style);
            }
        } catch (e) {
            console.warn(`Ошибка при вызове HapticFeedback.impactOccurred(${style}):`, e);
        }
    },

    /**
     * Вызов тактильного уведомления (для оповещений, предупреждений, ошибок)
     */
    notification(style: NotificationStyle = 'success'): void {
        try {
            if (this.isAvailable()) {
                WebApp.HapticFeedback.notificationOccurred(style);
            }
        } catch (e) {
            console.warn(`Ошибка при вызове HapticFeedback.notificationOccurred(${style}):`, e);
        }
    },

    /**
     * Вызов тактильной обратной связи для нажатия
     */
    tap(): void {
        this.impact('light');
    },

    /**
     * Вызов тактильной обратной связи для ошибки
     */
    error(): void {
        this.notification('error');
    },

    /**
     * Вызов тактильной обратной связи для успеха
     */
    success(): void {
        this.notification('success');
    },

    /**
     * Вызов тактильной обратной связи для предупреждения
     */
    warning(): void {
        this.notification('warning');
    },

    /**
     * Вызов тактильной обратной связи для навигации
     */
    navigate(): void {
        this.impact('medium');
    }
};

export default hapticFeedback;
