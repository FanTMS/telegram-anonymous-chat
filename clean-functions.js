import fs from 'fs';
import path from 'path';

// Путь к директории с функциями
const functionsDir = path.join(process.cwd(), 'netlify', 'functions');

console.log('Очистка устаревших JS файлов функций...');

try {
    // Получаем все CJS файлы
    const cjsFiles = fs.readdirSync(functionsDir)
        .filter(file => file.endsWith('.cjs'))
        .map(file => file.replace('.cjs', ''));

    // Удаляем соответствующие JS файлы
    for (const baseName of cjsFiles) {
        const jsFilePath = path.join(functionsDir, `${baseName}.js`);

        if (fs.existsSync(jsFilePath)) {
            console.log(`Удаление ${jsFilePath}`);
            fs.unlinkSync(jsFilePath);
        }
    }

    // Дополнительно: проверяем index.js и удаляем его, если есть index.cjs
    const indexJsPath = path.join(functionsDir, 'index.js');
    const indexCjsPath = path.join(functionsDir, 'index.cjs');

    if (fs.existsSync(indexJsPath) && fs.existsSync(indexCjsPath)) {
        console.log(`Удаление ${indexJsPath} (т.к. существует ${indexCjsPath})`);
        fs.unlinkSync(indexJsPath);
    }

    console.log('Очистка завершена успешно');
} catch (error) {
    console.error('Ошибка при очистке файлов:', error);
    process.exit(1);
}
