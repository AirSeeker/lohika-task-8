exports.up = function (knex, Promise) {
    return Promise.all([
        knex.schema.createTable('tables', function (table) {
            table.increments('id').primary();
            table.integer('number').notNull().unsigned();
            table.integer('capacity').notNull().unsigned();
        }),
        knex.schema.createTable('users', function (table) {
            table.increments('id').primary();
            table.string('email').notNull();
        }),
        knex.schema.createTable('reservations', function (table) {
            table.increments('id').primary();
            table.integer('table_id').notNull();
            table.integer('user_id').notNull();
            table.dateTime('start').notNull();
            table.dateTime('end').notNull();
            table.integer('guests').notNull().unsigned();
            table.foreign('table_id').references('tables.id');
            table.foreign('user_id').references('users.id');
        }),
        knex.schema.createTable('reservation_has_order', function (table) {
            table.increments('id').primary();
            table.integer('reservation_id').notNull();
            table.string('order_uri').notNull();
            table.foreign('reservation_id').references('reservations.id');
        })
    ])
};

exports.down = function (knex, Promise) {
    return Promise.all([
        knex.schema.dropTable('reservation_has_order'),
        knex.schema.dropTable('reservations'),
        knex.schema.dropTable('tables'),
        knex.schema.dropTable('users'),
    ])
};
