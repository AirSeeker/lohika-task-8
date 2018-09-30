module.exports = {
    test: {
        ordersEndpoint: process.env.TEST_ORDER_ENDPOINT || 'http://localhost:8001',
        rabbitMQ: {
            endpoint: process.env.TEST_RMQ_EP || 'amqp://localhost',
            notificationQueue: process.env.TEST_RMQ_NQ || 'notifications',
            reservationQueue: process.env.TEST_RMQ_RQ || 'reservations',
        }
    },
    production: {
        ordersEndpoint: process.env.ORDER_ENDPOINT || 'http://localhost:8001',
        rabbitMQ: {
            endpoint: process.env.RMQ_EP || 'amqp://localhost',
            notificationQueue: process.env.RMQ_NQ || 'notifications',
            reservationQueue: process.env.RMQ_RQ || 'reservations',
        }
    }
};
