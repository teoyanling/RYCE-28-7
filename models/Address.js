const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const Address = db.define('address',
    {
        addressId: {type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        firstname: { type: Sequelize.STRING },
        lastname: { type: Sequelize.STRING },
        phone: { type: Sequelize.INTEGER },
        address: { type: Sequelize.STRING },
        unitnumber: {type: Sequelize.STRING},
        postalcode: {type: Sequelize.INTEGER}
    });
module.exports = Address;
