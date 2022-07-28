const Sequelize = require('sequelize');
const db = require('../config/DBConfig');
// Create product table in MySQL Database
const Product = db.define('product',
    {
        productname: { type: Sequelize.STRING },
        imgURL: { type: Sequelize.STRING },
        cartype: { type: Sequelize.STRING },
        price: { type: Sequelize.INTEGER },
        coe: { type: Sequelize.INTEGER },
        hireprice6: { type: Sequelize.INTEGER },
        hireprice12: { type: Sequelize.INTEGER },
        description: { type: Sequelize.STRING(200) },
        carId: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true }

    });
module.exports = Product;