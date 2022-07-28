const express = require('express');
const router = express.Router();
const moment = require('moment');
const Orders = require('../models/Orders');
const CarOrders = require('../models/CarOrders');
const Cartlist = require('../models/Cartlist');
const Shoppart = require('../models/Shoppart');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Address = require('../models/Address');
const ensureAuthenticated = require('../helpers/auth');
const flashMessage = require('../helpers/messenger');


router.get('/checkouts', (req, res) => {
    res.render('checkout/checkouts');
});

router.post('/checkouts', (req, res) => {
    let firstname = req.body.firstname;
    let lastname = req.body.lastname;
    let email = req.body.email;
    let phone = req.body.phone;
    let orderDate = moment(req.body.orderDate, 'DD/MM/YYYY');
    let orderId = req.body.orderId;
    let productId = req.body.productId;
    // Multi-value components return array of strings or undefined
    let deliveryStatus = req.body.deliveryStatus === undefined ? '' :
        req.body.deliveryStatus.toString();
    let productName = req.body.productName;
    let quantity = req.body.quantity;
    let unitPrice = req.body.unitPrice;
    let amount = req.body.amount;
    let address = req.body.address;
    let postalCode = req.body.postalCode;
    let unitNumber = req.body.unitNumber;
    let notes = req.body.notes.slice(0, 1999);
    let userId = req.user.id;

    let isValid = true;
    if (quantity < 1) {
        flashMessage(res, 'error', 'Quantity must be at least 1');
        isValid - false;
    }
    if (postalCode.length != 6) {
        flashMessage(res, 'error', 'Valid postal code are only 6 digits');
        isValid = false;
    }
    if (!isValid) {
        res.render('checkout/checkouts', {
            firstname, lastname, email, phone, orderDate, orderId, productId, deliveryStatus, productName, quantity, productName, unitPrice, amount, postalCode, address, unitNumber, notes, userId
        });
        return;
    }

    try {

        Orders.create(
            {
                firstname, lastname, email, phone, orderDate, productId, deliveryStatus, productName, quantity, productName, unitPrice, amount, postalCode, address, unitNumber, notes, userId
            }
        )
            .then((orders) => {
                console.log(orders.toJSON());
                flashMessage(res, 'success', 'order is created successfully');
                res.redirect('/checkout/ordermanagement');
            })
            .catch(err => console.log(err))

    }
    catch (err) {
        console.log(err);
    }
});

router.get('/ordermanagement', ensureAuthenticated, (req, res) => {
    Orders.findAll({
        order: [['orderDate', 'DESC']],
        raw: true
    })
        .then((orders) => {
            // pass object to listVideos.handlebar
            res.render('checkout/ordermanagement', { orders });
        })
        .catch(err => console.log(err));
})

router.get('/carordersmanagement', ensureAuthenticated, (req, res) => {
    CarOrders.findAll({
        order: [['orderDate', 'DESC']],
        raw: true
    })
        .then((carOrders) => {
            // pass object to listVideos.handlebar
            res.render('checkout/carordersmanagement', { carOrders });
        })
        .catch(err => console.log(err));
})

router.get('/cart', async (req, res) => {
    await User.findAll({
        // where : {userId: req.user.id },
        // where: { productId: cartlist.shoppartProductId },
        include: Shoppart,
        // order: [['createdAt', 'DESC']],
        raw: true
    })
        .then((cartlists) => {
            // Cartlist.findAll({
            //     where: { userId: cartlists.shoppartProductId },
            //     raw: true
            // })
            // .then((cartlists) =>{
            res.render('checkout/cart', { cartlists });
            // })

        })
        .catch(err =>
            console.log(err));
})

router.get('/deleteCartItem/:id', ensureAuthenticated, async function (req, res) {
    try {
        let cartlists = await Cartlist.findByPk(req.params.id);
        if (!cartlists) {
            flashMessage(res, 'error', 'Item not found');
            res.redirect('/checkout/cart');
            return;
        }
        if (req.user.id != cartlists.userId) {
            flashMessage(res, 'error', 'Unauthorised access');
            res.redirect('/checkout/cart');
            return;
        }

        let result = await Cartlist.destroy({ where: { cartlistId: cartlists.cartlistId } });
        console.log(result + ' item deleted');
        res.redirect('/checkout/cart');
    }
    catch (err) {
        console.log(err);
    }
});


router.post('/cart', async function (req, res) {
    let quantity = req.body.quantity;
    let shoppartProductId = req.body.shoppartProductId;
    await User.findOne({
        include: Shoppart
    })
        .then((cartlists) => {
            Cartlist.update(
                { quantity: quantity },
                { where: { shoppartProductId: shoppartProductId } })
                .then((result) => {
                    console.log(result[0] + ' cart updated');
                    // res.redirect('/checkout/cart');
                    res.redirect('/checkout/nomcheckout');
                })
                .catch(err => console.log(err))



        })
        .catch(err =>
            console.log(err));

});

