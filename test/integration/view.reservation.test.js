process.env.NODE_ENV = 'test';
const request = require('supertest');
const expect = require('chai').expect;
const knex = require('../../db');
const moment = require('moment');

describe('View reservation', () => {
    let server;

    beforeEach(async () => {
        server = require('../../index');
        await knex.migrate.rollback();
        await knex.migrate.latest();
        await knex.seed.run();
    });

    afterEach(async () => {
        await knex.migrate.rollback();
        await server.close();
    });

    it('should return 400 if request param invalid', async () => {
        let res = await request(server).get('/api/reservations/test').send();
        expect(res.status).to.be.equal(400);
        expect(res.type).to.be.equal('application/json');
    });

    it('should return 404 if reservation not found', async () => {
        let res = await request(server).get('/api/reservations/1').send();
        expect(res.status).to.be.equal(404);
        expect(res.type).to.be.equal('application/json');
    });
});