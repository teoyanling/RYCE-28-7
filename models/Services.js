const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

// Create videos table in MySQL Database
const Service = db.define('service',
    {
        title: { type: Sequelize.STRING },
        name: { type: Sequelize.STRING },
        email: { type: Sequelize.STRING },
        phone: { type: Sequelize.INTEGER },
        carP: { type: Sequelize.STRING },
        carM: { type: Sequelize.STRING },
        dateRelease: { type: Sequelize.DATE },
        time: { type: Sequelize.TIME },
        location: { type: Sequelize.STRING },
        classification: { type: Sequelize.STRING },
        story: { type: Sequelize.STRING(2000) },
        serviceId: {type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true }
    });

module.exports = Service;