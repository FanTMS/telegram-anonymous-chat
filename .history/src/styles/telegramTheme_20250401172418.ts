import { extendTheme } from '@chakra-ui/react';

// Тема для Telegram Mini App
export const telegramTheme = extendTheme({
    styles: {
        global: {
            // Основные стили для адаптации под Telegram Mini App
            body: {
                bg: 'var(--tg-theme-bg-color, #ffffff)',
                color: 'var(--tg-theme-text-color, #000000)',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            },
            '#root': {
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
            },
        },
    },
    colors: {
        telegram: {
            bg: 'var(--tg-theme-bg-color, #ffffff)',
            text: 'var(--tg-theme-text-color, #000000)',
            hint: 'var(--tg-theme-hint-color, #999999)',
            link: 'var(--tg-theme-link-color, #2481cc)',
            button: 'var(--tg-theme-button-color, #2481cc)',
            buttonText: 'var(--tg-theme-button-text-color, #ffffff)',
            secondaryBg: 'var(--tg-theme-secondary-bg-color, #f0f0f0)',
        },
    },
    components: {
        Button: {
            variants: {
                telegram: {
                    bg: 'var(--tg-theme-button-color, #2481cc)',
                    color: 'var(--tg-theme-button-text-color, #ffffff)',
                    _hover: {
                        bg: 'var(--tg-theme-button-color, #2481cc)',
                        opacity: 0.8,
                    },
                    _active: {
                        bg: 'var(--tg-theme-button-color, #2481cc)',
                        opacity: 0.9,
                    },
                },
                telegramOutline: {
                    bg: 'transparent',
                    color: 'var(--tg-theme-button-color, #2481cc)',
                    border: '1px solid',
                    borderColor: 'var(--tg-theme-button-color, #2481cc)',
                    _hover: {
                        bg: 'var(--tg-theme-secondary-bg-color, rgba(36, 129, 204, 0.08))',
                    },
                },
            },
        },
        Heading: {
            baseStyle: {
                color: 'var(--tg-theme-text-color, #000000)',
            },
        },
        Text: {
            baseStyle: {
                color: 'var(--tg-theme-text-color, #000000)',
            },
            variants: {
                hint: {
                    color: 'var(--tg-theme-hint-color, #999999)',
                },
            },
        },
        Link: {
            baseStyle: {
                color: 'var(--tg-theme-link-color, #2481cc)',
            },
        },
    },
});
