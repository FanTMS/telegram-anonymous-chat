exports.handler = async (event, context) => {
    try {
        console.log('Telegram webhook called');

        // Проверяем метод запроса
        if (event.httpMethod !== 'POST') {
            return {
                statusCode: 405,
                body: JSON.stringify({ error: 'Method Not Allowed' })
            };
        }

        // Обработка данных от Telegram
        const data = JSON.parse(event.body);
        console.log('Received webhook data:', JSON.stringify(data));

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Webhook processed" })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
