import React from 'react'
import { motion } from 'framer-motion'
import { Theme, useTheme } from '../utils/theme'

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, changeTheme } = useTheme()

  // Обработчик изменения темы
  const handleToggleTheme = () => {
    const newTheme: Theme = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark'
    changeTheme(newTheme)
  }

  // Иконка для текущей темы
  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return '☀️'
      case 'dark':
        return '🌙'
      case 'system':
        return '🖥️'
      default:
        return '☀️'
    }
  }

  // Текст для подсказки
  const getThemeTooltip = () => {
    switch (theme) {
      case 'light':
        return 'Светлая тема'
      case 'dark':
        return 'Темная тема'
      case 'system':
        return 'Системная тема'
      default:
        return 'Сменить тему'
    }
  }

  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleToggleTheme}
      className={`${className} relative p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400`}
      title={getThemeTooltip()}
      aria-label={getThemeTooltip()}
    >
      <span className="text-xl">{getThemeIcon()}</span>
    </motion.button>
  )
}

// Компонент для отображения меню выбора темы
export const ThemeSelector: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, changeTheme } = useTheme()

  const themes: { value: Theme; label: string; icon: string }[] = [
    { value: 'light', label: 'Светлая', icon: '☀️' },
    { value: 'dark', label: 'Темная', icon: '🌙' },
    { value: 'system', label: 'Системная', icon: '🖥️' }
  ]

  return (
    <div className={`${className} p-2 rounded-lg shadow-md border bg-white dark:bg-gray-800 dark:border-gray-700`}>
      <h3 className="text-sm font-medium mb-2 px-2 text-gray-700 dark:text-gray-300">Выберите тему</h3>
      <div className="space-y-1">
        {themes.map((t) => (
          <button
            key={t.value}
            onClick={() => changeTheme(t.value)}
            className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors
              ${theme === t.value
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
                : 'hover:bg-gray-100 text-gray-700 dark:hover:bg-gray-700 dark:text-gray-300'
              }`}
          >
            <span className="mr-2">{t.icon}</span>
            <span>{t.label}</span>
            {theme === t.value && (
              <span className="ml-auto">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
