/**
 * Скрипт для запуска приложения с автоматическим созданием индексов
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔥 Запуск приложения с автоматическим созданием индексов...');

// Проверяем наличие файла firebase.indexes.json
const indexesPath = path.join(__dirname, '..', 'firestore.indexes.json');
if (!fs.existsSync(indexesPath)) {
    console.log('⚙️ Создание файла индексов Firestore...');
    // Запускаем скрипт создания индексов
    try {
        execSync('node scripts/create-firestore-indexes.js', { 
            stdio: 'inherit',
            cwd: path.join(__dirname, '..')
        });
    } catch (error) {
        console.warn('⚠️ Не удалось автоматически создать индексы');
        console.warn('   Приложение запустится, но некоторые функции могут работать некорректно.');
    }
}

console.log('🚀 Запуск React приложения...');
execSync('react-scripts start', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
});
