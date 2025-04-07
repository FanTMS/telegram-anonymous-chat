/**
 * Общая конфигурация Firebase для использования во всем приложении
 */

// Конфигурация Firebase
export const firebaseConfig = {
  apiKey: "AIzaSyC0eBiNqbL4CLC9mfA_qBwpM5gePWHGN9c",
  authDomain: "oleop-19cc2.firebaseapp.com",
  projectId: "oleop-19cc2",
  storageBucket: "oleop-19cc2.appspot.com",
  messagingSenderId: "452609655600",
  appId: "1:452609655600:web:95c47ff9b3ea191f6fbef5"
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
