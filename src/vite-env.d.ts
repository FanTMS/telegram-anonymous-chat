/// <reference types="vite/client" />

// Добавляем поддержку нестандартных свойств WebApp
interface WebApp {
    colorScheme: string;
    themeParams: {
        bg_color?: string;
        text_color?: string;
        hint_color?: string;
        link_color?: string;
        button_color?: string;
        button_text_color?: string;
        secondary_bg_color?: string;
    };
    HapticFeedback: {
        impactOccurred: (style: string) => void;
        notificationOccurred: (style: string) => void;
    };
    // и другие свойства
}

// Расширяем глобальный интерфейс Window
interface Window {
    Telegram?: {
        WebApp?: WebApp;
    };
    WebApp?: WebApp;
    _matchmakingIntervalId?: number | null;
    _newChatCheckInterval?: number | null;
}

// Добавляем глобальную переменную для обработки событий
interface CustomEventMap {
    'chatFound': CustomEvent<{
        chatId: string;
        participants?: string[];
        timestamp?: number;
        userId?: string;
    }>;
}

declare global {
    interface WindowEventMap extends CustomEventMap { }

    interface Document {
        addEventListener<K extends keyof CustomEventMap>(
            type: K,
            listener: (this: Document, ev: CustomEventMap[K]) => void
        ): void;
        dispatchEvent<K extends keyof CustomEventMap>(ev: CustomEventMap[K]): boolean;
    }

    interface Window {
        addEventListener<K extends keyof CustomEventMap>(
            type: K,
            listener: (this: Window, ev: CustomEventMap[K]) => void
        ): void;
        dispatchEvent<K extends keyof CustomEventMap>(ev: CustomEventMap[K]): boolean;
    }
}

export { };
