const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const Payment = db.define('payment',
    {
        paymentId: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        nameOfCard: { type: Sequelize.STRING },
        cardNumber: { type: Sequelize.CHAR(16) },
        month: { type: Sequelize.INTEGER },
        year: { type: Sequelize.INTEGER },
        cvv: { type: Sequelize.INTEGER }
    });
module.exports = Payment;
