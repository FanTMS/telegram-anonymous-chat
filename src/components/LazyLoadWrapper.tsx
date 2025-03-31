import React, { useState, useEffect, Suspense } from 'react';

/**
 * Интерфейс для обертки с отложенной загрузкой
 */
interface LazyLoadWrapperProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    delay?: number;
    loadingState?: boolean;
    onLoaded?: () => void;
}

/**
 * Компонент для отложенной загрузки содержимого
 * Помогает уменьшить проблемы с рендерингом в Telegram Mini App
 */
export const LazyLoadWrapper: React.FC<LazyLoadWrapperProps> = ({
    children,
    fallback = <DefaultLoader />,
    delay = 300,
    loadingState,
    onLoaded
}) => {
    // Создаем локальное состояние загрузки, если внешнее не предоставлено
    const [isLoadingInternal, setIsLoadingInternal] = useState(true);
    const isLoading = loadingState !== undefined ? loadingState : isLoadingInternal;

    useEffect(() => {
        // Если управляем состоянием сами, то используем таймер
        if (loadingState === undefined) {
            const timer = setTimeout(() => {
                setIsLoadingInternal(false);
                if (onLoaded) onLoaded();
            }, delay);

            return () => clearTimeout(timer);
        }
        // Если контроль внешний и загрузка завершена, вызываем колбэк
        else if (!loadingState && onLoaded) {
            onLoaded();
        }
    }, [delay, loadingState, onLoaded]);

    // Отображаем заглушку, пока идет загрузка
    if (isLoading) {
        return <>{fallback}</>;
    }

    // Отображаем содержимое после загрузки
    return (
        <Suspense fallback={fallback}>
            {children}
        </Suspense>
    );
};

/**
 * Компонент загрузки по умолчанию
 */
const DefaultLoader: React.FC = () => {
    return (
        <div className="flex items-center justify-center p-4 min-h-[200px]">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
};

export default LazyLoadWrapper;
