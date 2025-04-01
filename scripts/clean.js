/**
 * Скрипт для очистки проекта и удаления временных файлов
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const ROOT_DIR = path.resolve(__dirname, '..');
const NODE_MODULES = path.join(ROOT_DIR, 'node_modules');
const PACKAGE_LOCK = path.join(ROOT_DIR, 'package-lock.json');
const BUILD_DIR = path.join(ROOT_DIR, 'build');
const CACHE_DIRS = [
    path.join(os.homedir(), '.npm'),
    path.join(ROOT_DIR, '.cache')
];

console.log('🧹 Начинаю очистку проекта...');

// Удаление node_modules
if (fs.existsSync(NODE_MODULES)) {
    console.log('📦 Удаление node_modules...');
    try {
        // В Windows иногда бывают проблемы с длинными путями
        if (process.platform === 'win32') {
            execSync(`rmdir /s /q "${NODE_MODULES}"`, { stdio: 'ignore' });
        } else {
            fs.rmSync(NODE_MODULES, { recursive: true, force: true });
        }
        console.log('✅ node_modules удален');
    } catch (error) {
        console.error('❌ Ошибка при удалении node_modules:', error.message);
    }
}

// Удаление package-lock.json
if (fs.existsSync(PACKAGE_LOCK)) {
    console.log('📄 Удаление package-lock.json...');
    try {
        fs.unlinkSync(PACKAGE_LOCK);
        console.log('✅ package-lock.json удален');
    } catch (error) {
        console.error('❌ Ошибка при удалении package-lock.json:', error.message);
    }
}

// Удаление директории сборки
if (fs.existsSync(BUILD_DIR)) {
    console.log('🏗️ Удаление директории build...');
    try {
        fs.rmSync(BUILD_DIR, { recursive: true, force: true });
        console.log('✅ Директория build удалена');
    } catch (error) {
        console.error('❌ Ошибка при удалении директории build:', error.message);
    }
}

// Очистка кэша npm (опционально)
const clearCache = process.argv.includes('--clear-cache');
if (clearCache) {
    console.log('🧼 Очистка кэша npm...');
    try {
        execSync('npm cache clean --force', { stdio: 'inherit' });
        console.log('✅ Кэш npm очищен');

        // Удаление дополнительных кэш-директорий
        for (const cacheDir of CACHE_DIRS) {
            if (fs.existsSync(cacheDir)) {
                try {
                    fs.rmSync(cacheDir, { recursive: true, force: true });
                    console.log(`✅ Директория ${cacheDir} удалена`);
                } catch (innerError) {
                    console.warn(`⚠️ Не удалось удалить ${cacheDir}:`, innerError.message);
                }
            }
        }
    } catch (error) {
        console.error('❌ Ошибка при очистке кэша npm:', error.message);
    }
}

console.log('');
console.log('🎉 Очистка завершена!');
console.log('');
console.log('Для установки зависимостей запустите:');
console.log('');
console.log('    npm install --legacy-peer-deps');
console.log('');
console.log('Или используйте:');
console.log('');
console.log('    install-deps.bat');
