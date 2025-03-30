import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './utils/init' // Импортируем файл инициализации

// Инициализируем приложение после загрузки DOM
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
