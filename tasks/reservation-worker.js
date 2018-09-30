const amqp = require('amqplib');
const config = require('../config')[process.env.NODE_ENV];
const ReservationsModel = require('../app/models/Reservations');
const UsersModel = require('../app/models/Users');

(async () => {
    try {
        let connection;
        connection = await amqp.connect(config.rabbitMQ.endpoint);
        process.once('SIGINT', () => {
            connection.close();
        });

        const chanel = await connection.createChannel();
        const queue = config.rabbitMQ.reservationQueue;
        await chanel.assertQueue(queue, {durable: true});
        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);
        chanel.consume(queue, async function (msg) {
            console.log(" [x] Received %s", msg.content.toString());
            let data = JSON.parse(msg.content.toString());

            const model = new ReservationsModel();
            model.guests = data.guests;
            model.user_email = data.user_email;
            model.reservation_start = data.reservation_start;
            model.reservation_end = data.reservation_end;
            let user = new UsersModel();
            user.email = model.user_email;
            await user.findOne();
            model.user_id = user.id;

            let conflict = await model.isConflict();
            if (conflict instanceof Error || conflict) {
                await emitNotificationEvent({
                    message: "Reservation is not successful",
                    email: model.user_email
                });
            }

            if (!conflict) {
                let result = await model.save();

                if (result instanceof Error || !result) {
                    await emitNotificationEvent({
                        message: "Reservation is not successful",
                        email: model.user_email
                    });
                }

                if (result) {
                    await emitNotificationEvent({
                        message: "Reservation is successful",
                        email: model.user_email
                    });
                }
            }

            chanel.ack(msg);
        }, {noAck: false});
    } catch (e) {
        console.warn(e)
    }
})();

const emitNotificationEvent = async function (result) {
    let connection;
    try {
        connection = await amqp.connect(config.rabbitMQ.endpoint);
        const chanel = await connection.createChannel();
        const queue = config.rabbitMQ.notificationQueue;
        await chanel.assertQueue(queue, {durable: true});
        await chanel.sendToQueue(queue, new Buffer(JSON.stringify(result)), {persistent: true});
        await chanel.close();
        console.log("Message sent to queue : ", JSON.stringify(result));
    } catch (e) {
        console.warn(e.message);
    } finally {
        if (connection) {
            connection.close();
        }
    }
};