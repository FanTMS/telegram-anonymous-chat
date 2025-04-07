const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('Деплой индексов Firestore...');

// Путь к файлу индексов
const indexesPath = path.join(__dirname, '..', 'firestore.indexes.json');

// Проверка существования файла индексов
if (!fs.existsSync(indexesPath)) {
    console.error('❌ Файл индексов Firestore не найден!');
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

    // Команда для деплоя индексов
    console.log(`📤 Загрузка индексов в проект ${projectId}...`);
    execSync(`npx firebase deploy --only firestore:indexes --project=${projectId}`, {
        stdio: 'inherit'
    });

    console.log('✅ Индексы успешно загружены');
} catch (error) {
    console.error('❌ Ошибка при деплое индексов:', error.message);
    process.exit(1);
}
