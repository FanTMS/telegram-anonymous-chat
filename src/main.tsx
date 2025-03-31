import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './main.css'
import InitApp from './InitApp'

// Для отслеживания времени загрузки
console.time('⏱️ app-initialization');

// Инициализируем приложение
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <InitApp />
  </React.StrictMode>
)

// Логируем время загрузки
console.timeEnd('⏱️ app-initialization');
