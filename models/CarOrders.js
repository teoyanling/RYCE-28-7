const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const CarOrders = db.define('carOrders',
    {
        firstname: { type: Sequelize.STRING },
        lastname: { type: Sequelize.STRING },
        email: { type: Sequelize.STRING },
        phone: { type: Sequelize.STRING },
        orderDate: { type: Sequelize.DATE },
        carOrderId: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        carId: { type: Sequelize.INTEGER},
        deliveryStatus: { type: Sequelize.STRING },
        carName: { type: Sequelize.STRING },
        quantity: { type: Sequelize.INTEGER },
        unitPrice: { type: Sequelize.DECIMAL(10,2) },
        amount: { type: Sequelize.DECIMAL(10,2) },
        address: { type: Sequelize.STRING},
        postalCode: { type: Sequelize.STRING},
        unitNumber: { type: Sequelize.STRING},
        notes: { type: Sequelize.STRING(2000) }
        
        
    });

module.exports = CarOrders;