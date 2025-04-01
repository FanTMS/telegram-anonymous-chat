/**
 * Скрипт для очистки проекта от временных файлов
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Начало очистки проекта...');

const foldersToRemove = [
    'node_modules/.cache',
    'build',
    '.netlify/build-cache',
];

// Удаление папок
foldersToRemove.forEach(folder => {
    const folderPath = path.join(__dirname, '..', folder);
    try {
        if (fs.existsSync(folderPath)) {
            console.log(`🗑️ Удаление ${folder}...`);
            fs.rmSync(folderPath, { recursive: true, force: true });
        }
    } catch (error) {
        console.error(`❌ Не удалось удалить ${folder}:`, error.message);
    }
});

// Очистка кеша npm
try {
    console.log('🧼 Очистка кеша npm...');
    execSync('npm cache clean --force', { stdio: 'inherit' });
} catch (error) {
    console.error('❌ Не удалось очистить кеш npm:', error.message);
}

console.log('✅ Очистка завершена!');
