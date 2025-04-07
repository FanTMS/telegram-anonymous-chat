/**
 * Реэкспорт Firebase из основного файла инициализации
 * для предотвращения дублирования инициализации
 */
import { app, db, auth, storage } from '../firebase';

// Реэкспортируем сервисы
export { app, db, auth, storage };

/**
 * Проверяет соединение с Firebase перед поиском собеседника
 * @returns {Promise<boolean>} Результат проверки соединения
 */
export const checkFirebaseConnection = async () => {
  try {
    // Пробуем получить любой документ из Firebase, чтобы проверить соединение
    const testRef = doc(db, "system", "connection_test");
    await getDoc(testRef);
    return true;
  } catch (error) {
    console.error("Ошибка при проверке соединения с Firebase:", error);
    return false;
  }
};

export default { app, db, auth, storage, checkFirebaseConnection };