router.get('/nomcheckout', async function (req, res) {
    await User.findAll({
        include: Shoppart,
        raw: true
    })
        .then((cartlists) => {
            Address.findOne({
                where: { userId: req.user.id },
                order: [['updatedAt', 'DESC']],
                raw: true
            })
                .then((addresses) => {
                    Payment.findOne({
                        where: { userId: req.user.id },
                        order: [['updatedAt', 'DESC']],
                        raw: true
                    })
                        .then((payments) => {
                            res.render('checkout/nomcheckout', { cartlists, addresses, payments });
                        })
                        .catch(err => console.log(err));

                })
                .catch(err => console.log(err));


        })
        .catch(err =>
            console.log(err));
});

// router.get('/normalcheckout', async function (req, res) {
//     await User.findAll({
//         include: Shoppart,
//         // include: Address,
//         // include: Payment,

//         raw: true
//     })
//         .then((cartlists) => {
//             Address.findOne({
//                 where: { userId: req.user.id },
//                 order: [['updatedAt', 'DESC']],
//                 raw: true
//             })
//                 .then((addresses) => {
//                     Payment.findOne({
//                         where: { userId: req.user.id },
//                         order: [['updatedAt', 'DESC']],
//                         raw: true
//                     })
//                         .then((payments) => {
//                             res.render('checkout/normalcheckout', { cartlists, addresses, payments });
//                         })
//                         .catch(err => console.log(err));

//                 })
//                 .catch(err => console.log(err));


//         })
//         .catch(err =>
//             console.log(err));
// });
router.post('/nomcheckout', (req, res) => {
   let cardNumber = req.body.cardNumber;
   let cvv = req.body.cvv;
   let firstname = req.body.firstname;
   let price = req.body.price;
   let address = req.body.address;
   let userId = req.body.userId;

    Orders.create(
        {
            cardNumber, cvv, firstname, address, price,userId
        }
    )
        .then((orders) => {
            console.log(orders.toJSON());
            flashMessage(res, 'success', 'order is created successfully');
            res.redirect('/checkout/ordersummary');
        })
        .catch(err => console.log(err))


});
// router.post('/normalcheckout', (req, res) => {
//     let firstname = req.body.firstname;
//     let lastname = req.body.lastname;
//     let email = req.body.email;
//     let phone = req.body.phone;
//     let orderDate = Date.now();
//     let productId = req.body.productId;
//     // Multi-value components return array of strings or undefined
//     let deliveryStatus = 'Pending';
//     let productName = req.body.productName;
//     let quantity = req.body.quantity;
//     let unitPrice = req.body.unitPrice;
//     let amount = req.body.amount;
//     let address = req.body.address;
//     let postalCode = req.body.postalCode;
//     let unitNumber = req.body.unitNumber;
//     let notes = req.body.notes.slice(0, 1999);
//     let userId = req.user.id;

//     Orders.create(
//         {
//             firstname, lastname, email, phone, orderDate, productId, deliveryStatus, productName, 
//             quantity, productName, unitPrice, amount, postalCode, address, unitNumber, notes, userId
//         }
//     )
//         .then((orders) => {
//             console.log(orders.toJSON());
//             flashMessage(res, 'success', 'order is created successfully');
//             res.redirect('/checkout/ordersummary');
//         })
//         .catch(err => console.log(err))


// });
// router.post('/normalcheckout', (req, res) => {
//     let firstname = req.body.firstname;
//     let lastname = req.body.lastname;
//     let email = req.body.email;
//     let phone = req.body.phone;
//     let orderDate = Date.now();
//     let orderId = req.body.orderId;
//     let productId = req.body.productId;
//     // Multi-value components return array of strings or undefined
//     let deliveryStatus = 'Pending';
//     let productName = req.body.productName;
//     let quantity = req.body.quantity;
//     let unitPrice = req.body.unitPrice;
//     let amount = req.body.amount;
//     let address = req.body.address;
//     let postalCode = req.body.postalCode;
//     let unitNumber = req.body.unitNumber;
//     let notes = req.body.notes.slice(0, 1999);
//     let userId = req.user.id;

//     let isValid = true;
//     // if (quantity < 1) {
//     //     flashMessage(res, 'error', 'Quantity must be at least 1');
//     //     isValid - false;
//     // }
//     if (postalCode.length != 6) {
//         flashMessage(res, 'error', 'Valid postal code are only 6 digits');
//         isValid = false;
//     }
//     if (!isValid) {
//         res.render('checkout/normalcheckout', {
//             firstname, lastname, email, phone, orderDate, orderId, productId, deliveryStatus, productName, quantity, productName, unitPrice, amount, postalCode, address, unitNumber, notes, userId
//         });
//         return;
//     }


