import React, { createContext, useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import WebApp from '@twa-dev/sdk'
import { isAdmin, getUsers } from './utils/user'
import { db, telegramApi } from './utils/database'
import { prepareForProduction } from './utils/cleanup'
import App from './App'
import { NotificationProvider } from './components/NotificationProvider'

// Типы тем
export type Theme = 'light' | 'dark' | 'system'

// Функция для получения системной темы
export const getSystemTheme = (): 'light' | 'dark' => {
  try {
    if (WebApp && WebApp.colorScheme) {
      return WebApp.colorScheme as 'light' | 'dark'
    }
  } catch (error) {
    console.error('Error accessing WebApp:', error)
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

// Создаем контекст для темы
export const ThemeContext = createContext<{
  theme: Theme;
  currentTheme: 'light' | 'dark';
  changeTheme: (theme: Theme) => void;
}>({
  theme: 'system',
  currentTheme: 'light',
  changeTheme: () => { }
})

// Компонент-провайдер для темы
const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Получаем сохраненную тему или используем системную
  const getSavedTheme = (): Theme => {
    try {
      const saved = localStorage.getItem('app_theme')
      return (saved as Theme) || 'system'
    } catch (e) {
      return 'system'
    }
  }

  const [theme, setTheme] = useState<Theme>(getSavedTheme())
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(
    theme === 'system' ? getSystemTheme() : theme as 'light' | 'dark'
  )

  // Применяет тему к документу
  const applyTheme = (newTheme: 'light' | 'dark') => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    setCurrentTheme(newTheme)
  }

  // Обновляет тему и сохраняет выбор пользователя
  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    try {
      localStorage.setItem('app_theme', newTheme)
    } catch (e) {
      console.error('Failed to save theme setting', e)
    }

    if (newTheme === 'system') {
      applyTheme(getSystemTheme())
    } else {
      applyTheme(newTheme as 'light' | 'dark')
    }
  }

  // Применяем тему при загрузке компонента и слушаем изменения системной темы
  useEffect(() => {
    // При инициализации применяем текущую тему
    if (theme === 'system') {
      applyTheme(getSystemTheme())
    } else {
      applyTheme(theme as 'light' | 'dark')
    }

    // Добавляем слушатель изменения системной темы
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = () => {
      if (theme === 'system') {
        applyTheme(getSystemTheme())
      }
    }

    // Современный метод (для новых браузеров)
    mediaQuery.addEventListener('change', handleChange)

    // Убираем слушатель при размонтировании
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, currentTheme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// Инициализация Telegram API в тихом режиме
try {
  telegramApi.initialize().catch(err => {
    console.error('Telegram API initialization error (non-critical)', err)
  })
} catch (error) {
  console.error('Failed to initialize Telegram API', error)
}

// Рендерим приложение с обоими провайдерами
ReactDOM.createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <NotificationProvider>
      <App />
    </NotificationProvider>
  </ThemeProvider>
)
