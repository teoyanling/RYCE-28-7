const Sequelize = require('sequelize');
const db = require('../config/DBConfig');

const Orders = db.define('orders',
    {
        firstname: { type: Sequelize.STRING },
        lastname: { type: Sequelize.STRING },
        email: { type: Sequelize.STRING },
        phone: { type: Sequelize.STRING },
        orderDate: { type: Sequelize.DATE },
        orderId: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        productId: { type: Sequelize.INTEGER},
        deliveryStatus: { type: Sequelize.STRING },
        productName: { type: Sequelize.STRING },
        quantity: { type: Sequelize.INTEGER },
        unitPrice: { type: Sequelize.DECIMAL(10,2) },
        amount: { type: Sequelize.DECIMAL(10,2) },
        address: { type: Sequelize.STRING},
        postalCode: { type: Sequelize.STRING},
        unitNumber: { type: Sequelize.STRING},
        notes: { type: Sequelize.STRING(2000) }
        
        
    });

module.exports = Orders;