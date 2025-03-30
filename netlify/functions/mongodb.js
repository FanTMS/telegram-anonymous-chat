const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'telegram-anonymous-chat';

let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) {
        return cachedDb;
    }

    const client = await MongoClient.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    const db = client.db(DB_NAME);
    cachedDb = db;
    return db;
}

exports.handler = async (event, context) => {
    // Make sure we don't process webhooks
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // Parse the JSON body
        const data = JSON.parse(event.body);
        const { operation, collection, payload, query } = data;

        // Connect to the database
        const db = await connectToDatabase();

        let result;

        // Handle different operations
        switch (operation) {
            case 'get':
                result = await db.collection(collection).findOne(query || {});
                break;
            case 'getAll':
                result = await db.collection(collection).find(query || {}).toArray();
                break;
            case 'set':
                result = await db.collection(collection).updateOne(
                    { _id: payload._id || payload.id },
                    { $set: payload },
                    { upsert: true }
                );
                break;
            case 'delete':
                result = await db.collection(collection).deleteOne(query);
                break;
            default:
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Invalid operation' })
                };
        }

        return {
            statusCode: 200,
            body: JSON.stringify(result)
        };
    } catch (error) {
        console.error('Database error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Database operation failed' })
        };
    }
};
