import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { applyDeviceClasses, listenOrientationChanges } from './utils/deviceUtils';

// Применяем классы устройства к документу
applyDeviceClasses();

// Слушаем изменения ориентации
listenOrientationChanges(() => {
    applyDeviceClasses();
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);