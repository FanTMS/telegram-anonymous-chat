/**
 * Скрипт для публикации правил Firestore
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Путь к файлу с правилами Firestore
const rulesPath = path.join(__dirname, '..', 'firestore.rules');

try {
    console.log('📋 Проверка файла правил Firestore...');
    if (!fs.existsSync(rulesPath)) {
        console.error('❌ Файл правил Firestore не найден!');
        process.exit(1);
    }

    // Читаем ID проекта из переменных окружения или конфигурационного файла
    let projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID;

    if (!projectId) {
        try {
            // Попытка чтения из .env файла
            const envPath = path.join(__dirname, '..', '.env');
            if (fs.existsSync(envPath)) {
                const envContent = fs.readFileSync(envPath, 'utf8');
                const match = envContent.match(/REACT_APP_FIREBASE_PROJECT_ID=(.+)/);
                if (match && match[1]) {
                    projectId = match[1].trim();
                }
            }
        } catch (envError) {
            console.warn('⚠️ Не удалось прочитать .env файл:', envError.message);
        }
    }

    // Если ID проекта все еще не найден, используем значение по умолчанию
    if (!projectId) {
        projectId = 'oleop-19cc2';
        console.warn(`⚠️ ID проекта не найден, используем значение по умолчанию: ${projectId}`);
    }

    console.log(`🔥 Публикация правил Firestore для проекта: ${projectId}`);

    // Проверяем наличие Firebase CLI
    try {
        execSync('npx firebase --version', { stdio: 'ignore' });
    } catch (error) {
        console.log('📦 Firebase CLI не установлен, устанавливаем...');
        execSync('npm install -g firebase-tools', { stdio: 'inherit' });
    }

    // Публикуем правила
    console.log('🚀 Публикация правил...');
    execSync(`npx firebase deploy --only firestore:rules --project=${projectId}`, {
        stdio: 'inherit'
    });

    console.log('✅ Правила Firestore успешно опубликованы!');
} catch (error) {
    console.error('❌ Ошибка при публикации правил Firestore:', error.message);
    process.exit(1);
}
