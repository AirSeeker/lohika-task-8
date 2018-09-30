process.env.NODE_ENV = 'test';
const request = require('supertest');
const expect = require('chai').expect;
const knex = require('../../db');
const moment = require('moment');
const sinon = require('sinon');
const ReservationModel = require('../../app/models/Reservations');

describe('Create reservation', () => {
    let server;
    let reservation;
    let stub;

    const exec = () => {
        return request(server).post('/api/reservations');
    };

    beforeEach(async () => {
        server = require('../../index');
        await knex.migrate.rollback();
        await knex.migrate.latest();
        await knex.seed.run();
        reservation = new ReservationModel();
    });

    afterEach(async () => {
        await knex.migrate.rollback();
        await server.close();
        reservation = null;
        stub = sinon.reset();
    });

    after(() => {
        stub = sinon.restore();
    });

    it('should return 400 if body request empty', async () => {
        let res = await exec().send();
        expect(res.status).to.be.equal(400);
        expect(res.type).to.be.equal('application/json');
    });

    it('should return 400 if body request invalid', async () => {
        let res = await exec().send({"guests": 11, "time": "2018-09-21", "duration": 0.4});
        expect(res.status).to.be.equal(400);
        expect(res.type).to.be.equal('application/json');
    });

    it('should return 200 if reservation in processing', async () => {
        let res = await exec().send({
            "guests": 7,
            "user_email": "john.doe@gmail.com",
            "reservation_start": moment().add(1, 'h').format('YYYY-MM-DD HH:mm:ss'),
            "reservation_duration": 0.5
        });
        expect(res.status).to.be.equal(200);
        expect(res.type).to.be.equal('application/json');
    });
});