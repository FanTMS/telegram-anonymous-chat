/**
 * Скрипт для кроссплатформенного копирования файлов при сборке
 */
const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, '../public');
const destDir = path.join(__dirname, '../build');

// Убедимся, что целевая директория существует
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Список файлов для копирования
const filesToCopy = [
  '_redirects',
  '404.html'
];

// Копирование файлов
filesToCopy.forEach(file => {
  const sourcePath = path.join(sourceDir, file);
  const destPath = path.join(destDir, file);
  
  try {
    // Проверяем существование исходного файла
    if (fs.existsSync(sourcePath)) {
      // Копируем файл
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Файл ${file} успешно скопирован`);
    } else {
      console.warn(`⚠️ Файл ${file} не найден в исходной директории`);
    }
  } catch (error) {
    console.error(`❌ Ошибка при копировании файла ${file}:`, error);
  }
});

console.log('✅ Копирование файлов завершено'); 