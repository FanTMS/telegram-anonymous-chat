/**
 * Утилита для проверки запуска приложения
 */

import { app } from '../firebase';

export const checkAppStatus = () => {
  console.log('Приложение запущено успешно');
  
  // Проверка окружения
  console.log('Режим:', process.env.NODE_ENV);
  console.log('Базовый URL:', window.location.origin);
  
  // Проверка подключения к Firebase
  try {
    // Проверяем инициализацию Firebase
    const firebaseInitialized = !!app;
    console.log('Firebase инициализирован:', firebaseInitialized);
  } catch (error) {
    console.error('Ошибка проверки Firebase:', error);
  }
  
  return {
    status: 'running',
    timestamp: new Date().toISOString()
  };
};

export default checkAppStatus; 