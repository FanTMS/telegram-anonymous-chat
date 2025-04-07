/**
 * Инициализация проекта - создание всех необходимых ресурсов и файлов
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Инициализация проекта...');

// Проверяем наличие пакета canvas
try {
    require.resolve('canvas');
    console.log('✅ Пакет canvas установлен');
} catch (e) {
    console.log('📦 Установка пакета canvas...');
    execSync('npm install --save-dev canvas', { stdio: 'inherit' });
}

// Запускаем создание логотипов
try {
    console.log('🖼️ Создание логотипов приложения...');
    execSync('node scripts/create-logo.js', { stdio: 'inherit' });
} catch (e) {
    console.error('❌ Ошибка при создании логотипов:', e.message);
}

// Запускаем создание индексов Firebase
try {
    console.log('🔍 Создание индексов Firebase...');
    execSync('node scripts/create-firestore-indexes.js', { stdio: 'inherit' });
} catch (e) {
    console.error('❌ Ошибка при создании индексов Firebase:', e.message);
}

console.log('✅ Инициализация проекта завершена успешно!');
console.log('🚀 Для запуска проекта выполните команду: npm start');
