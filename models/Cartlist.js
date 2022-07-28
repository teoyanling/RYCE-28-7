const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

// Create product table in MySQL Database
const Cartlist = db.define('cartlist',
    {
        // cartId: {type: Sequelize.INTEGER },
        // imgURL: { type: Sequelize.STRING },
        // name: { type: Sequelize.STRING },
        // price: { type: Sequelize.INTEGER },
        cartlistId: {type: Sequelize.INTEGER ,  autoIncrement: true, primaryKey: true},
        quantity: { type: Sequelize.INTEGER },
        // subtotal: { type: Sequelize.DECIMAL(10,2) }

    });
module.exports = Cartlist;