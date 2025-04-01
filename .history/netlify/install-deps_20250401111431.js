/**
 * Скрипт для установки зависимостей в среде Netlify
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔧 Подготовка зависимостей для Netlify...');

try {
    // Проверяем окружение
    console.log(`📊 Используется Node.js ${process.version}`);
    console.log(`📊 Директория: ${process.cwd()}`);
    
    // Устанавливаем cross-env глобально
    console.log('🔄 Установка cross-env глобально...');
    execSync('npm install -g cross-env', { stdio: 'inherit' });
    
    // Создаем простой файл .npmrc для Netlify
    const npmrcContent = `
legacy-peer-deps=true
engine-strict=false
fund=false
audit=false
`;
    fs.writeFileSync('.npmrc', npmrcContent);
    
    console.log('✅ Зависимости подготовлены!');
} catch (error) {
    console.error('❌ Ошибка при подготовке зависимостей:', error);
}
