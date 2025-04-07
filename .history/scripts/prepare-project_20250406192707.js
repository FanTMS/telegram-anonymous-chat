/**
 * Комплексная подготовка проекта перед запуском
 * Запускает все необходимые скрипты для настройки окружения
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Подготовка проекта к запуску...');

// Директории для проверки и создания
const directories = [
  path.join(__dirname, '..', 'public'),
  path.join(__dirname, '..', 'src', 'assets')
];

// Создаем необходимые директории
directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log(`📁 Создание директории: ${path.relative(path.join(__dirname, '..'), dir)}`);
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Запуск скрипта создания логотипов
console.log('🖼️ Создание логотипов...');
try {
  execSync('node scripts/create-simple-logo.js', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
} catch (error) {
  console.error('⚠️ Не удалось создать логотипы:', error.message);
}

// Запуск скрипта исправления путей
console.log('🔧 Исправление путей к ресурсам...');
try {
  execSync('node scripts/fix-static-paths.js', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
} catch (error) {
  console.error('⚠️ Не удалось исправить пути:', error.message);
}

console.log('✅ Подготовка проекта успешно завершена!');
console.log('🚀 Для запуска проекта выполните команду: npm start');
