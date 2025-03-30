/**
 * Configuration file for environment variables and global settings
 */

// Environment variables
export const config = {
    // FaunaDB
    faunaSecret: process.env.FAUNA_SECRET || import.meta.env?.VITE_FAUNA_SECRET,

    // Telegram
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || import.meta.env?.VITE_TELEGRAM_BOT_TOKEN,
    adminTelegramId: process.env.ADMIN_TELEGRAM_ID || import.meta.env?.VITE_ADMIN_TELEGRAM_ID || '5394381166',

    // Application settings
    isProduction: process.env.NODE_ENV === 'production' || import.meta.env?.PROD === true,
    isDevelopment: process.env.NODE_ENV === 'development' || import.meta.env?.DEV === true,

    // Database preferences
    preferRemoteStorage: true, // Set to false to prefer localStorage over FaunaDB
};

// Helper function to check if we have FaunaDB credentials
export const hasFaunaCredentials = (): boolean => {
    return !!config.faunaSecret;
};

// Helper to determine if we're running in Netlify environment
export const isNetlifyEnvironment = (): boolean => {
    return typeof process !== 'undefined' && process.env?.NETLIFY === 'true';
};