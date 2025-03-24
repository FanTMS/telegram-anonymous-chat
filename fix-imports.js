const fs = require('fs');
const path = require('path');

// Функция для рекурсивного обхода директории
function walkSync(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      fileList = walkSync(filePath, fileList);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Функция для исправления импортов в файле
function fixImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Заменяем { WebApp } на WebApp в импортах из '@twa-dev/sdk'
    const oldImport = /import\s*{\s*WebApp\s*}\s*from\s*['"]@twa-dev\/sdk['"]/g;
    const newImport = `import WebApp from '@twa-dev/sdk'`;

    if (oldImport.test(content)) {
      content = content.replace(oldImport, newImport);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed import in ${filePath}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    return false;
  }
}

// Получаем список всех файлов .ts и .tsx в директории src
const allFiles = walkSync(path.join(__dirname, 'src'));

// Исправляем импорты в каждом файле
let fixedCount = 0;
allFiles.forEach(file => {
  if (fixImports(file)) {
    fixedCount++;
  }
});

console.log(`Fixed imports in ${fixedCount} files.`);
