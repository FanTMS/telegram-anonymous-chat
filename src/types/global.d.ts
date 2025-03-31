// Определение глобальных типов для доступа к Telegram API и другим глобальным переменным

interface Window {
    _matchmakingIntervalId: number | null;
    _newChatCheckInterval: number | null;
    demoUserAdded: boolean;
    Telegram?: {
        WebApp?: any;
    };
    telegramAppInitTimeout?: number;
}
