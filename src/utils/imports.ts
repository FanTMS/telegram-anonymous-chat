// Вспомогательный файл для корректной обработки импортов
import { getSystemTheme } from './theme';

// Реэкспортируем функции для упрощения импортов
export { getSystemTheme };

// Функция для безопасного импорта
export const safeImport = async <T>(importFn: () => Promise<T>, fallback: T): Promise<T> => {
  try {
    return await importFn();
  } catch (error) {
    console.error('Error with import:', error);
    return fallback;
  }
};
