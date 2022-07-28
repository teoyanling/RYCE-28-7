const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

// Create product table in MySQL Database
const Cart = db.define('cart',
    {
        cartId: {type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },


    });
module.exports = Cart;