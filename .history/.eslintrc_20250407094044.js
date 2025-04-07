module.exports = {
    "env": {
        "browser": true,
        "es2021": true,
        "node": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:react/recommended"
    ],
    "parserOptions": {
        "ecmaFeatures": {
            "jsx": true
        },
        "ecmaVersion": 12,
        "sourceType": "module"
    },
    "plugins": [
        "react"
    ],
    "rules": {
        "react/react-in-jsx-scope": "off",
        "react/prop-types": "off",
        "react/no-unescaped-entities": "off", // Отключаем предупреждения о неэкранированных кавычках
        "no-unused-vars": ["warn", {
            "varsIgnorePattern": "^_",
            "argsIgnorePattern": "^_",
            "caughtErrorsIgnorePattern": "^_"
        }] // Смягчаем предупреждения о неиспользуемых переменных
    },
    "globals": {
        "WebApp": "readonly" // Добавляем WebApp как глобальную переменную
    }
};
