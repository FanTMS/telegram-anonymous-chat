# Telegram Anonymous Chat

## Установка и запуск

### Локальная разработка

1. Клонируйте репозиторий:
```
git clone <ссылка-на-ваш-репозиторий>
cd telegram-anonymous-chat
```

2. Установите зависимости:
```
npm install
```

3. Запустите проект в режиме разработки:
```
npm start
```

### Сборка для продакшена

```
npm run build
```

Собранный проект будет находиться в папке `build/`.

## Деплой на Netlify

### Автоматический деплой через GitHub

1. Создайте аккаунт на [Netlify](https://www.netlify.com/)
2. Создайте новый сайт, выбрав "Import an existing project" и подключив репозиторий GitHub
3. Настройте следующие параметры сборки:
   - Build command: `npm run build`
   - Publish directory: `build`
4. Настройте переменные окружения в разделе "Site settings > Build & deploy > Environment":
   - NODE_VERSION: 18.17.1
   - NPM_FLAGS: --no-audit --legacy-peer-deps --force
   - REACT_APP_FIREBASE_API_KEY: (your Firebase API key)
   - REACT_APP_FIREBASE_AUTH_DOMAIN: (your Firebase auth domain)
   - REACT_APP_FIREBASE_PROJECT_ID: (your Firebase project ID)
   - REACT_APP_FIREBASE_STORAGE_BUCKET: (your Firebase storage bucket)
   - REACT_APP_FIREBASE_MESSAGING_SENDER_ID: (your Firebase messaging sender ID)
   - REACT_APP_FIREBASE_APP_ID: (your Firebase app ID)

### Деплой вручную

1. Соберите проект:
```
npm run build
```

2. Установите CLI Netlify:
```
npm install -g netlify-cli
```

3. Авторизуйтесь:
```
netlify login
```

4. Деплой:
```
netlify deploy --prod --dir=build
```

## Решение проблем

### Проблемы с зависимостями

Если возникают проблемы при установке зависимостей, попробуйте:
```
npm install --legacy-peer-deps --force
```

### Проблемы со сборкой

Если возникают проблемы со сборкой из-за конфликтов версий ajv и ajv-keywords:
```
npm run clean
npm install
npm run build
```

## Структура проекта

- `src/` - исходный код приложения
- `public/` - статические файлы
- `scripts/` - скрипты для сборки и настройки проекта
- `netlify/` - конфигурации для Netlify