//     Orders.create(
//         {
//             firstname, lastname, email, phone, orderDate, productId, deliveryStatus, productName, quantity, productName, unitPrice, amount, postalCode, address, unitNumber, notes, userId
//         }
//     )
//         .then((orders) => {
//             console.log(orders.toJSON());
//             flashMessage(res, 'success', 'order is created successfully');
//             res.redirect('/checkout/ordersummary');
//         })
//         .catch(err => console.log(err))



// });


router.get('/ordersummary', (req, res) => {
    res.render('checkout/ordersummary');
})

router.get('/guestcheckout', (req, res) => {
    res.render('checkout/guestcheckout');
})

router.post('/guestcheckout', (req, res) => {
    let firstname = req.body.firstname;
    let lastname = req.body.lastname;
    let email = req.body.email;
    let phone = req.body.phone;
    let orderDate = Date.now();
    let orderId = req.body.orderId;
    let productId = req.body.productId;
    // Multi-value components return array of strings or undefined
    let deliveryStatus = req.body.deliveryStatus === undefined ? '' :
        req.body.deliveryStatus.toString();
    let productName = req.body.productName;
    let quantity = req.body.quantity;
    let unitPrice = req.body.unitPrice;
    let amount = req.body.amount;
    let address = req.body.address;
    let postalCode = req.body.postalCode;
    let unitNumber = req.body.unitNumber;
    let notes = req.body.notes.slice(0, 1999);
    let userId = req.user.id;

    let isValid = true;
    // if (quantity < 1) {
    //     flashMessage(res, 'error', 'Quantity must be at least 1');
    //     isValid - false;
    // }
    if (postalCode.length != 6) {
        flashMessage(res, 'error', 'Valid postal code are only 6 digits');
        isValid = false;
    }
    if (!isValid) {
        res.render('checkout/guestcheckout', {
            firstname, lastname, email, phone, orderDate, orderId, productId, deliveryStatus, productName, quantity, productName, unitPrice, amount, postalCode, address, unitNumber, notes, userId
        });
        return;
    }

    try {

        Orders.create(
            {
                firstname, lastname, email, phone, orderDate, productId, deliveryStatus, productName, quantity, productName, unitPrice, amount, postalCode, address, unitNumber, notes, userId
            }
        )
            .then((orders) => {
                console.log(orders.toJSON());
                flashMessage(res, 'success', 'order is created successfully');
                res.redirect('/checkout/cart');
            })
            .catch(err => console.log(err))

    }
    catch (err) {
        console.log(err);
    }
});

router.get('/editorders/:id', ensureAuthenticated, (req, res) => {
    Orders.findByPk(req.params.id)
        .then((orders) => {
            if (!orders) {
                flashMessage(res, 'error', 'Order not found');
                res.redirect('/checkout/ordermanagement');
                return;
            }
            res.render('checkout/editorders', { orders });
        })
        .catch(err => console.log(err));
});

router.post('/editorders/:id', ensureAuthenticated, (req, res) => {
    let firstname = req.body.firstname;
    let lastname = req.body.lastname;
    let email = req.body.email;
    let phone = req.body.phone;
    let orderDate = moment(req.body.orderDate, 'DD/MM/YYYY');
    let orderId = req.body.orderId;
    let productId = req.body.productId;
    // Multi-value components return array of strings or undefined
    let deliveryStatus = req.body.deliveryStatus === undefined ? '' :
        req.body.deliveryStatus.toString();
    let productName = req.body.productName;
    let quantity = req.body.quantity;
    let unitPrice = req.body.unitPrice;
    let amount = req.body.amount;
    let address = req.body.address;
    let postalCode = req.body.postalCode;
    let unitNumber = req.body.unitNumber;
    let notes = req.body.notes.slice(0, 1999);
    let userId = req.user.id;

    let isValid = true;
    if (quantity < 1) {
        flashMessage(res, 'error', 'Quantity must be at least 1');
        isValid - false;
    }
    if (postalCode.length != 6) {
        flashMessage(res, 'error', 'Valid postal code are only 6 digits');
        isValid = false;
    }
    if (!isValid) {
        res.render('checkout/checkouts', {
            firstname, lastname, email, phone, orderDate, orderId, productId, deliveryStatus, productName, quantity, productName, unitPrice, amount, postalCode, address, unitNumber, notes, userId
        });
        return;
    }

    try {

        Orders.update(
            {
                firstname, lastname, email, phone, orderDate, orderId, productId, deliveryStatus, productName, quantity, productName, unitPrice, amount, address, postalCode, unitNumber, notes, userId
            },
            {
                where: { orderId: req.params.id }
            }
        )
            .then((result) => {
                console.log(result[0] + ' order updated');
                flashMessage(res, 'success', ' order is updated successfully');
                res.redirect('/checkout/ordermanagement');
            })
            .catch(err => console.log(err))

    }
    catch (err) {
        console.log(err);
    }
});

