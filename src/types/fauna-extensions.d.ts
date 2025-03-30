import 'faunadb';

// Расширяем типы из фауны, чтобы добавить поддержку нужных параметров
declare module 'faunadb' {
    interface ClientConfig {
        /**
         * API version for FaunaDB, e.g., '1', '4'
         */
        apiVersion?: string;

        /**
         * Domain for FaunaDB
         */
        domain?: string;

        /**
         * HTTP scheme for FaunaDB
         */
        scheme?: string;

        /**
         * Secret key for authenticating with FaunaDB
         */
        secret?: string;
    }
}