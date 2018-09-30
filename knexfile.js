module.exports = {
    test: {
        client: 'postgresql',
        connection: {
            user: process.env.TEST_DB_USER || 'reservation_test',
            password: process.env.TEST_DB_PASSWORD || 'reservation_test',
            database: process.env.TEST_DB_NAME || 'reservation_test',
            host: process.env.TEST_DB_HOST || '127.0.0.1'
        },
        searchPath: ['knex', 'public'],
        pool: {
            min: 2,
            max: 10
        },
        migrations: {
            tableName: 'knex_migrations'
        }
    },
    production: {
        client: 'postgresql',
        connection: {
            user: process.env.DB_USER || 'reservation',
            password: process.env.DB_PASSWORD || 'reservation',
            database: process.env.DB_NAME || 'reservation',
            host: process.env.DB_HOST || '127.0.0.1'
        },
        searchPath: ['knex', 'public'],
        pool: {
            min: 2,
            max: 10
        },
        migrations: {
            tableName: 'knex_migrations'
        }
    }
};
