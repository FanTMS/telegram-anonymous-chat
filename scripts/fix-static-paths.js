/**
 * Скрипт для исправления путей к статическим ресурсам
 * Убеждается, что все пути в манифесте и HTML начинаются с /, а не с %PUBLIC_URL%
 */
const fs = require('fs');
const path = require('path');

console.log('🔧 Проверка и исправление путей к статическим ресурсам...');

// Проверка манифеста
const manifestPath = path.join(__dirname, '..', 'public', 'manifest.json');
if (fs.existsSync(manifestPath)) {
    try {
        console.log('🔍 Проверка путей в manifest.json');
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        let modified = false;

        // Исправляем пути в manfiest.json
        if (manifest.icons) {
            manifest.icons.forEach(icon => {
                if (icon.src && !icon.src.startsWith('/') && !icon.src.startsWith('http')) {
                    icon.src = '/' + icon.src;
                    modified = true;
                }
            });
        }

        if (modified) {
            fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
            console.log('✅ Пути в manifest.json исправлены');
        } else {
            console.log('✅ Все необходимые статические ресурсы в manifest.json настроены правильно');
        }
    } catch (error) {
        console.error('❌ Ошибка при обработке manifest.json:', error);
    }
}

// Проверка HTML файлов в public
const publicDir = path.join(__dirname, '..', 'public');
const htmlFiles = fs.readdirSync(publicDir).filter(file => file.endsWith('.html'));

htmlFiles.forEach(file => {
    const htmlPath = path.join(publicDir, file);
    try {
        console.log(`🔍 Проверка путей в ${file}`);
        let content = fs.readFileSync(htmlPath, 'utf8');
        let modified = false;

        // Заменяем ссылки на статические ресурсы, убеждаясь, что они начинаются с /
        const resourcePatterns = [
            { regex: /href\s*=\s*["']((?!https?:|\/)[^"']+)["']/g, replace: 'href="/$1"' },
            { regex: /src\s*=\s*["']((?!https?:|\/)[^"']+)["']/g, replace: 'src="/$1"' }
        ];

        resourcePatterns.forEach(pattern => {
            if (pattern.regex.test(content)) {
                content = content.replace(pattern.regex, pattern.replace);
                modified = true;
            }
        });

        if (modified) {
            fs.writeFileSync(htmlPath, content);
            console.log(`✅ Пути в ${file} исправлены`);
        } else {
            console.log(`✅ Все пути в ${file} настроены правильно`);
        }
    } catch (error) {
        console.error(`❌ Ошибка при обработке ${file}:`, error);
    }
});

console.log('✅ Проверка и исправление путей к статическим ресурсам завершены');
