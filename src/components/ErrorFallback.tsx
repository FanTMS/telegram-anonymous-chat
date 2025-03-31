import React from 'react';
import { Button } from './Button';
import WebApp from '@twa-dev/sdk';

interface ErrorFallbackProps {
    error?: Error;
    resetErrorBoundary?: () => void;
    message?: string;
    buttonText?: string;
    showReload?: boolean;
}

/**
 * Запасной компонент для отображения при ошибках в приложении
 */
export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
    error,
    resetErrorBoundary,
    message = 'Произошла ошибка в приложении',
    buttonText = 'Попробовать снова',
    showReload = true
}) => {
    const handleReset = () => {
        try {
            // Если это Telegram WebApp, вызываем вибрацию
            if (typeof WebApp !== 'undefined' && WebApp.HapticFeedback) {
                WebApp.HapticFeedback.impactOccurred('medium');
            }

            // Вызываем функцию сброса ошибки
            if (resetErrorBoundary) {
                resetErrorBoundary();
            }
        } catch (e) {
            console.warn('Ошибка при сбросе ошибки:', e);
        }
    };

    const handleReload = () => {
        try {
            // Вызываем вибрацию перед перезагрузкой
            if (typeof WebApp !== 'undefined' && WebApp.HapticFeedback) {
                WebApp.HapticFeedback.notificationOccurred('warning');
            }

            // Перезагружаем страницу
            window.location.reload();
        } catch (e) {
            console.warn('Ошибка при перезагрузке страницы:', e);
        }
    };

    return (
        <div className="flex items-center justify-center p-4 min-h-[50vh]">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
                        <span className="text-red-500 dark:text-red-400 text-2xl">⚠️</span>
                    </div>

                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                        {message}
                    </h2>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg mb-4 w-full overflow-auto max-h-32">
                            <p className="text-sm text-red-800 dark:text-red-300 font-mono whitespace-pre-wrap">
                                {error.message || 'Неизвестная ошибка'}
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 mt-2">
                        {resetErrorBoundary && (
                            <Button
                                onClick={handleReset}
                                variant="primary"
                                className="bg-blue-500 hover:bg-blue-600"
                            >
                                {buttonText}
                            </Button>
                        )}

                        {showReload && (
                            <Button
                                onClick={handleReload}
                                variant="outline"
                                className="border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300"
                            >
                                Перезагрузить страницу
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ErrorFallback;
