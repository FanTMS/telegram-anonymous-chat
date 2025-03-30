// Кратко определяем функцию для обработки запросов
exports.handler = async (event) => {
    try {
        console.log('Setup Bot function called');

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Bot setup complete" })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
