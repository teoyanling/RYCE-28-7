const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

// Create videos table in MySQL Database
const Booking = db.define('booking',
    {
        
        name: { type: Sequelize.STRING },
        email: { type: Sequelize.STRING },
        num: { type: Sequelize.INTEGER },
        cars: { type: Sequelize.STRING },
        date: { type: Sequelize.DATE },
        time: { type: Sequelize.TIME },
        location: { type: Sequelize.STRING },
        bookingId: {type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true }
    });

    
module.exports = Booking;