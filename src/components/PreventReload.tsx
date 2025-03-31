import { useEffect } from 'react';
import WebApp from '@twa-dev/sdk';

interface PreventReloadProps {
    /**
     * Показывать ли предупреждение перед закрытием/перезагрузкой страницы
     */
    enabled?: boolean;

    /**
     * Текст предупреждения
     */
    message?: string;

    /**
     * Обработчик, вызываемый перед закрытием страницы
     * Если возвращает строку, она используется как сообщение
     */
    onBeforeUnload?: () => string | void;

    /**
     * Отключать Telegram MainButton при смене страницы
     * (предотвращает ошибки навигации в WebApp)
     */
    disableMainButton?: boolean;
}

/**
 * Компонент для предотвращения случайной перезагрузки страницы
 * Особенно полезен в Telegram Mini App, где перезагрузка может привести к потере данных
 */
export const PreventReload: React.FC<PreventReloadProps> = ({
    enabled = true,
    message = "Вы уверены, что хотите покинуть страницу? Несохраненные данные будут потеряны.",
    onBeforeUnload,
    disableMainButton = true
}) => {
    useEffect(() => {
        if (!enabled) return;

        // Обработчик события beforeunload
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            // Вызываем пользовательский обработчик, если он есть
            const customMessage = onBeforeUnload?.();

            // Используем пользовательское сообщение, если оно возвращено
            const warningMessage = typeof customMessage === 'string' ? customMessage : message;

            // Стандартный способ отмены закрытия страницы
            event.preventDefault();

            // Для старых браузеров
            event.returnValue = warningMessage;

            return warningMessage;
        };

        // Добавляем обработчик
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Очищаем обработчики при размонтировании компонента
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [enabled, message, onBeforeUnload]);

    // Обработка специфичных для Telegram WebApp сценариев
    useEffect(() => {
        if (!enabled || !disableMainButton) return;

        // Функция для безопасного выполнения операций с WebApp
        const safeExec = <T,>(fn: () => T): T | null => {
            try {
                if (typeof WebApp !== 'undefined' && WebApp.isExpanded) {
                    return fn();
                }
            } catch (e) {
                console.warn('Ошибка при взаимодействии с Telegram WebApp:', e);
            }
            return null;
        };

        // Сохраняем состояние кнопки, чтобы восстановить его при размонтировании
        const mainButtonIsVisible = safeExec(() => WebApp.MainButton.isVisible);

        // Обработчик навигации страницы (popstate)
        const handlePopState = () => {
            // Скрываем MainButton при навигации для предотвращения ошибок
            safeExec(() => {
                if (WebApp.MainButton.isVisible) {
                    WebApp.MainButton.hide();
                }
                return null;
            });
        };

        // Слушаем события навигации
        window.addEventListener('popstate', handlePopState);

        // Очистка при размонтировании
        return () => {
            window.removeEventListener('popstate', handlePopState);

            // Восстанавливаем состояние кнопки
            safeExec(() => {
                if (mainButtonIsVisible && !WebApp.MainButton.isVisible) {
                    WebApp.MainButton.show();
                }
                return null;
            });
        };
    }, [enabled, disableMainButton]);

    // Этот компонент не рендерит видимый UI
    return null;
};

export default PreventReload;
