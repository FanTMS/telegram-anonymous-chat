import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { telegramApp } from './telegram';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';

// Создаем кастомную тему для адаптации под Telegram
const theme = extendTheme({
    styles: {
        global: {
            // Стили для адаптации под Telegram Mini App
            body: {
                bg: 'var(--tg-theme-bg-color, #ffffff)',
                color: 'var(--tg-theme-text-color, #000000)',
            },
        },
    },
    colors: {
        telegram: {
            button: 'var(--tg-theme-button-color, #2481cc)',
            buttonText: 'var(--tg-theme-button-text-color, #ffffff)',
            secondaryBg: 'var(--tg-theme-secondary-bg-color, #f0f0f0)',
            link: 'var(--tg-theme-link-color, #2481cc)',
            hint: 'var(--tg-theme-hint-color, #999999)',
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
                },
            },
        },
    },
});

// Компонент обертки для инициализации Telegram WebApp
const TelegramAppWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    useEffect(() => {
        // Инициализация Telegram WebApp
        telegramApp.ready();
        telegramApp.expand();

        console.log('TelegramAppWrapper initialized');

        // Очищаем при размонтировании компонента
        return () => {
            console.log('TelegramAppWrapper unmounted');
        };
    }, []);

    return <>{children}</>;
};

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(
    <React.StrictMode>
        <BrowserRouter>
            <ChakraProvider theme={theme}>
                <TelegramAppWrapper>
                    <App />
                </TelegramAppWrapper>
            </ChakraProvider>
        </BrowserRouter>
    </React.StrictMode>
);
