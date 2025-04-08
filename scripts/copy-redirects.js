const fs = require('fs');
const path = require('path');

// Ensure build directory exists
const buildDir = path.join(__dirname, '../build');
if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
}

// Copy _redirects file
const redirectsSource = path.join(__dirname, '../public/_redirects');
const redirectsDest = path.join(buildDir, '_redirects');
fs.copyFileSync(redirectsSource, redirectsDest);

// Copy 404.html file
const notFoundSource = path.join(__dirname, '../public/404.html');
const notFoundDest = path.join(buildDir, '404.html');
fs.copyFileSync(notFoundSource, notFoundDest);

console.log('Redirect files copied successfully!'); 