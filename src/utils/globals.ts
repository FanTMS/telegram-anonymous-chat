/**
 * Утилита для объявления глобальных переменных и типов
 * для TypeScript и для доступа к специальным объектам Telegram WebApp
 */

// Объявляем глобальные типы для TypeScript
declare global {
    interface Window {
        Telegram?: {
            WebApp?: any;
        };
        telegramAppInitTimeout?: number;
        removeLoadingScreen?: () => void;
    }
}

/**
 * Проверяет, доступен ли объект Telegram WebApp
 */
export function isTelegramWebAppAvailable(): boolean {
    return typeof window !== 'undefined' &&
        !!window.Telegram?.WebApp &&
        typeof window.Telegram.WebApp.initData === 'string' &&
        window.Telegram.WebApp.initData.length > 0;
}

/**
 * Проверяет, выполняется ли приложение в iframe
 */
export function isRunningInIframe(): boolean {
    try {
        return window !== window.parent;
    } catch (e) {
        // Если получим ошибку доступа к parent, значит мы в iframe с другим origin
        return true;
    }
}

/**
 * Определяет текущую платформу
 */
export function detectPlatform(): 'ios' | 'android' | 'desktop' | 'unknown' {
    const ua = navigator.userAgent || '';

    if (/iPhone|iPad|iPod/i.test(ua)) {
        return 'ios';
    } else if (/Android/i.test(ua)) {
        return 'android';
    } else if (/Windows|Mac|Linux/i.test(ua)) {
        return 'desktop';
    }

    return 'unknown';
}

/**
 * Класс для хранения и доступа к глобальному состоянию приложения
 */
export class AppState {
    private static instance: AppState;
    private _isInitialized: boolean = false;
    private _environment: 'production' | 'development' =
        process.env.NODE_ENV === 'production' ? 'production' : 'development';
    private _platform: ReturnType<typeof detectPlatform>;
    private _inTelegram: boolean;

    private constructor() {
        this._platform = detectPlatform();
        this._inTelegram = isTelegramWebAppAvailable();
    }

    public static getInstance(): AppState {
        if (!AppState.instance) {
            AppState.instance = new AppState();
        }
        return AppState.instance;
    }

    public initialize(): void {
        if (this._isInitialized) return;

        // Добавляем классы к body в зависимости от окружения
        document.body.classList.add(`platform-${this._platform}`);
        if (this._inTelegram) {
            document.body.classList.add('in-telegram');
        }
        if (this._environment === 'development') {
            document.body.classList.add('dev-mode');
        }

        this._isInitialized = true;
    }

    get isInitialized(): boolean {
        return this._isInitialized;
    }

    get environment(): 'production' | 'development' {
        return this._environment;
    }

    get platform(): ReturnType<typeof detectPlatform> {
        return this._platform;
    }

    get inTelegram(): boolean {
        return this._inTelegram;
    }
}

// Экспортируем singleton экземпляр для использования в приложении
export const appState = AppState.getInstance();

// Автоматическая инициализация при импорте
setTimeout(() => {
    appState.initialize();
}, 0);

export default appState;
