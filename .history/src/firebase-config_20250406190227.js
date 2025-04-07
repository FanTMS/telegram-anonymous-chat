/**
 * Общая конфигурация Firebase для использования во всем приложении
 */

// Конфигурация Firebase
export const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyC0eBiNqbL4CLC9mfA_qBwpM5gePWHGN9c",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "oleop-19cc2.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "oleop-19cc2",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "oleop-19cc2.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "452609655600",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:452609655600:web:95c47ff9b3ea191f6fbef5"
};

/**
 * Проверяет конфигурацию Firebase на наличие всех необходимых полей
 * @param {Object} config - Конфигурация Firebase для проверки
 * @returns {boolean} - Результат проверки
 */
export const validateFirebaseConfig = (config) => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingFields = [];
  
  for (const field of requiredFields) {
    if (!config[field] || config[field] === "undefined") {
      missingFields.push(field);
    }
  }

  if (missingFields.length > 0) {
    console.error(`ОШИБКА КОНФИГУРАЦИИ FIREBASE: Отсутствуют обязательные поля: ${missingFields.join(', ')}`);
    return false;
  }
  
  return true;
};
