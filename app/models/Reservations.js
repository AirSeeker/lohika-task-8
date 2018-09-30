const knex = require('../../db');
const BaseJoi = require('joi');
const Extension = require('joi-date-extensions');
const Joi = BaseJoi.extend(Extension);
const moment = require('moment');
const axios = require('axios');
const config = require('../../config')[process.env.NODE_ENV];

class ReservationsModel {
    constructor() {
        this.id = null;
        this.guests = null;
        this.user_id = null;
        this.user_email = null;
        this.reservation_start = null;
        this.reservation_duration = null;
        this.reservation_end = null;
        this.freeTables = null;
    }

    /**
     * Validate view, delete, update request id params on success set model id
     * @param {number} id
     * @returns {boolean}
     */
    validateId(id) {
        const schema = Joi.number().integer().min(1).required();
        let {value: result, error} = Joi.validate(id, schema);

        if (error === null) {
            this.id = result;
            return true;
        }

        return false;
    }

    /**
     * Validate create and update request body on success set model guests, time, reservationEnd
     * @param {Object} data
     * @returns {boolean}
     */
    validate(data) {
        const schema = Joi.object().keys({
            guests: Joi.number().integer().min(1).max(10).required(),
            user_email: Joi.string().email(),
            reservation_start: Joi.date().format('YYYY-MM-DD HH:mm:ss').min('now').required(),
            reservation_duration: Joi.number().precision(1).min(0.5).max(6.0).required()
        }).required();

        let {value: result, error} = Joi.validate(data, schema);

        if (error === null) {
            this.guests = result.guests;
            this.user_email = result.user_email;
            this.reservation_start = moment(result.reservation_start, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss');
            this.reservation_duration = result.reservation_duration;
            let duration = `${this.reservation_duration}`.split('.');
            let hours = parseInt(duration[0]);
            let minutes = 0;
            if (duration[1]) {
                minutes = 60 / (1 / parseFloat('0.' + duration[1]));
            }
            this.reservation_end = moment(this.reservation_start, 'YYYY-MM-DD HH:mm:ss').add(hours, 'h');
            if (minutes) {
                this.reservation_end.add(minutes, 'm')
            }
            this.reservation_end = this.reservation_end.format('YYYY-MM-DD HH:mm:ss');
            return true;
        }

        return false;
    }

    /**
     * Search for available tables return true if exists
     * @returns {boolean}
     */
    async isConflict() {
        const freeTables = await this.getFreeTables(this.id);
        return !freeTables.length;
    }

    /**
     * Return free tables
     * @param {number} [excludeReservationId] On update need to exclude current id
     * @returns {Promise<*>}
     */
    async getFreeTables(excludeReservationId) {
        let result;
        try {
            const subQuery = knex('reservations')
                .modify(function (queryBuilder) {
                    if (excludeReservationId) {
                        queryBuilder.andWhere('reservations.id', '!=', excludeReservationId);
                    }
                })
                .andWhereBetween('reservations.start', [this.reservation_start, this.reservation_end])
                .orWhereBetween('reservations.end', [this.reservation_start, this.reservation_end])
                .select('table_id');

            result = await knex('tables')
                .where('capacity', '>=', this.guests)
                .andWhere('id', 'not in', subQuery);
        } catch (e) {
            return [];
        }
        this.freeTables = result;
        return result;
    }

    /**
     * Update single row
     * @returns {boolean}
     */
    async update() {
        if (this.freeTables.length) {
            let reservation;
            try {
                reservation = await knex('reservations')
                    .where('id', this.id)
                    .update({
                        table_id: this.freeTables[0].id,
                        start: this.reservation_start,
                        end: this.reservation_end,
                        guests: this.guests
                    });
            } catch (e) {
                return false;
            }

            if (reservation) {
                return true;
            }
        }

        return false;
    }

    /**
     * Save reservation
     * @returns {boolean}
     */
    async save() {
        if (this.freeTables.length) {
            let reservation;
            try {
                reservation = await knex('reservations')
                    .returning('id')
                    .insert({
                        table_id: this.freeTables[0].id,
                        user_id: this.user_id,
                        start: this.reservation_start,
                        end: this.reservation_end,
                        guests: this.guests
                    });
            } catch (e) {
                return false;
            }

            if (reservation.length) {
                this.id = reservation[0];
                return true;
            }
        }

        return false;
    }

    /**
     * Select reservation by id and join with table
     * @returns {boolean|Object}
     */
    async findOne() {
        let result;
        try {
            result = await knex('reservations')
                .select([
                    'reservations.id',
                    'reservations.guests',
                    'reservations.start',
                    'reservations.end',
                    'tables.number',
                    'tables.capacity'
                ])
                .where('reservations.id', this.id)
                .join('tables', 'tables.id', 'reservations.table_id')
                .limit(1);
        } catch (e) {
            return false;
        }

        if (!result.length) {
            return false;
        }

        return {
            reservation: {
                id: result[0].id,
                guests: result[0].guests,
                start: moment(result[0].start, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss'),
                end: moment(result[0].end, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD HH:mm:ss'),
                table: {
                    number: result[0].number,
                    capacity: result[0].capacity
                }
            }
        }
    }

    /**
     * Delete reservation by id
     * @returns {boolean}
     */
    async deleteOne() {
        let result;
        try {
            result = await knex('reservations').where('id', this.id).del();
        } catch (e) {
            return false;
        }

        return !!result;
    }

    /**
     * Send request to Orders microservice
     * @param {Object} body
     * @returns {boolean}
     */
    async saveOrder(body) {
        let result;
        try {
            result = await axios.post(`${config.ordersEndpoint}/api/orders`, body);
        } catch (e) {
            return false;
        }

        if (result.status === 201 && result.headers.location) {
            try {
                await knex('reservation_has_order')
                    .returning('id')
                    .insert({
                        reservation_id: this.id,
                        order_uri: result.headers.location
                    });
            } catch (e) {
                return false;
            }

            return true;
        }

        return false;
    }

    /**
     * Find details for order based on reservation id
     * @returns {boolean|Object}
     */
    async findOrder() {
        try {
            let order = await knex('reservation_has_order')
                .select(['order_uri'])
                .where('reservation_id', this.id)
                .limit(1);
            if (order.length) {
                let result = await axios.get(`${config.ordersEndpoint}${order[0].order_uri}`);

                if (result.status === 200) {
                    return result.data.meals.reduce((response, currentMeal) => {
                        response.meals.push(currentMeal.name);
                        return response;
                    }, {meals: []});
                }
            }

            return false;
        } catch (e) {
            return false;
        }
    }
}

module.exports = ReservationsModel;