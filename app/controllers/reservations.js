const ReservationsModel = require('../models/Reservations');
const amqp = require('amqplib');
const config = require('../../config')[process.env.NODE_ENV];

class Reservations {
    static async createReservation(req, res) {
        const model = new ReservationsModel();
        if (model.validate(req.body)) {
            const result = {
                guests: model.guests,
                user_email: model.user_email,
                reservation_start: model.reservation_start,
                reservation_end: model.reservation_end
            };
            let connection;
            try {
                connection = await amqp.connect(config.rabbitMQ.endpoint);
                const chanel = await connection.createChannel();
                const queue = config.rabbitMQ.reservationQueue;
                await chanel.assertQueue(queue, {durable: true});
                await chanel.sendToQueue(queue, new Buffer(JSON.stringify(result)), {persistent: true});
                await chanel.close();
            } catch (e) {
                console.warn(e.message);
            } finally {
                if (connection) {
                    connection.close();
                }
            }

            return res.send();
        }
        return res.status(400).send();
    }

    static async getReservationInfo(req, res) {
        const model = new ReservationsModel();
        if (!req.params.reservation_id || !model.validateId(req.params.reservation_id)) {
            return res.status(400).send();
        }

        const result = await model.findOne();
        if (result) {
            return res.status(200).send(result);
        }

        return res.status(404).send();
    }

    static async updateReservation(req, res) {
        const model = new ReservationsModel();
        if (!model.validateId(req.params.reservation_id)) {
            return res.status(400).send();
        }

        if (model.validate(req.body)) {
            const result = await model.findOne();
            if (!result) {
                return res.status(404).send();
            }

            let conflict = await model.isConflict();
            if (conflict) {
                return res.status(409).send();
            }

            let updateResult = await model.update();
            if (updateResult) {
                return res.set('Location', `api/reservations/${model.id}`).status(200).send();
            }
        }

        return res.status(400).send();
    }

    static async deleteReservation(req, res) {
        const model = new ReservationsModel();
        if (!model.validateId(req.params.reservation_id)) {
            return res.status(400).send();
        }

        const result = await model.deleteOne();
        if (result) {
            return res.status(204).send();
        }

        return res.status(404).send();
    }

    static async createOrder(req, res) {
        const model = new ReservationsModel();
        if (!req.params.reservation_id || !model.validateId(req.params.reservation_id)) {
            return res.status(400).send();
        }

        const result = await model.findOne();
        if (!result) {
            return res.status(404).send();
        }

        if (result) {
            let result = await model.saveOrder(req.body);
            if (result) {
                return res.status(201).send();
            }
        }

        return res.status(400).send();
    }

    static async getOrdersInfo(req, res) {
        const model = new ReservationsModel();
        if (!req.params.reservation_id || !model.validateId(req.params.reservation_id)) {
            return res.status(400).send();
        }

        const result = await model.findOne();

        if (result) {
            let result = await model.findOrder();
            if (result) {
                return res.status(200).send(result);
            }
        }

        return res.status(404).send();
    }
}

module.exports = Reservations;