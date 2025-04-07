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

    // Получаем и показываем индексы, которые будут созданы
    const indexesData = JSON.parse(fs.readFileSync(indexesPath, 'utf8'));

    console.log(`\n📋 Индексы, которые будут созданы (${indexesData.indexes.length}):`);
    indexesData.indexes.forEach((index, idx) => {
        console.log(`\n🔹 Индекс #${idx + 1}:`);
        console.log(`   Коллекция: ${index.collectionGroup}`);

        console.log('   Поля:');
        index.fields.forEach(field => {
            let fieldType = field.arrayConfig ? `ARRAY_CONTAINS (${field.arrayConfig})` :
                (field.order === 'ASCENDING' ? '↑ по возрастанию' : '↓ по убыванию');
            console.log(`     - ${field.fieldPath}: ${fieldType}`);
        });
    });

    // Запрашиваем подтверждение
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    readline.question('\n⚠️ Продолжить создание индексов? (y/n): ', (answer) => {
        readline.close();

        if (answer.toLowerCase() === 'y') {
            // Команда для деплоя индексов
            console.log(`\n📤 Загрузка индексов в проект ${projectId}...`);
            execSync(`npx firebase deploy --only firestore:indexes --project=${projectId}`, {
                stdio: 'inherit'
            });
            console.log('\n✅ Индексы успешно загружены');
        } else {
            console.log('\n❌ Операция отменена пользователем');
        }
    });
} catch (error) {
    console.error('❌ Ошибка при деплое индексов:', error.message);
    process.exit(1);
}
