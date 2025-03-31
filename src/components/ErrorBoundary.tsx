import React, { Component, ErrorInfo, ReactNode } from 'react';
import WebApp from '@twa-dev/sdk';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

/**
 * Компонент для обработки ошибок в дочерних компонентах
 * Помогает предотвратить крах всего приложения при ошибках в отдельных компонентах
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null
        };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        // Обновляем состояние, чтобы при следующем рендере отобразить запасной UI
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Логируем ошибку
        console.error('Error caught by ErrorBoundary:', error, errorInfo);

        // Вызываем пользовательский обработчик ошибок, если предоставлен
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // Пытаемся отправить уведомление через Telegram WebApp
        try {
            if (typeof WebApp !== 'undefined') {
                WebApp.showAlert(`Произошла ошибка: ${error.message}`);
            }
        } catch (e) {
            console.warn('Не удалось показать уведомление в Telegram WebApp:', e);
        }
    }

    handleReset = (): void => {
        this.setState({ hasError: false, error: null });
    }

    render() {
        if (this.state.hasError) {
            // Если пользователь предоставил запасной UI, используем его
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Иначе показываем стандартный UI для ошибки
            return (
                <div className="p-4 mx-auto max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-red-200 dark:border-red-900">
                    <div className="flex flex-col items-center p-4">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
                            <span className="text-red-600 dark:text-red-400 text-2xl">⚠️</span>
                        </div>

                        <h2 className="text-xl font-bold mb-2 text-red-600 dark:text-red-400">
                            Произошла ошибка
                        </h2>

                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 text-center">
                            {this.state.error?.message || 'Неизвестная ошибка'}
                        </p>

                        <button
                            onClick={this.handleReset}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Попробовать снова
                        </button>

                        <button
                            onClick={() => window.location.reload()}
                            className="mt-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            Обновить страницу
                        </button>
                    </div>
                </div>
            );
        }

        // Если ошибок нет, рендерим дочерние компоненты
        return this.props.children;
    }
}

export default ErrorBoundary;
