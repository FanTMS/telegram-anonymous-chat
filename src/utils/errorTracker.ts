/**
 * Утилита для отслеживания и логирования ошибок в приложении
 */

// Интерфейс для логируемых ошибок
interface ErrorLog {
    timestamp: string;
    message: string;
    stack?: string;
    componentStack?: string;
    metadata?: Record<string, any>;
}

class ErrorTracker {
    private logs: ErrorLog[] = [];
    private maxLogs: number = 50;

    constructor() {
        this.setupGlobalErrorHandling();
    }

    /**
     * Настраивает глобальную обработку ошибок
     */
    private setupGlobalErrorHandling(): void {
        // Перехват необработанных Promise rejection
        window.addEventListener('unhandledrejection', (event) => {
            this.logError(event.reason, { type: 'unhandledRejection' });
        });

        // Перехват глобальных ошибок
        window.addEventListener('error', (event) => {
            this.logError(event.error || new Error(event.message), {
                type: 'globalError',
                fileName: event.filename,
                lineNo: event.lineno,
                colNo: event.colno
            });
        });

        // Переопределяем метод console.error для отслеживания
        const originalConsoleError = console.error;
        console.error = (...args) => {
            // Логируем ошибку во внутреннее хранилище
            if (args[0] instanceof Error) {
                this.logError(args[0], { source: 'console.error' });
            } else if (typeof args[0] === 'string') {
                this.logError(new Error(args[0]), {
                    source: 'console.error',
                    originalArgs: args.slice(1)
                });
            }
            // Вызываем оригинальный метод
            originalConsoleError.apply(console, args);
        };
    }

    /**
     * Логирует ошибку
     */
    public logError(error: Error | string, metadata?: Record<string, any>): void {
        const errorObj = typeof error === 'string' ? new Error(error) : error;

        const log: ErrorLog = {
            timestamp: new Date().toISOString(),
            message: errorObj.message,
            stack: errorObj.stack,
            metadata
        };

        this.logs.unshift(log);

        // Ограничиваем количество логов
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(0, this.maxLogs);
        }

        // Сохраняем логи в localStorage для отладки
        try {
            localStorage.setItem('app_error_logs', JSON.stringify(this.logs));
        } catch (e) {
            // Игнорируем ошибки localStorage
        }
    }

    /**
     * Получает все логи ошибок
     */
    public getLogs(): ErrorLog[] {
        return [...this.logs];
    }

    /**
     * Очищает все логи
     */
    public clearLogs(): void {
        this.logs = [];
        try {
            localStorage.removeItem('app_error_logs');
        } catch (e) {
            // Игнорируем ошибки localStorage
        }
    }

    /**
     * Загружает логи из localStorage при инициализации
     */
    public loadLogsFromStorage(): void {
        try {
            const storedLogs = localStorage.getItem('app_error_logs');
            if (storedLogs) {
                this.logs = JSON.parse(storedLogs);
            }
        } catch (e) {
            console.warn('Не удалось загрузить логи ошибок из localStorage');
        }
    }
}

// Создаем и экспортируем экземпляр трекера ошибок
export const errorTracker = new ErrorTracker();
errorTracker.loadLogsFromStorage();

export default errorTracker;
