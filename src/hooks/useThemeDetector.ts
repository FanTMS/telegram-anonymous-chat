import { useState, useEffect } from 'react';
import WebApp from '@twa-dev/sdk';

type ThemeMode = 'light' | 'dark' | 'system';

interface UseThemeDetectorOptions {
    /** Принудительно использовать светлую тему */
    forceLightTheme?: boolean;
    /** Принудительно использовать тёмную тему */
    forceDarkTheme?: boolean;
    /** Использовать тему Telegram */
    useTelegramTheme?: boolean;
    /** Сохранять выбор темы в localStorage */
    persistTheme?: boolean;
    /** Ключ для localStorage */
    storageKey?: string;
}

/**
 * Хук для определения и управления текущей темой приложения 
 * с поддержкой Telegram WebApp
 */
export function useThemeDetector({
    forceLightTheme = false,
    forceDarkTheme = false,
    useTelegramTheme = true,
    persistTheme = true,
    storageKey = 'theme_mode'
}: UseThemeDetectorOptions = {}) {
    // Получаем начальную тему из localStorage, Telegram или системных настроек
    const getInitialTheme = (): ThemeMode => {
        try {
            // Если задана принудительная тема - используем ее
            if (forceLightTheme) return 'light';
            if (forceDarkTheme) return 'dark';

            // Проверяем сохраненные настройки, если включено сохранение
            if (persistTheme) {
                const savedTheme = localStorage.getItem(storageKey) as ThemeMode | null;
                if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
                    return savedTheme;
                }
            }

            // Проверяем настройки Telegram WebApp
            if (useTelegramTheme && typeof WebApp !== 'undefined' && WebApp.colorScheme) {
                return WebApp.colorScheme === 'dark' ? 'dark' : 'light';
            }

            // Определяем системную тему
            return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        } catch (error) {
            console.warn('Ошибка при определении начальной темы:', error);
            return 'light'; // По умолчанию - светлая тема
        }
    };

    // Состояние текущей темы
    const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialTheme());

    // Вычисляемое значение - темная тема активна?
    const isDarkTheme = themeMode === 'dark' ||
        (themeMode === 'system' &&
            window.matchMedia &&
            window.matchMedia('(prefers-color-scheme: dark)').matches);

    // Функция для изменения темы
    const setTheme = (mode: ThemeMode) => {
        try {
            // Если заданы принудительные настройки - игнорируем запрос
            if (forceLightTheme || forceDarkTheme) return;

            // Устанавливаем режим темы
            setThemeMode(mode);

            // Сохраняем в localStorage, если нужно
            if (persistTheme) {
                localStorage.setItem(storageKey, mode);
            }

            // Добавляем или удаляем класс dark из html элемента
            if (mode === 'dark' ||
                (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        } catch (error) {
            console.error('Ошибка при смене темы:', error);
        }
    };

    // Слушаем изменения системной темы, если выбран режим system
    useEffect(() => {
        // Если выбран режим system, добавляем слушатель изменений системной темы
        if (themeMode === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

            // Обработчик изменения системной темы
            const handleSystemThemeChange = (e: MediaQueryListEvent) => {
                if (e.matches) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            };

            // Добавляем слушатель
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', handleSystemThemeChange);
            } else {
                // Для старых браузеров
                mediaQuery.addListener(handleSystemThemeChange);
            }

            // Очистка при размонтировании
            return () => {
                if (mediaQuery.removeEventListener) {
                    mediaQuery.removeEventListener('change', handleSystemThemeChange);
                } else {
                    // Для старых браузеров
                    mediaQuery.removeListener(handleSystemThemeChange);
                }
            };
        }
    }, [themeMode]);

    // При изменении темы в Telegram WebApp, обновляем нашу тему
    useEffect(() => {
        try {
            // Если отключили использование темы Telegram или установлены принудительные настройки - выходим
            if (!useTelegramTheme || forceLightTheme || forceDarkTheme) return;

            // Обработчик изменения темы в Telegram WebApp
            const handleTelegramThemeChange = () => {
                if (WebApp.colorScheme === 'dark') {
                    document.documentElement.classList.add('dark');
                    setThemeMode('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                    setThemeMode('light');
                }
            };

            // Проверяем доступность Telegram WebApp
            if (typeof WebApp !== 'undefined' && WebApp.onEvent) {
                WebApp.onEvent('themeChanged', handleTelegramThemeChange);

                return () => {
                    if (WebApp.offEvent) {
                        WebApp.offEvent('themeChanged', handleTelegramThemeChange);
                    }
                };
            }
        } catch (error) {
            console.warn('Ошибка при настройке слушателя темы Telegram:', error);
        }
    }, [useTelegramTheme, forceLightTheme, forceDarkTheme]);

    // Применяем начальную тему
    useEffect(() => {
        if (isDarkTheme) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkTheme]);

    return {
        themeMode,        // Текущий режим темы ('light', 'dark' или 'system')
        isDarkTheme,      // Результирующая тема (с учетом системной при режиме 'system')
        setTheme,         // Функция для изменения темы
        toggleTheme: () => setTheme(isDarkTheme ? 'light' : 'dark')  // Переключение между светлой и темной темой
    };
}

export default useThemeDetector;
