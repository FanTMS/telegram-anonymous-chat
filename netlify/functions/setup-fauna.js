const faunadb = require('faunadb');
const q = faunadb.query;

/**
 * This function sets up the necessary FaunaDB resources (collections and indexes)
 * required for the Telegram Mini-app integration.
 */
exports.handler = async (event, context) => {
    // Check authorization
    const authHeader = event.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_API_KEY}`) {
        return {
            statusCode: 401,
            body: JSON.stringify({ message: 'Unauthorized' })
        }
    }

    try {
        // Initialize FaunaDB client with admin key
        const faunaSecret = process.env.FAUNA_ADMIN_KEY;
        if (!faunaSecret) {
            return {
                statusCode: 500,
                body: JSON.stringify({ message: 'FAUNA_ADMIN_KEY not configured' })
            }
        }

        const client = new faunadb.Client({
            secret: faunaSecret,
            domain: 'db.fauna.com',
            scheme: 'https',
        });

        const results = [];

        // Create Collections
        try {
            await client.query(q.CreateCollection({ name: 'store_data' }));
            results.push('Created collection: store_data');
        } catch (err) {
            if (err.description === 'Collection already exists.') {
                results.push('Collection already exists: store_data');
            } else {
                throw err;
            }
        }

        try {
            await client.query(q.CreateCollection({ name: 'user_currency' }));
            results.push('Created collection: user_currency');
        } catch (err) {
            if (err.description === 'Collection already exists.') {
                results.push('Collection already exists: user_currency');
            } else {
                throw err;
            }
        }

        try {
            await client.query(q.CreateCollection({ name: 'user_purchases' }));
            results.push('Created collection: user_purchases');
        } catch (err) {
            if (err.description === 'Collection already exists.') {
                results.push('Collection already exists: user_purchases');
            } else {
                throw err;
            }
        }

        try {
            await client.query(q.CreateCollection({ name: 'users' }));
            results.push('Created collection: users');
        } catch (err) {
            if (err.description === 'Collection already exists.') {
                results.push('Collection already exists: users');
            } else {
                throw err;
            }
        }

        try {
            await client.query(q.CreateCollection({ name: 'chats' }));
            results.push('Created collection: chats');
        } catch (err) {
            if (err.description === 'Collection already exists.') {
                results.push('Collection already exists: chats');
            } else {
                throw err;
            }
        }

        // Create Indexes
        try {
            await client.query(
                q.CreateIndex({
                    name: 'store_items_by_type',
                    source: q.Collection('store_data'),
                    terms: [{ field: ['data', 'type'] }]
                })
            );
            results.push('Created index: store_items_by_type');
        } catch (err) {
            if (err.description === 'Index already exists.') {
                results.push('Index already exists: store_items_by_type');
            } else {
                throw err;
            }
        }

        try {
            await client.query(
                q.CreateIndex({
                    name: 'user_currency_by_id',
                    source: q.Collection('user_currency'),
                    terms: [{ field: ['data', 'userId'] }]
                })
            );
            results.push('Created index: user_currency_by_id');
        } catch (err) {
            if (err.description === 'Index already exists.') {
                results.push('Index already exists: user_currency_by_id');
            } else {
                throw err;
            }
        }

        try {
            await client.query(
                q.CreateIndex({
                    name: 'user_purchases_by_id',
                    source: q.Collection('user_purchases'),
                    terms: [{ field: ['data', 'userId'] }]
                })
            );
            results.push('Created index: user_purchases_by_id');
        } catch (err) {
            if (err.description === 'Index already exists.') {
                results.push('Index already exists: user_purchases_by_id');
            } else {
                throw err;
            }
        }

        try {
            await client.query(
                q.CreateIndex({
                    name: 'user_by_id',
                    source: q.Collection('users'),
                    terms: [{ field: ['data', 'id'] }]
                })
            );
            results.push('Created index: user_by_id');
        } catch (err) {
            if (err.description === 'Index already exists.') {
                results.push('Index already exists: user_by_id');
            } else {
                throw err;
            }
        }

        try {
            await client.query(
                q.CreateIndex({
                    name: 'user_by_telegram_id',
                    source: q.Collection('users'),
                    terms: [{ field: ['data', 'telegramData', 'telegramId'] }]
                })
            );
            results.push('Created index: user_by_telegram_id');
        } catch (err) {
            if (err.description === 'Index already exists.') {
                results.push('Index already exists: user_by_telegram_id');
            } else {
                throw err;
            }
        }

        try {
            await client.query(
                q.CreateIndex({
                    name: 'chat_by_id',
                    source: q.Collection('chats'),
                    terms: [{ field: ['data', 'id'] }]
                })
            );
            results.push('Created index: chat_by_id');
        } catch (err) {
            if (err.description === 'Index already exists.') {
                results.push('Index already exists: chat_by_id');
            } else {
                throw err;
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'FaunaDB setup completed successfully',
                results
            })
        };
    } catch (error) {
        console.error('Error setting up FaunaDB:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error setting up FaunaDB',
                error: error.message
            })
        };
    }
};