router.get('/addcarorders', (req, res) => {
    res.render('checkout/addcarorders');
});

router.post('/addcarorders', (req, res) => {
    let firstname = req.body.firstname;
    let lastname = req.body.lastname;
    let email = req.body.email;
    let phone = req.body.phone;
    let orderDate = moment(req.body.orderDate, 'DD/MM/YYYY');
    let carOrderId = req.body.carOrderId;
    let carId = req.body.carId;
    // Multi-value components return array of strings or undefined
    let deliveryStatus = req.body.deliveryStatus === undefined ? '' :
        req.body.deliveryStatus.toString();
    let carName = req.body.carName;
    let quantity = req.body.quantity;
    let unitPrice = req.body.unitPrice;
    let amount = req.body.amount;
    let address = req.body.address;
    let postalCode = req.body.postalCode;
    let unitNumber = req.body.unitNumber;
    let notes = req.body.notes.slice(0, 1999);
    let userId = req.user.id;

    let isValid = true;
    if (quantity < 1) {
        flashMessage(res, 'error', 'Quantity must be at least 1');
        isValid - false;
    }
    if (postalCode.length != 6) {
        flashMessage(res, 'error', 'Valid postal code are only 6 digits');
        isValid = false;
    }
    if (!isValid) {
        res.render('checkout/carordersmanagement', {
            firstname, lastname, email, phone, orderDate, carOrderId, carId, deliveryStatus, carName, quantity, unitPrice, amount, postalCode, address, unitNumber, notes, userId
        });
        return;
    }

    try {

        CarOrders.create(
            {
                firstname, lastname, email, phone, orderDate, carOrderId, carId, deliveryStatus, carName, quantity, unitPrice, amount, address, postalCode, unitNumber, notes, userId
            }
        )
            .then((orders) => {
                console.log(orders.toJSON());
                flashMessage(res, 'success', 'order ' + carOrderId + ' is created successfully');
                res.redirect('/checkout/carordersmanagement');
            })
            .catch(err => console.log(err))

    }
    catch (err) {
        console.log(err);
    }
});

router.get('/editcarorders/:id', ensureAuthenticated, (req, res) => {
    CarOrders.findByPk(req.params.id)
        .then((carOrders) => {
            if (!carOrders) {
                flashMessage(res, 'error', 'Order not found');
                res.redirect('/checkout/ordermanagement');
                return;
            }

            res.render('checkout/editcarorders', { carOrders });
        })
        .catch(err => console.log(err));
});

router.post('/editcarorders/:id', ensureAuthenticated, (req, res) => {
    let firstname = req.body.firstname;
    let lastname = req.body.lastname;
    let email = req.body.email;
    let phone = req.body.phone;
    let orderDate = moment(req.body.orderDate, 'DD/MM/YYYY');
    let carOrderId = req.body.carOrderId;
    let carId = req.body.carId;
    // Multi-value components return array of strings or undefined
    let deliveryStatus = req.body.deliveryStatus === undefined ? '' :
        req.body.deliveryStatus.toString();
    let carName = req.body.carName;
    let quantity = req.body.quantity;
    let unitPrice = req.body.unitPrice;
    let amount = req.body.amount;
    let address = req.body.address;
    let postalCode = req.body.postalCode;
    let unitNumber = req.body.unitNumber;
    let notes = req.body.notes.slice(0, 1999);
    let userId = req.user.id;

    let isValid = true;
    if (quantity < 1) {
        flashMessage(res, 'error', 'Quantity must be at least 1');
        isValid - false;
    }
    if (postalCode.length != 6) {
        flashMessage(res, 'error', 'Valid postal code are only 6 digits');
        isValid = false;
    }
    if (!isValid) {
        res.render('checkout/carordersmanagement', {
            firstname, lastname, email, phone, orderDate, carOrderId, carId, deliveryStatus, carName, quantity, unitPrice, amount, postalCode, address, unitNumber, notes, userId
        });
        return;
    }

    try {

        CarOrders.update(
            {
                firstname, lastname, email, phone, orderDate, carOrderId, carId, deliveryStatus, carName, quantity, unitPrice, amount, address, postalCode, unitNumber, notes, userId
            },
            {
                where: { carOrderId: req.params.id }
            }
        )
            .then((result) => {
                console.log(result[0] + ' order updated');
                flashMessage(res, 'success', 'order is updated successfully');
                res.redirect('/checkout/carordersmanagement');
            })
            .catch(err => console.log(err))

    }
    catch (err) {
        console.log(err);
    }

});




module.exports = router;
