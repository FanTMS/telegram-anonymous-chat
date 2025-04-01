/**
 * Скрипт для исправления зависимостей перед сборкой на Netlify
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔧 Подготовка к сборке для Netlify...');

// Проверяем версию Node.js
console.log(`📊 Используется Node.js ${process.version}`);

// Логирование переменных окружения Firebase (только их наличие, не значения)
const firebaseEnvVars = [
    'REACT_APP_FIREBASE_API_KEY',
    'REACT_APP_FIREBASE_AUTH_DOMAIN',
    'REACT_APP_FIREBASE_PROJECT_ID',
    'REACT_APP_FIREBASE_STORAGE_BUCKET',
    'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
    'REACT_APP_FIREBASE_APP_ID'
];

console.log('🔍 Проверка переменных окружения Firebase:');
firebaseEnvVars.forEach(varName => {
    console.log(`  - ${varName}: ${process.env[varName] ? 'определена' : 'НЕ ОПРЕДЕЛЕНА'}`);
});

try {
    // Устанавливаем cross-env глобально для Netlify
    console.log('🔄 Установка cross-env глобально...');
    execSync('npm install -g cross-env', { stdio: 'inherit' });

    console.log('📦 Подготовка переменных окружения...');
    // Устанавливаем необходимые переменные окружения 
    process.env.NODE_OPTIONS = '--openssl-legacy-provider --no-deprecation';
    process.env.GENERATE_SOURCEMAP = 'false';

    // Создаем .env файл для сборки с переменными Firebase
    let envContent = `
GENERATE_SOURCEMAP=false
SKIP_PREFLIGHT_CHECK=true
TSC_COMPILE_ON_ERROR=true
BROWSER=none
`;

    // Добавляем все переменные Firebase из переменных окружения
    for (const varName of firebaseEnvVars) {
        if (process.env[varName]) {
            envContent += `${varName}=${process.env[varName]}\n`;
        }
    }

    fs.writeFileSync(path.join(process.cwd(), '.env'), envContent);
    console.log('✅ Файл .env создан со всеми необходимыми переменными');

    console.log('📦 Установка совместимых версий ajv и ajv-keywords...');
    execSync('npm install ajv@6.12.6 ajv-keywords@3.5.2 --save-exact', { stdio: 'inherit' });

    console.log('🛠 Выполнение команды сборки...');
    // Запускаем сборку с полным выводом логов для отладки
    execSync('npx react-scripts build', {
        stdio: 'inherit',
        env: {
            ...process.env
        }
    });
    console.log('✅ Сборка успешно завершена!');
} catch (error) {
    console.error('❌ Ошибка при сборке:', error.message);

    // Пытаемся получить более подробную информацию об ошибке
    console.error('🔍 Попытка получить расширенную информацию об ошибке...');
    try {
        // Показываем наличие файла package.json
        execSync('ls -la', { stdio: 'inherit' });

        // Проверяем содержимое файла .env (без показа значений)
        console.log('📄 Содержимое файла .env (только имена переменных):');
        const envFileContent = fs.existsSync('.env') ?
            fs.readFileSync('.env', 'utf8').split('\n').map(line => {
                const [name] = line.split('=');
                return name;
            }).join('\n') : 'Файл .env не найден';
        console.log(envFileContent);

        // Проверяем состояние node_modules
        console.log('📦 Проверка node_modules:');
        execSync('ls -la node_modules | wc -l', { stdio: 'inherit' });

    } catch (debugError) {
        console.error('Ошибка при сборе отладочной информации:', debugError);
    }

    process.exit(1);
}
