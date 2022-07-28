const Sequelize = require('sequelize');
const db = require('../config/DBConfig');
// Create users table in MySQL Database
const User = db.define('user',
    {
        firstname: { type: Sequelize.STRING },
        lastname: { type: Sequelize.STRING },
        email: { type: Sequelize.STRING },
        password: { type: Sequelize.STRING },
        role: { type: Sequelize.STRING },
        verified: { type: Sequelize.BOOLEAN },
        token: { type: Sequelize.STRING },
        gender: { type: Sequelize.STRING },
        bday: { type: Sequelize.DATE },
        phone: { type: Sequelize.STRING },
        imgURL: { type: Sequelize.STRING }

    });
module.exports = User;