import WebApp from '@twa-dev/sdk';

/**
 * Утилиты для работы с Telegram WebApp
 */
export const telegramWebApp = {
    /**
     * Проверяет доступность Telegram WebApp API
     */
    isAvailable(): boolean {
        try {
            return typeof WebApp !== 'undefined' &&
                WebApp.isExpanded !== undefined &&
                !!WebApp.MainButton;
        } catch (e) {
            console.error('Ошибка при проверке Telegram WebApp API:', e);
            return false;
        }
    },

    /**
     * Безопасно вызывает методы Telegram WebApp
     */
    safeExec<T>(fn: () => T, fallbackValue: T): T {
        try {
            return fn();
        } catch (e) {
            console.error('Ошибка при выполнении Telegram WebApp функции:', e);
            return fallbackValue;
        }
    },

    /**
     * Настраивает MainButton
     */
    setupMainButton(text: string, onClick: () => void): boolean {
        if (!this.isAvailable()) return false;

        return this.safeExec(() => {
            WebApp.MainButton.setText(text);
            WebApp.MainButton.onClick(onClick);
            WebApp.MainButton.show();
            return true;
        }, false);
    },

    /**
     * Настраивает BackButton
     */
    setupBackButton(onClick: () => void, visible: boolean = true): boolean {
        if (!this.isAvailable()) return false;

        return this.safeExec(() => {
            if (visible) {
                WebApp.BackButton.onClick(onClick);
                WebApp.BackButton.show();
            } else {
                WebApp.BackButton.offClick(onClick);
                WebApp.BackButton.hide();
            }
            return true;
        }, false);
    },

    /**
     * Вызывает тактильный отклик
     */
    hapticFeedback(type: 'success' | 'error' | 'warning' | 'light' | 'medium' | 'heavy' = 'medium'): void {
        if (!this.isAvailable()) return;

        this.safeExec(() => {
            if (type === 'success' || type === 'error' || type === 'warning') {
                WebApp.HapticFeedback.notificationOccurred(type);
            } else {
                WebApp.HapticFeedback.impactOccurred(type);
            }
        }, undefined);
    },

    /**
     * Очистка всех слушателей событий
     */
    cleanup(onClickMain?: () => void, onClickBack?: () => void): void {
        if (!this.isAvailable()) return;

        this.safeExec(() => {
            if (onClickMain) WebApp.MainButton.offClick(onClickMain);
            if (onClickBack) WebApp.BackButton.offClick(onClickBack);
        }, undefined);
    },

    /**
     * Показать всплывающее сообщение
     */
    showAlert(message: string, callback?: () => void): void {
        if (!this.isAvailable()) {
            alert(message);
            if (callback) callback();
            return;
        }

        this.safeExec(() => {
            WebApp.showAlert(message, callback);
        }, undefined);
    }
};

export default telegramWebApp;
