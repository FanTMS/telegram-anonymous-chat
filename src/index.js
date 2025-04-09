import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App, { Root } from './App';
import { applyDeviceClasses, listenOrientationChanges } from './utils/deviceUtils';
import { BrowserRouter } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';

// Добавляем обработчик для диагностики ошибок рендеринга
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM полностью загружен');
});

window.addEventListener('error', (event) => {
    console.error('Глобальная ошибка:', event.error);
    // Отображаем сообщение об ошибке в DOM, если React не смог отрендерить
    if (!document.getElementById('root').hasChildNodes()) {
        const errorElement = document.createElement('div');
        errorElement.innerHTML = `
            <div style="padding: 20px; color: red; text-align: center;">
                <h2>Произошла ошибка при запуске приложения</h2>
                <p>${event.error?.message || 'Неизвестная ошибка'}</p>
                <button onclick="window.location.reload()">Перезагрузить</button>
            </div>
        `;
        document.getElementById('root').appendChild(errorElement);
    }
});

// Применяем классы устройства к документу
applyDeviceClasses();

// Слушаем изменения ориентации
listenOrientationChanges(() => {
    applyDeviceClasses();
});

const root = ReactDOM.createRoot(document.getElementById('root'));
try {
    root.render(
        <React.StrictMode>
            <BrowserRouter>
                <UserProvider>
                    <App />
                </UserProvider>
            </BrowserRouter>
        </React.StrictMode>
    );
    console.log('Приложение успешно отрендерено');
} catch (error) {
    console.error('Ошибка при рендеринге:', error);
    document.getElementById('root').innerHTML = `
        <div style="padding: 20px; color: red; text-align: center;">
            <h2>Не удалось запустить приложение</h2>
            <p>${error.message}</p>
            <button onclick="window.location.reload()">Перезагрузить</button>
        </div>
    `;
}