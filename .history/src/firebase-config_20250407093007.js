/**
 * Общая конфигурация Firebase для использования во всем приложении
 */

// Конфигурация Firebase
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
};

export default firebaseConfig;

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
