const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

// Create product table in MySQL Database
const Orderlist = db.define('orderlist',
    {
        // cartId: {type: Sequelize.INTEGER },
        // imgURL: { type: Sequelize.STRING },
        // name: { type: Sequelize.STRING },
        // price: { type: Sequelize.INTEGER },
        orderlistId: {type: Sequelize.INTEGER ,  autoIncrement: true, primaryKey: true},
        quantity: { type: Sequelize.INTEGER },
        // subtotal: { type: Sequelize.DECIMAL(10,2) }

    });
module.exports = Orderlist;