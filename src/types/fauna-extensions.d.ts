import 'faunadb';

// Расширяем типы из фауны, чтобы добавить поддержку apiVersion
declare module 'faunadb' {
    interface ClientConfig {
        /**
         * API version for FaunaDB, e.g., '1', '4'
         */
        apiVersion?: string;
    }
}