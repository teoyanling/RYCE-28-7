const Sequelize = require('sequelize');
const db = require('../config/DBConfig');
// Create users table in MySQL Database
const Shoppart = db.define('shoppart',
    {
        imgURL: { type: Sequelize.STRING },
        name: { type: Sequelize.STRING },
        price: { type: Sequelize.INTEGER },
        productId: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true }
    });
module.exports = Shoppart;