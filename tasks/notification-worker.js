const amqp = require('amqplib');
const config = require('../config')[process.env.NODE_ENV];
const nodeMailer = require('nodemailer');

(async () => {
    try {
        let connection;
        connection = await amqp.connect(config.rabbitMQ.endpoint);
        process.once('SIGINT', () => {
            connection.close();
        });

        const chanel = await connection.createChannel();
        const queue = config.rabbitMQ.notificationQueue;
        await chanel.assertQueue(queue, {durable: true});
        console.log(" [*] Waiting for messages in %s. To exit press CTRL+C", queue);
        chanel.consume(queue, async function (msg) {
            console.log(" [x] Received %s", msg.content.toString());
            await sendEmailTo(JSON.parse(msg.content.toString()));
            chanel.ack(msg);
        }, {noAck: false});
    } catch (e) {
        console.warn(e)
    }
})();


function sendEmailTo(data) {
    nodeMailer.createTestAccount((err, account) => {

        let transporter = nodeMailer.createTransport({
            host: 'smtp.ethereal.email', port: 587, secure: false,
            auth: {
                user: account.user,
                pass: account.pass
            }
        });

        let mailOptions = {
            to: data.email,
            subject: 'Reservation',
            text: data.message
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log('Message sent: %s', info.messageId);
            console.log('Preview URL: %s', nodeMailer.getTestMessageUrl(info));
        });
    });
}
