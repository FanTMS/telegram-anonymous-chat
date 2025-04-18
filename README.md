# Telegram Anonymous Chat

## Установка и запуск

1. Клонируйте репозиторий
2. Установите зависимости: `npm install`
3. Запустите приложение: `npm start`

## Решение частых проблем

### Ошибки с атрибутами компонентов

Если вы видите предупреждения вида "Received `true` for a non-boolean attribute", убедитесь, что передаете строковые значения для атрибутов в styled-components:

```jsx
// Неправильно
<Button secondary={true}>Текст</Button>

// Правильно
<Button secondary="true">Текст</Button>

// Либо используйте transient props (рекомендуется)
<Button $secondary={true}>Текст</Button>
```

### Ошибка индексов Firestore

Если вы видите ошибку "The query requires an index", выполните следующие шаги:

1. Убедитесь, что вы залогинены в Firebase CLI: `npx firebase login`
2. Выполните команду: `npm run deploy-indexes`

### Ошибка прав доступа Firestore

Если вы видите ошибку "Missing or insufficient permissions":

1. Выполните команду: `npm run deploy-rules`

### Предупреждения WebApp

Предупреждения о неподдерживаемых методах Telegram WebApp можно игнорировать, если вы тестируете в браузере без среды Telegram или используете старую версию клиента Telegram.

## Полезные команды

- `npm start` - запуск приложения в режиме разработки
- `npm run build` - сборка приложения для продакшн
- `npm run deploy-rules` - загрузка правил безопасности Firestore
- `npm run deploy-indexes` - загрузка индексов Firestore

## Структура проекта

- `/src` - исходный код
  - `/components` - компоненты React
  - `/pages` - страницы приложения
  - `/services` - сервисы для работы с API
  - `/utils` - вспомогательные утилиты
- `/public` - статические файлы
- `/scripts` - вспомогательные скрипты
