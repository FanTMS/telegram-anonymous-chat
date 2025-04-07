/**
 * Скрипт для создания необходимых индексов Firestore
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Создаем конфигурационный файл для индексов
const createIndexesFile = () => {
    const indexesConfig = {
        "indexes": [
            {
                "collectionGroup": "searchQueue",
                "queryScope": "COLLECTION",
                "fields": [
                    {
                        "fieldPath": "timestamp",
                        "order": "ASCENDING"
                    }
                ]
            },
            {
                "collectionGroup": "chats",
                "queryScope": "COLLECTION",
                "fields": [
                    {
                        "fieldPath": "participants",
                        "arrayConfig": "CONTAINS"
                    },
                    {
                        "fieldPath": "createdAt",
                        "order": "DESCENDING"
                    }
                ]
            },
            {
                "collectionGroup": "messages",
                "queryScope": "COLLECTION",
                "fields": [
                    {
                        "fieldPath": "chatId",
                        "order": "ASCENDING"
                    },
                    {
                        "fieldPath": "timestamp",
                        "order": "ASCENDING"
                    }
                ]
            }
        ],
        "fieldOverrides": []
    };

    const indexesPath = path.join(__dirname, '..', 'firestore.indexes.json');
    fs.writeFileSync(indexesPath, JSON.stringify(indexesConfig, null, 2));
    
    console.log('✅ Файл конфигурации индексов создан');
    return indexesPath;
};

const deployIndexes = async () => {
    try {
        console.log('🔍 Начинаем создание необходимых индексов Firestore...');
        
        // Создаем файл конфигурации индексов
        const indexesPath = createIndexesFile();
        
        // Получаем переменные окружения из .env файла
        const dotenvPath = path.join(__dirname, '..', '.env');
        if (fs.existsSync(dotenvPath)) {
            require('dotenv').config({ path: dotenvPath });
        }
        
        // ID проекта Firebase
        const projectId = process.env.REACT_APP_FIREBASE_PROJECT_ID || 'oleop-19cc2';
        
        // Проверяем, установлен ли Firebase CLI
        console.log('🔍 Проверяем наличие Firebase CLI...');
        try {
            execSync('npx firebase --version', { stdio: 'ignore' });
        } catch (error) {
            console.log('📦 Firebase CLI не установлен, устанавливаем...');
            execSync('npm install -g firebase-tools', { stdio: 'inherit' });
        }
        
        // Деплоим индексы
        console.log(`📤 Деплоим индексы в проект ${projectId}...`);
        execSync(`npx firebase deploy --only firestore:indexes --project=${projectId}`, {
            stdio: 'inherit'
        });
        
        console.log('✅ Индексы успешно созданы и задеплоены');
        return true;
    } catch (error) {
        console.error('❌ Ошибка при создании индексов:', error.message);
        return false;
    }
};

// Запускаем скрипт
deployIndexes();
