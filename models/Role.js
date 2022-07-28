const Sequelize = require('sequelize');
const db = require('../config/DBConfig');
// Create users table in MySQL Database
const Role = db.define('role',
    {
        role: { type: Sequelize.STRING },
        roleId: {type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true }

    });
module.exports = Role;
