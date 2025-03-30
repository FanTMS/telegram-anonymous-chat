const mongodb = require('./mongodb.cjs');
const setupBot = require('./setup-bot.cjs');
const telegramWebhook = require('./telegram-webhook.cjs');

exports.handler = async (event, context) => {
    // Извлекаем путь из URL
    const path = event.path.split('/.netlify/functions/')[1];

    // Направляем запрос на соответствующую функцию
    switch (path) {
        case 'mongodb':
            return mongodb.handler(event, context);
        case 'setup-bot':
            return setupBot.handler(event, context);
        case 'telegram-webhook':
            return telegramWebhook.handler(event, context);
        default:
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Function not found' })
            };
    }
};
