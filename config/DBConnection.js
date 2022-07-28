const mySQLDB = require('./DBConfig');
const User = require('../models/User');
const Role = require('../models/Role');
const Address = require('../models/Address');
const Payment = require('../models/Payment');
const CarOrders = require('../models/CarOrders');
const Product = require('../models/Product');
const Booking = require('../models/Booking');
const Service = require('../models/Services');
const Orders = require('../models/Orders');
const OrderItem = require('../models/Orderlist');
const Shoppart = require('../models/Shoppart');
const Cartlist = require('../models/Cartlist');
const Cart = require('../models/Cart');


// If drop is true, all existing tables are dropped and recreated
const setUpDB = (drop) => {
    mySQLDB.authenticate()
        .then(() => {
            console.log('Database connected');
            /*
            Defines the relationship where a user has many videos.
            The primary key from user will be a foreign key in video.
            */

            //Evelyn
            User.hasMany(Role);
            Role.belongsTo(User);

            User.hasMany(Address);
            Address.belongsTo(User);

            User.hasMany(Payment);
            Payment.belongsTo(User);

            // Riko
            User.hasMany(Product);
            Product.belongsTo(User);

            User.hasMany(Shoppart)
            Shoppart.belongsTo(User)

            // Chloe
            // User.hasMany(Orders);
            // Orders.belongsTo(User);

            User.hasMany(CarOrders);
            CarOrders.belongsTo(User);

            // // User.hasOne(Cart);
            // // Cart.belongsTo(User);

            // // User.hasMany(Shoppart);
            // // Shoppart.belongsToMany(User, {through: Cartlist});
            // User.belongsToMany(Shoppart, { through: Cartlist });
            // Shoppart.belongsToMany(User, {through: Cartlist});
            // // Cart.belongsToMany(Shoppart, {through: Cartlist});

            // // User.has
            User.hasOne(Cart);
            Cart.belongsTo(User);

            User.belongsToMany(Shoppart, {through: Cartlist});
            Shoppart.belongsToMany(User, {through: Cartlist});

            User.hasMany(Orders);
            Orders.belongsTo(User);

            Orders.belongsToMany(Shoppart,{through: OrderItem});
            Shoppart.belongsToMany(Orders,{through: OrderItem});

            // Yan ling
            User.hasMany(Booking);
            Booking.belongsTo(User);

            User.hasMany(Service);
            Service.belongsTo(User);

            mySQLDB.sync({
                force: drop
            });
        })
        .catch(err => console.log(err));
};
module.exports = { setUpDB };