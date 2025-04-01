/**
 * Скрипт для очистки node_modules и кэша npm
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

console.log('🧹 Начинаем очистку проекта...');

// Определяем, на какой ОС запущен скрипт
const isWindows = os.platform() === 'win32';

try {
    // Удаляем папку node_modules
    const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
        console.log('🗑️ Удаление node_modules...');

        if (isWindows) {
            // В Windows используем rimraf (если есть) или rd
            try {
                execSync('npx rimraf node_modules', { stdio: 'inherit' });
            } catch (e) {
                console.log('⚠️ Не удалось использовать rimraf, пробуем стандартные команды Windows...');
                execSync('rd /s /q node_modules', { stdio: 'inherit' });
            }
        } else {
            // В Unix-системах используем rm
            execSync('rm -rf node_modules', { stdio: 'inherit' });
        }

        console.log('✅ node_modules успешно удалены');
    } else {
        console.log('ℹ️ Папка node_modules не найдена');
    }

    // Очищаем кэш npm
    console.log('🧹 Очистка кэша npm...');
    execSync('npm cache clean --force', { stdio: 'inherit' });
    console.log('✅ Кэш npm очищен');

    // Удаляем папку build
    const buildPath = path.join(__dirname, '..', 'build');
    if (fs.existsSync(buildPath)) {
        console.log('🗑️ Удаление сборки...');

        if (isWindows) {
            try {
                execSync('npx rimraf build', { stdio: 'inherit' });
            } catch (e) {
                execSync('rd /s /q build', { stdio: 'inherit' });
            }
        } else {
            execSync('rm -rf build', { stdio: 'inherit' });
        }

        console.log('✅ Папка build успешно удалена');
    }

    // Удаляем .env.local если существует
    const envLocalPath = path.join(__dirname, '..', '.env.local');
    if (fs.existsSync(envLocalPath)) {
        fs.unlinkSync(envLocalPath);
        console.log('✅ Файл .env.local удален');
    }

    console.log('🔄 Создание чистого .env файла...');
    const envContent = `NODE_OPTIONS=--openssl-legacy-provider --no-deprecation --max-old-space-size=4096
GENERATE_SOURCEMAP=false
SKIP_PREFLIGHT_CHECK=true
ESLINT_NO_DEV_ERRORS=true
BROWSER=none
TSC_COMPILE_ON_ERROR=true

# Firebase конфигурация
REACT_APP_FIREBASE_API_KEY=AIzaSyCNpBazUWauF99zxWKvAwIJ0mbTsf6il8g
REACT_APP_FIREBASE_AUTH_DOMAIN=oleop-19cc2.firebaseapp.com
REACT_APP_FIREBASE_DATABASE_URL=https://oleop-19cc2-default-rtdb.firebaseio.com
REACT_APP_FIREBASE_PROJECT_ID=oleop-19cc2
REACT_APP_FIREBASE_STORAGE_BUCKET=oleop-19cc2.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=452609655600
REACT_APP_FIREBASE_APP_ID=1:452609655600:web:95c47ff9b3ea191f6fbef5
REACT_APP_FIREBASE_MEASUREMENT_ID=G-X4DP12TNSB
`;

    fs.writeFileSync(path.join(__dirname, '..', '.env'), envContent);
    console.log('✅ Создан новый .env файл');

    console.log('✨ Очистка завершена успешно. Теперь можно выполнить npm install и запустить проект с чистого листа.');
} catch (error) {
    console.error('❌ Ошибка при очистке:', error.message);
    process.exit(1);
}
