/**
 * Общая конфигурация Firebase для использования во всем приложении
 */

export const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

/**
 * Проверяет конфигурацию Firebase на наличие всех необходимых полей
 * @param {Object} config - Конфигурация Firebase для проверки
 * @returns {boolean} - Результат проверки
 */
export const validateFirebaseConfig = (config) => {
  const missingFields = Object.entries(config)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingFields.length > 0) {
    console.error(`Missing Firebase config fields: ${missingFields.join(', ')}`);
    return false;
  }
  return true;
};
