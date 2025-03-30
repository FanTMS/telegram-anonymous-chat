import WebApp from '@twa-dev/sdk'
import React from 'react'
import { getItem, setItem } from './dbService'

// Экспортируем тип Theme для согласованности
export type Theme = 'light' | 'dark' | 'system'
// Определение ключа для хранения темы
const THEME_KEY = 'app_theme'

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

// Получение сохраненной пользовательской темы из хранилища
export const getSavedTheme = async (): Promise<Theme> => {
  try {
    const saved = await getItem(THEME_KEY);
    return (saved as Theme) || 'system';
  } catch (error) {
    console.error('Error getting saved theme:', error);
    return 'system';
  }
}

// Сохранение темы в хранилище
export const saveTheme = async (theme: Theme): Promise<void> => {
  try {
    await setItem(THEME_KEY, theme);
  } catch (error) {
    console.error('Error saving theme:', error);
  }
}

// Применяет тему
export const applyTheme = (theme: Theme): 'light' | 'dark' => {
  const actualTheme = theme === 'system' ? getSystemTheme() : theme;

  if (actualTheme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }

  return actualTheme;
}

// Создаем и экспортируем контекст темы
export const ThemeContext = React.createContext<{
  theme: Theme;
  currentTheme: 'light' | 'dark';
  changeTheme: (theme: Theme) => void;
}>({
  theme: 'system', // Начальное значение
  currentTheme: getSystemTheme(),
  changeTheme: async (theme) => {
    await saveTheme(theme);
  }
});

// Простой хук для использования контекста темы
export const useTheme = () => React.useContext(ThemeContext);
