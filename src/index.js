import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { applyDeviceClasses, listenOrientationChanges } from './utils/deviceUtils';
import { BrowserRouter } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';

// Применяем классы устройства к документу
applyDeviceClasses();

// Слушаем изменения ориентации
listenOrientationChanges(() => {
    applyDeviceClasses();
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <BrowserRouter>
            <UserProvider>
                <App />
            </UserProvider>
        </BrowserRouter>
    </React.StrictMode>
);