/**
 * Скрипт для исправления зависимостей перед сборкой на Netlify
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

console.log('🔧 Подготовка к сборке...');
console.log(`📊 Используется Node.js ${process.version}`);
console.log(`💻 Операционная система: ${os.platform()}`);

// Проверяем переменные окружения Firebase (только их наличие, не значения)
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
    // Устанавливаем cross-env глобально для совместимости
    console.log('🔄 Установка cross-env глобально...');
    execSync('npm install -g cross-env', { stdio: 'inherit' });

    console.log('📦 Подготовка переменных окружения...');
    // Устанавливаем необходимые переменные окружения 
    process.env.NODE_OPTIONS = '--openssl-legacy-provider --no-deprecation';
    process.env.GENERATE_SOURCEMAP = 'false';

    // Создаем .env файл для сборки
    let envContent = `
GENERATE_SOURCEMAP=false
SKIP_PREFLIGHT_CHECK=true
TSC_COMPILE_ON_ERROR=true
BROWSER=none
`;

    // Добавляем тестовые переменные Firebase если реальных нет
    const hasMissingFirebaseVars = firebaseEnvVars.some(varName => !process.env[varName]);
    if (hasMissingFirebaseVars) {
        console.log('⚠️ Некоторые переменные Firebase отсутствуют. Добавление тестовых значений для сборки...');
        envContent += `
REACT_APP_FIREBASE_API_KEY=test-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=test-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=test-project
REACT_APP_FIREBASE_STORAGE_BUCKET=test-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456
`;
    } else {
        // Добавляем все переменные Firebase из переменных окружения
        for (const varName of firebaseEnvVars) {
            if (process.env[varName]) {
                envContent += `${varName}=${process.env[varName]}\n`;
            }
        }
    }

    fs.writeFileSync(path.join(process.cwd(), '.env'), envContent);
    console.log('✅ Файл .env создан');

    // Исправляем package.json, чтобы убрать конфликт с ajv
    console.log('🔧 Временно модифицируем package.json для разрешения конфликта ajv...');
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = require(packageJsonPath);

    // Сохраняем оригинальное состояние
    const originalResolutions = packageJson.resolutions ? { ...packageJson.resolutions } : {};
    const originalOverrides = packageJson.overrides ? { ...packageJson.overrides } : {};

    // Удаляем конфликтующие настройки
    delete packageJson.resolutions;
    delete packageJson.overrides;

    // Записываем обновленный package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4));

    console.log('📦 Установка совместимых версий ajv и ajv-keywords...');
    execSync('npm install ajv@6.12.6 ajv-keywords@3.5.2 --save-exact', { stdio: 'inherit' });

    console.log('🛠 Выполнение команды сборки...');
    execSync('npx react-scripts build', {
        stdio: 'inherit',
        env: {
            ...process.env
        }
    });

    // Добавим проверку и копирование _redirects
    console.log('🔄 Проверка наличия файла _redirects...');
    const redirectsPath = path.join(__dirname, '..', 'public', '_redirects');
    const buildRedirectsPath = path.join(__dirname, '..', 'build', '_redirects');

    if (fs.existsSync(redirectsPath)) {
        console.log('📄 Копирование _redirects в директорию сборки...');
        fs.copyFileSync(redirectsPath, buildRedirectsPath);
    } else {
        console.log('⚠️ Файл _redirects не найден, создаем новый...');
        fs.writeFileSync(buildRedirectsPath, '/* /index.html 200');
    }

    console.log('✅ Файл _redirects добавлен в директорию сборки');

    // Восстанавливаем package.json
    console.log('🔄 Восстанавливаем оригинальный package.json...');
    packageJson.resolutions = originalResolutions;
    packageJson.overrides = originalOverrides;
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4));

    console.log('✅ Сборка успешно завершена!');
} catch (error) {
    console.error('❌ Ошибка при сборке:', error.message);

    // Пытаемся получить более подробную информацию об ошибке
    console.error('🔍 Попытка получить расширенную информацию об ошибке...');
    try {
        // Проверяем состояние файлов проекта
        const isWindows = os.platform() === 'win32';
        if (isWindows) {
            execSync('dir', { stdio: 'inherit' });
        } else {
            execSync('ls -la', { stdio: 'inherit' });
        }

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
        if (isWindows) {
            if (fs.existsSync('node_modules')) {
                console.log('node_modules существует');
                execSync('dir node_modules /b | find /c /v ""', { stdio: 'inherit' });
            } else {
                console.log('node_modules не найден');
            }
        } else {
            execSync('ls -la node_modules | wc -l', { stdio: 'inherit' });
        }

    } catch (debugError) {
        console.error('Ошибка при сборе отладочной информации:', debugError);
    }

    process.exit(1);
}
