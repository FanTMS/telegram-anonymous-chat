import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { telegramApp } from './telegram';
import { ChakraProvider } from '@chakra-ui/react';
import { telegramTheme } from './styles/telegramTheme';

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
      <ChakraProvider theme={telegramTheme}>
        <TelegramAppWrapper>
          <App />
        </TelegramAppWrapper>
      </ChakraProvider>
    </BrowserRouter>
  </React.StrictMode>
);
