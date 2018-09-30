process.env.NODE_ENV = 'test';
const expect = require('chai').expect;
const sinon = require('sinon');
const moment = require('moment');
const ReservationModel = require('../../app/models/Reservations');

describe('Reservation Model', () => {
    let reservation;
    let stub;

    beforeEach(() => {
        reservation = new ReservationModel();
    });

    afterEach(() => {
        reservation = null;
        stub = sinon.reset();
    });

    after(() => {
        stub = sinon.restore();
    });

    describe('method validateId', () => {
        it('should return true if passed parameter integer and >= 1', () => {
            expect(reservation.validateId(1)).to.be.true;
            expect(reservation.validateId('1')).to.be.true;
        });

        it('should return false if passed parameter not integer or < 1', () => {
            expect(reservation.validateId(0)).to.be.false;
            expect(reservation.validateId(-1)).to.be.false;
            expect(reservation.validateId('0')).to.be.false;
            expect(reservation.validateId('-1')).to.be.false;
            expect(reservation.validateId(true)).to.be.false;
            expect(reservation.validateId(false)).to.be.false;
            expect(reservation.validateId(null)).to.be.false;
            expect(reservation.validateId()).to.be.false;
            expect(reservation.validateId('')).to.be.false;
            expect(reservation.validateId({})).to.be.false;
            expect(reservation.validateId([])).to.be.false;
            expect(reservation.validateId(NaN)).to.be.false;
        });

        it('should set id property if passed parameter integer and >= 1', () => {
            reservation.validateId(1);
            expect(reservation.id).to.be.equal(1);
        });
    });

    describe('method validate', () => {
        it('should return false if given object do not have all required and valid properties', () => {
            expect(reservation.validate()).to.be.false;
            expect(reservation.validate(1)).to.be.false;
            expect(reservation.validate('1')).to.be.false;
            expect(reservation.validate(0)).to.be.false;
            expect(reservation.validate(-1)).to.be.false;
            expect(reservation.validate('0')).to.be.false;
            expect(reservation.validate('-1')).to.be.false;
            expect(reservation.validate(true)).to.be.false;
            expect(reservation.validate(false)).to.be.false;
            expect(reservation.validate(null)).to.be.false;
            expect(reservation.validate(undefined)).to.be.false;
            expect(reservation.validate('')).to.be.false;
            expect(reservation.validate({})).to.be.false;
            expect(reservation.validate([])).to.be.false;
            expect(reservation.validate(NaN)).to.be.false;
            let requestBody = {};
            expect(reservation.validate(requestBody)).to.be.false;
            requestBody.guests = '';
            expect(reservation.validate(requestBody)).to.be.false;
            requestBody.reservation_start = '';
            expect(reservation.validate(requestBody)).to.be.false;
            requestBody.reservation_duration = '';
            expect(reservation.validate(requestBody)).to.be.false;

            requestBody.guests = 0;
            expect(reservation.validate(requestBody)).to.be.false;
            requestBody.reservation_start = 0;
            expect(reservation.validate(requestBody)).to.be.false;
            requestBody.reservation_duration = 0;
            expect(reservation.validate(requestBody)).to.be.false;


            requestBody.guests = 12;
            expect(reservation.validate(requestBody)).to.be.false;
            requestBody.reservation_start = '1970-01-01';
            expect(reservation.validate(requestBody)).to.be.false;
            requestBody.reservation_duration = 0.4;
            expect(reservation.validate(requestBody)).to.be.false;
        });

        it('should return true if given object have all required and valid properties', () => {
            let requestBody = {
                "guests": 7,
                "user_email": "john.doe@gmail.com",
                "reservation_start": moment().add(1, 'h').format('YYYY-MM-DD HH:mm:ss'),
                "reservation_duration": 0.5
            };

            expect(reservation.validate(requestBody)).to.be.true;
        });

        it('should set properties if given object have all required and valid properties', () => {
            let requestBody = {
                "guests": 7,
                "user_email": "john.doe@gmail.com",
                "reservation_start": moment().add(1, 'h').format('YYYY-MM-DD HH:mm:ss'),
                "reservation_duration": 0.5
            };
            let reservation_end = moment(requestBody.reservation_start, 'YYYY-MM-DD HH:mm:ss')
                .add(30, 'm').format('YYYY-MM-DD HH:mm:ss');
            expect(reservation.validate(requestBody)).to.be.true;
            expect(reservation.guests).to.be.equal(requestBody.guests);
            expect(reservation.reservation_start).to.be.equal(requestBody.reservation_start);
            expect(reservation.reservation_duration).to.be.equal(requestBody.reservation_duration);
            expect(reservation.reservation_end).to.be.equal(reservation_end);
        });
    });

    describe('method isConflict', () => {
        it('should search for available tables return false if exists', async () => {
            reservation.id = 1;
            stub = sinon.stub(reservation, 'getFreeTables').resolves([1, 2]);
            let result = await reservation.isConflict();
            expect(result).to.be.false;
        });

        it('should search for available tables return true if not exists', async () => {
            reservation.id = 1;
            stub = sinon.stub(reservation, 'getFreeTables').resolves([]);
            let result = await reservation.isConflict();
            expect(result).to.be.true;
        });
    });

    describe('method update', () => {
        it('should return false if no freeTables left', async () => {
            reservation.freeTables = [];
            let result = await reservation.update();
            expect(result).to.be.false;
        });
    });

    describe('method save', () => {
        it('should return false if no freeTables left', async () => {
            reservation.freeTables = [];
            let result = await reservation.save();
            expect(result).to.be.false;
        });
    });
});