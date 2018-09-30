process.env.NODE_ENV = 'test';
process.env.DEBUG = "knex*";
const request = require('supertest');
const expect = require('chai').expect;
const knex = require('../../db');
const moment = require('moment');
const sinon = require('sinon');
const ReservationModel = require('../../app/models/Reservations');

describe('Update reservation', () => {
    let server;
    let reservation;
    let stub;

    const exec = () => {
        return request(server).put('/api/reservations/1');
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

    it('should return 400 if request param invalid', async () => {
        let res = await request(server).put('/api/reservations/test').send();
        expect(res.status).to.be.equal(400);
        expect(res.type).to.be.equal('application/json');
    });

    it('should return 400 if body request invalid', async () => {
        let res = await exec().send({"reservation": {"guests": 11, "time": "2018-09-21", "duration": 0.4}});
        expect(res.status).to.be.equal(400);
        expect(res.type).to.be.equal('application/json');
    });

    it('should return 404 if reservation not found', async () => {
        let res = await exec().send({
            "guests": 7,
            "user_email": "john.doe@gmail.com",
            "reservation_start": moment().add(1, 'h').format('YYYY-MM-DD HH:mm:ss'),
            "reservation_duration": 0.5
        });
        expect(res.status).to.be.equal(404);
        expect(res.type).to.be.equal('application/json');
    });
});