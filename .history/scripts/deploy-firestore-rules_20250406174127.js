const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Деплой правил безопасности Firestore...');

// Путь к файлу правил Firestore
const rulesPath = path.join(__dirname, '..', 'firestore.rules');

// Проверка существования файла правил
if (!fs.existsSync(rulesPath)) {
    console.error('❌ Файл правил Firestore не найден!');
    process.exit(1);
}

try {
    // Получаем переменные окружения из .env файла
    const dotenvPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(dotenvPath)) {
        require('dotenv').config({ path: dotenvPath });
    }

    // ID проекта Firebase
    const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID || 'oleop-19cc2';

    // Команда для деплоя правил
    console.log(`📤 Загрузка правил в проект ${projectId}...`);
    execSync(`npx firebase deploy --only firestore:rules --project=${projectId}`, {
        stdio: 'inherit'
    });

    console.log('✅ Правила успешно загружены');
} catch (error) {
    console.error('❌ Ошибка при деплое правил:', error.message);
    process.exit(1);
}
