import { storage, storageAPI } from './storage-wrapper';

/**
 * Этот файл реэкспортирует унифицированный интерфейс хранилища из storage-wrapper.ts
 * для обеспечения совместимости с существующим кодом.
 * 
 * Модуль storage-wrapper.ts содержит реализацию StorageWrapper, 
 * которая поддерживает Telegram WebApp Storage и запасные варианты хранения.
 */

// Экспортируем хранилище (экземпляр StorageWrapper) для использования в приложении
export { storage };

// Экспортируем storageAPI для совместимости с кодом, использующим localStorage API
export { storageAPI as compatStorage };

// Объект хранилища по умолчанию
export default storage;