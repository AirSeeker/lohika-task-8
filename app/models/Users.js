const knex = require('../../db');

class UsersModel {
    constructor(next) {
        this.id = null;
        this.email = null;
        this.next = next || console.warn;
    }

    /**
     * Save user
     * @returns {boolean}
     */
    async save() {
        try {
            let user = await knex('users')
                .returning(['id', 'email'])
                .insert({email: this.email});

            if (user.length) {
                this.id = user[0].id;
                this.email = user[0].email;
                return true;
            }

            return false;
        } catch (e) {
            this.next(e);
            return false;
        }
    }

    /**
     * Select user by email
     * @returns {boolean|Object}
     */
    async findOne() {
        try {
            let result = await knex('users')
                .select(['id', 'email'])
                .where('email', this.email)
                .limit(1);

            if (!result.length) {
                result = await this.save();
            }

            if (!result) {
                return false;
            }

            this.id = result[0].id;
            this.email = result[0].email;
            return {
                id: this.id,
                email: this.email
            }
        } catch (e) {
            this.next(e);
            return false;
        }
    }
}

module.exports = UsersModel;