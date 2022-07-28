const express = require('express');
const router = express.Router();
const flashMessage = require('../helpers/messenger');
const User = require('../models/User');
const Role = require('../models/Role');
const Address = require('../models/Address');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const Service = require('../models/Services');
const moment = require('moment');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const ensureAuthenticated = require('../helpers/auth');
const staffAuthenticated = require('../helpers/staffauth');
const custAuthenticated = require('../helpers/custauth');
// Required for file upload
const fs = require('fs');
const upload = require('../helpers/imageUpload');
// Required for email verification
require('dotenv').config();
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
const randtoken = require("rand-token");
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

// Register
router.get('/register', (req, res) => {
    res.render('user/register');
});

router.post('/register', async function (req, res) {
    let { firstname, lastname, email, password, password2 } = req.body;
    let role = "Customer"
    let isValid = true;
    if (password.length < 6) {
        flashMessage(res, 'error', 'Password must be at least 6 characters');
        isValid = false;
    }
    if (password != password2) {
        flashMessage(res, 'error', 'Passwords do not match');
        isValid = false;
    }
    if (!isValid) {
        res.render('user/register', {
            firstname, lastname, email
        });
        return;
    }

    try {
        // If all is well, checks if user is already registered
        let user = await User.findOne({ where: { email: email } });
        if (user) {
            // If user is found, that means email has already been registered
            flashMessage(res, 'error', email + ' alreay registered');
            res.render('user/register', {
                firstname, lastname, email
            });
        }
        else {

            // Create new user record 
            var salt = bcrypt.genSaltSync(10);
            var hash = bcrypt.hashSync(password, salt);
            // Use hashed password
            let user = await User.create({ firstname, lastname, email, password: hash, role, verified: 0 });
            let userId = user.dataValues.id;
            let roles = await Role.create({ role: 'Customer', userId });
            // Send email

            let token = jwt.sign(email, process.env.APP_SECRET);
            let url = `${process.env.BASE_URL}:${process.env.PORT}/user/verify/${user.id}/${token}`;
            sendEmail(user.email, url, firstname, lastname)
                .then(response => {
                    console.log(response);
                    flashMessage(res, 'success', user.email + ' registered successfully');
                    res.redirect('/user/login');
                })
                .catch(err => {
                    console.log(err);
                    flashMessage(res, 'error', 'Error when sending email to ' + user.email);
                    res.redirect('/');
                });
        }

    }
    catch (err) {
        console.log(err);
    }


});

// SEND EMAIL
function sendEmail(toEmail, url, firstname, lastname) {

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const message = {
        to: toEmail,
        from: `RYCE <${process.env.SENDGRID_SENDER_EMAIL}>`,
        subject: 'Verify RYCE Account',
        html: `
        <div class="container"style="padding:18px 30px 18px 30px; color:
         white;font-family:Helvetica, arial, sans-serif; width: 70%; height: 70%; margin: 0 auto;  
         background-color:#8B0000;">
            <div align="center">
                <img  width="200" alt="logo" 
                src="http://cdn.mcauto-images-production.sendgrid.net/8813f1ab11dd29d3/924fb575-5bc6-4659-9011-cdfbdd3c9931/467x95.png"
                height="42">
                </div>
                <h3>Hi ${firstname} ${lastname},</h3><br>
                <div >
                <h2 style="font-size: 22px ">Thanks for signing up for an RYCE account.</h2><br>
                <h3 style="text-align: center;">
                To continue, Please verify your email address by clicking the button below.
                </h3>
                
            </div>
            <br>
            <div style="border-radius:10px; font-size:18px; text-align:center; ">
                <a href=\"${url}" style="background-color:black; border-radius:5px;
                color:white; font-size:14px; font-weight:bold; text-decoration:none;
                padding:10px 20px 10px 20px; text-align:center;">
                Verify Email Now
                </a>
                
            </div>
        </div>`

    };
    // Returns the promise from SendGrid to the calling function
    return new Promise((resolve, reject) => {
        sgMail.send(message)
            .then(response => resolve(response))
            .catch(err => reject(err));
    });
}

// VERIFY EMAIL
router.get('/verify/:userId/:token', async function (req, res) {
    let id = req.params.userId;
    let token = req.params.token;

    try {
        // Check if user is found
        let user = await User.findByPk(id);
        if (!user) {
            flashMessage(res, 'error', 'User not found');
            res.redirect('/user/login');
            return;
        }
        // Check if user has been verified
        if (user.verified) {
            flashMessage(res, 'info', 'User already verified');
            res.redirect('/user/login');
            return;
        }
        // Verify JWT token sent via URL 
        let authData = jwt.verify(token, process.env.APP_SECRET);
        if (authData != user.email) {
            flashMessage(res, 'error', 'Unauthorised Access');
            res.redirect('/user/login');
            return;
        }

        let result = await User.update(
            { verified: 1 },
            { where: { id: user.id } });
        console.log(result[0] + ' user updated');
        flashMessage(res, 'success', user.email + ' verified. Please login');
        res.redirect('/user/login');
    }
    catch (err) {
        console.log(err);
    }
});

// LOGIN
router.get('/login', (req, res) => {
    res.render('user/login');
});

router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        // Success redirect URL
        successRedirect: '/',
        // Failure redirect URL
        failureRedirect: '/user/login',
        /* Setting the failureFlash option to true instructs Passport to flash
        an error message using the message given by the strategy's verify callback.
        When a failure occur passport passes the message object as error */
        failureFlash: true
    })(req, res, next);
});



// FORGOT PASSWORD
function forgotPassword(toEmail, url, email) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const message = {
        to: toEmail,
        from: `RYCE <${process.env.SENDGRID_SENDER_EMAIL}>`,
        subject: 'Reset Password RYCE Account',
        html: `
        <div class="container"style="padding:18px 30px 18px 30px; 
        color: white;font-family:Helvetica, arial, sans-serif; width: 70%; height: 70%; 
        margin: 0 auto;  background-color:#8B0000;">
        <div align="center">
            <img  width="200" alt="logo" src="http://cdn.mcauto-images-production.sendgrid.net/8813f1ab11dd29d3/924fb575-5bc6-4659-9011-cdfbdd3c9931/467x95.png"
             height="42">
            </div>
            <h3>Hi, ${email} </h3><br>
            <div >
            <h2 style="font-size: 22px">A request has been received to reset your password for RYCE account.</h2>
            <h4 style="text-align: center;">To reset it, click on the button below.</h4>
            
        </div><br>
             <div style="border-radius:10px; font-size:18px; text-align:center;">
            <a href=\"${url}" style="background-color:black; border-radius:5spx;
             color:white; font-size:14px; font-weight:bold; text-decoration:none;
             padding:10px 20px 10px 20px; text-align:center;">Reset Password</a>
            
            </div>
    
     </div>`
    };
    // Returns the promise from SendGrid to the calling function
    return new Promise((resolve, reject) => {
        sgMail.send(message)
            .then(response => resolve(response))
            .catch(err => reject(err));
    });
}

router.get('/forgotPassword', (req, res) => {
    res.render('user/forgotPassword')
});

router.post('/forgotPassword', async function (req, res) {
    let email = req.body.email;
    try {
        let user = await User.findOne({ where: { email: email } });
        if (user && user.verified == 1) {
            var token = randtoken.generate(20);
            let url = `${process.env.BASE_URL}:${process.env.PORT}/user/resetPassword/${token}`;
            forgotPassword(user.email, url, email)
                .then(response => {
                    console.log(response);
                    User.update({ token }, { where: { id: user.id } });
                    flashMessage(res, 'success', 'Please check your email for the reset link !');
                    res.redirect('/user/login');
                })
                .catch(err => {
                    console.log(err);
                    flashMessage(res, 'error', 'Error when sending email to ' + user.email);
                    res.redirect('/');
                });

        } else {
            flashMessage(res, 'error', 'There is no account associated with that email.');
            res.redirect("/user/login");
        }

    } catch (err) {
        console.log(err);
    }


});

router.get('/resetPassword/:token', async function (req, res) {
    let token = req.params.token;
    User.findOne({ where: { token: token } })
        .then((user) => {
            if (!user) {
                flashMessage(res, "error", "Reset password token is invalid.");
                res.redirect("/user/login");
            }
            res.render("user/resetPassword", { token, email: user.email });
        })
        .catch((err) => console.log(err));
});


router.post('/resetPassword', async (req, res) => {
    let password = req.body.password
    let password2 = req.body.password2
    let token = req.body.token;

    let isValid = true;
    if (password.length < 6) {
        flashMessage(res, 'error', 'Password must be at least 6 characters');
        isValid = false;
    }
    if (password != password2) {
        flashMessage(res, 'error', 'Passwords do not match');
        isValid = false;
    }
    if (!isValid) {
        res.render('user/resetPassword' + token);
        return;
    }
    try {
        let user = await User.findOne({ where: { token: token } });
        if (user) {
            let userId = user.id;
            var salt = bcrypt.genSaltSync(10);
            var hash = bcrypt.hashSync(password, salt);
            User.update(
                {
                    password: hash, token: null, userId
                },
                { where: { id: userId } }
            )
                .then((result) => {
                    console.log(result[0] + ' User updated');
                    flashMessage(res, 'success', 'you have successfully update password');
                    res.redirect('/user/login');
                })
        } else {
            flashMessage(res, "error", "Token is invalid");
            res.redirect("/user/login");
        }

    } catch (err) {
        console.log(err);
    }

});
// LOGOUT
router.get('/logout', (req, res) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect('/')

    });

});
//STAFF VIEW

// LIST ALL USER 
router.get("/listuser", staffAuthenticated, (req, res) => {
    User.findAll({
        include: Role,
        raw: true
    })
        .then((users) => {
            res.render('user/listuser', { users });
        })
        .catch(err => console.log(err));

});
// CUSTOMER LIST
router.get("/customer", staffAuthenticated, (req, res) => {
    Role.findAll({
        where: { role: "Customer" },
        include: User,
        raw: true
    })
        .then((customer) => {
            console.log(customer)
            res.render('user/customer', { customer });
        })
        .catch(err => console.log(err));
});
// STAFF LIST
router.get("/staff", staffAuthenticated, (req, res) => {
    User.findAll({
        where: { role: 'Staff' },
        include: Role,
        raw: true
    })
        .then((staffs) => {
            console.log(staffs)
            res.render('user/staff', { staffs });
        })
        .catch(err => console.log(err));

});

// router.get("/staf", (req, res) => {
//     const limit = req.query.limit || 10;
//     const offset = req.offset;
//     User.findRecords({
//         offset: offset,
//         limit: limit
//     }).then((staffs) => {
//         const pageCount = Math.ceil(staffs.count / limit);
//         res.render("user/staff", {
//             data: staffs.rows,
//             pageCount,
//             pages: paginate.getArrayPages(req)
//                 (3, pageCount, req.query.page),
//         });
//     });
// });

// CREATE USER
router.get('/createUser', staffAuthenticated, (req, res) => {
    res.render('user/createUser');
});

router.post('/createUser', staffAuthenticated, async (req, res) => {
    let { firstname, lastname, email, password, password2, role } = req.body;
    let userId = req.user.id;
    let isValid = true;
    if (password.length < 6) {
        flashMessage(res, 'error', 'Password must be at least 6 characters');
        isValid = false;
    }
    if (password != password2) {
        flashMessage(res, 'error', 'Passwords do not match');
        isValid = false;
    }
    if (!isValid) {
        res.render('user/createUser', {
            firstname, lastname, email
        });
        return;
    }

    try {
        // If all is well, checks if user is already registered
        let user = await User.findOne({ where: { email: email } });
        if (user) {
            // If user is found, that means email has already been registered
            flashMessage(res, 'error', email + ' alreay registered');
            res.render('user/createUser', {
                firstname, lastname, email
            });
        }
        else {
            // Create new user record 
            var salt = bcrypt.genSaltSync(10);
            var hash = bcrypt.hashSync(password, salt);
            // Use hashed password           //
            let user = await User.create({ firstname, lastname, email, password: hash, role });
            let userId = user.dataValues.id;
            let roles = await Role.create({ role, userId });
            // Send email
            let token = jwt.sign(email, process.env.APP_SECRET);
            let url = `${process.env.BASE_URL}:${process.env.PORT}/user/verify/${user.id}/${token}`;
            sendEmail(user.email, url, firstname, lastname)
                .then(response => {
                    console.log(response);
                    flashMessage(res, 'success', user.email + ' registered successfully');
                    res.redirect('/user/listuser');
                })
                .catch(err => {
                    console.log(err);
                    flashMessage(res, 'error', 'Error when sending email to ' + user.email);
                    res.redirect('/');
                });
        }

    }
    catch (err) {
        console.log(err);
    }
});
// EDIT USER
router.get('/editUser/:id', staffAuthenticated, (req, res) => {
    Role.findOne({
        where: { userId: req.user.id },
        // order: [['updatedAt', 'DESC']],
        raw: true
    }).then((role) => {
        User.findByPk(req.params.id)
            .then((user) => {
                res.render('user/editUser', { user, role });
            })
    })
        .catch(err => console.log(err));
    console.log(req.params.id);
    // User.findByPk(req.params.id)
    //     .then((user) => {
    //         res.render('user/editUser', { user });
    //     })
    //     .catch(err => console.log(err));
});

router.post('/editUser/:id', staffAuthenticated, async (req, res) => {
    let { firstname, lastname, email, password, password2, role } = req.body;
    let userId = req.user.id;
    let isValid = true;
    if (password.length < 6) {
        flashMessage(res, 'error', 'Password must be at least 6 characters');
        isValid = false;
    }
    if (password != password2) {
        flashMessage(res, 'error', 'Passwords do not match');
        isValid = false;
    }
    if (!isValid) {
        res.render('listuser', {
            firstname, lastname, email
        });
        return;
    }

    try {
        // If all is well, checks if user is already registered
        let user = await User.findOne({ where: { id: req.params.id } });
        if (user.email == email) {
            var salt = bcrypt.genSaltSync(10);
            var hash = bcrypt.hashSync(password, salt);
            // Use hashed password           //
            let user = await User.update({ firstname, lastname, password: hash, email, role }, { where: { id: req.params.id } });
            let roles = await Role.update({ role }, { where: { userId: req.params.id } });
            flashMessage(res, "success", email + " data updated successfully");
            res.redirect("/user/listuser");
        }
        else {
            let emailUser = await User.findOne({ where: { email: email } });
            if (emailUser) {
                flashMessage(res, "error", email + " alreay registered");
                return res.render("user/editUser", {
                    firstname, lastname, email
                });
            } else {
                var salt = bcrypt.genSaltSync(10);
                var hash = bcrypt.hashSync(password, salt);
                // Use hashed password           //
                let user = await User.update({ firstname, lastname, password: hash, email, role }, { where: { id: req.params.id } });
                let roles = await Role.update({ role }, { where: { userId: req.params.id } });
                let token = jwt.sign(email, process.env.APP_SECRET);
                let url = `${process.env.BASE_URL}:${process.env.PORT}/user/verify/${req.params.id}/${token}`;
                sendEmail(email, url, email, firstname, lastname);
                flashMessage(res, "success", email + " data updated successfully");
                res.redirect("/user/listuser");
            }
        }

    } catch (err) {
        console.log(err);
    }
});

// PROFILE
router.get('/profile', ensureAuthenticated, (req, res) => {
    User.findOne({
        where: { id: req.user.id },
        raw: true,
    })
        .then((user) => {
            res.render("user/profile/profile");
        })
        .catch((err) => console.log(err));
});
// EDIT PROFILE
router.get('/editprofile/:id', ensureAuthenticated, (req, res) => {
    User.findByPk(req.params.id)
        .then((user) => {
            res.render('user/profile/editprofile', { user });
        })
        .catch(err => console.log(err));
});
router.post('/editprofile/:id', ensureAuthenticated, async (req, res) => {
    let firstname = req.body.firstname;
    let lastname = req.body.lastname;
    let email = req.body.email;
    let gender = req.body.gender;
    let bday = moment(req.body.bday, "DD/MM/YYYY");
    let phone = req.body.phone;
    let imgURL = req.body.imgURL;
    let userId = req.user.id;

    let isValid = true;
    if (phone.length != 8) {
        flashMessage(res, 'error', 'Phone must be  only in 8 characters');
        isValid = false;
    }
    if (!isValid) {
        res.render("user/profile/editprofile", {
            firstname, lastname, phone, gender
        });
        return;
    }

    try {
        // If all is well, checks if user is already registered
        let user = await User.findOne({ where: { id: req.params.id } });
        if (user.email == email) {
            let user = await User.update({ firstname, lastname, gender, phone, bday, imgURL }, { where: { id: req.params.id } });
            flashMessage(res, "success", email + " data updated successfully");
            res.redirect("/user/profile");
        }
        else {
            let emailUser = await User.findOne({ where: { email: email } });
            if (emailUser) {
                flashMessage(res, "error", email + " already registered");
                res.render("user/profile/editprofile", {
                    firstname, lastname, email
                });
            }
            else {
                let user = await User.update({ firstname, lastname, email, gender, phone, bday, imgURL, verified: 0 }, { where: { id: req.params.id } });
                let token = jwt.sign(email, process.env.APP_SECRET);
                let url = `${process.env.BASE_URL}:${process.env.PORT}/user/verify/${req.params.id}/${token}`;
                sendEmail(email, url, email, firstname, lastname);
                flashMessage(res, "success", email + " data updated successfully");
                return res.redirect("/user/profile");
            }
        }
    } catch (err) {
        console.log(err);
    }
});
// CHANGE PASSWORD
router.get('/changepwd/:id', ensureAuthenticated, (req, res) => {
    User.findByPk(req.params.id)
        .then((user) => {
            res.render('user/profile/changepwd', { user });
        })
        .catch(err => console.log(err));
});
router.post('/changepwd/:id', ensureAuthenticated, async (req, res) => {
    let password = req.body.password
    let password2 = req.body.password2
    let userId = req.user.id;

    let isValid = true;
    if (password.length < 6) {
        flashMessage(res, 'error', 'Password must be at least 6 characters');
        isValid = false;
    }
    if (password != password2) {
        flashMessage(res, 'error', 'Passwords do not match');
        isValid = false;
    }
    if (!isValid) {
        res.render('user/profile/changepwd');
        return;
    }

    var salt = bcrypt.genSaltSync(10);
    var hash = bcrypt.hashSync(password, salt);
    User.update(
        {
            password: hash, userId
        },
        { where: { id: req.params.id } }
    )
        .then((result) => {
            console.log(result[0] + ' User updated');
            res.redirect('/user/profile');
        })
        .catch(err => console.log(err));
});

// ADDRESS LIST
router.get('/addressList', (req, res) => {
    Address.findAll({
        where: { userId: req.user.id },
        order: [['updatedAt', 'DESC']],
        raw: true
    })
        .then((addresses) => {
            res.render('user/profile/addressList', { addresses });
        })
        .catch(err => console.log(err));

});
// ADD ADDRESS
router.get('/addAddress', ensureAuthenticated, (req, res) => {

    res.render('user/profile/addAddress');
});

router.post('/addAddress', ensureAuthenticated, async (req, res) => {
    let firstname = req.body.firstname;
    let lastname = req.body.lastname;
    let phone = req.body.phone;
    let address = req.body.address;
    let unitnumber = req.body.unitnumber;
    let postalcode = req.body.postalcode;
    let userId = req.user.id;
    let isValid = true;
    if (phone.length != 8) {
        flashMessage(res, 'error', 'Phone must be  only in 8 characters');
        isValid = false;
    }
    if (postalcode.length != 6) {
        flashMessage(res, 'error', 'Postal code must be  only in 6 characters');
        isValid = false;
    }
    if (!isValid) {
        res.render("user/profile/addAddress", {
            firstname, lastname, phone, address, unitnumber, postalcode
        });
        return;
    }
    try {
        let Checkaddress = await Address.findOne({ where: { address: address } });
        if (Checkaddress) {
            flashMessage(res, "error", address + " already exist");
            res.render("user/profile/addAddress", {
                firstname, lastname, phone, address, unitnumber, postalcode
            });
        } else {
            let Checkaddress = await Address.create({
                firstname, lastname, phone, address, unitnumber, postalcode, userId
            });
            flashMessage(res, "success", address + "  successfully created");
            res.redirect("/user/addressList");
        }


    } catch (err) {
        console.log(err);
    }
});
// EDIT ADDRESS
router.get('/editAddress/:id', ensureAuthenticated, (req, res) => {
    Address.findByPk(req.params.id)
        .then((addresses) => {
            res.render('user/profile/editAddress', { addresses });
        })
        .catch(err => console.log(err));
});
router.post('/editAddress/:id', ensureAuthenticated, async (req, res) => {
    let firstname = req.body.firstname;
    let lastname = req.body.lastname;
    let phone = req.body.phone;
    let address = req.body.address;
    let unitnumber = req.body.unitnumber;
    let postalcode = req.body.postalcode;
    let userId = req.user.id;

    let isValid = true;
    if (phone.length != 8) {
        flashMessage(res, 'error', 'Phone must be  only in 8 characters');
        isValid = false;
    }
    if (postalcode.length != 6) {
        flashMessage(res, 'error', 'Postal code must be  only in 6 characters');
        isValid = false;
    }
    if (!isValid) {
        res.render("user/profile/editAddress", {
            addresses: {
                firstname, lastname, phone, address, unitnumber, postalcode
            }
        });
        return;
    }
    try {
        let editAddress = await Address.findOne({ where: { addressId: req.params.id } });
        if (editAddress.address == address) {
            let editAddress = await Address.update({ firstname, lastname, phone, address, unitnumber, postalcode, userId }, { where: { addressId: req.params.id } });
            flashMessage(res, "success", address + "  successfully created");

            res.redirect("/user/addressList");
        }
        else {
            let Checkaddress = await Address.findOne({ where: { address: address } });
            if (Checkaddress) {
                flashMessage(res, "error", address + " already exist");
                res.render("user/profile/editAddress", {
                    addresses: {
                        firstname, lastname, phone, address, unitnumber, postalcode
                    }
                });
            } else {
                let editAddress = await Address.update({ firstname, lastname, phone, address, unitnumber, postalcode, userId }, { where: { addressId: req.params.id } });
                flashMessage(res, "success", address + "  successfully created");
                res.redirect("/user/addressList");
            }
        }


    } catch (err) {
        console.log(err);
    }
});
// PAYMENT METHOD LIST
router.get('/paymentMethod', ensureAuthenticated, (req, res) => {
    Payment.findAll({
        where: { userId: req.user.id },
        order: [['updatedAt', 'DESC']],
        raw: true
    })
        .then((payments) => {
            res.render('user/profile/paymentMethod', { payments });
        })
        .catch(err => console.log(err));

});
// ADD PAYMENT
router.get('/addPayment', ensureAuthenticated, (req, res) => {
    Address.findOne({
        where: { userId: req.user.id },
        order: [['updatedAt', 'DESC']],
        raw: true
    })
        .then((addresses) => {
            res.render('user/profile/addPayment', { addresses });
        })
        .catch(err => console.log(err));

});
router.post('/addPayment', ensureAuthenticated, (req, res) => {
    let nameOfCard = req.body.nameOfCard;
    let cardNumber = req.body.cardNumber;
    let unitnumber = req.body.unitnumber;
    let postalcode = req.body.postalcode;
    let address = req.body.address;
    let month = req.body.month;
    let year = req.body.year;
    let cvv = req.body.cvv;
    let userId = req.user.id;

    let isValid = true;
    if (cardNumber.length != 16) {
        flashMessage(res, 'error', 'Card Number must be at least 16 characters');
        isValid = false;
    }
    if (month == null) {
        flashMessage(res, 'error', 'Please select an option');
        isValid = false;
    }
    if (year == null) {
        flashMessage(res, 'error', 'Please select an option');
        isValid = false;
    }
    if (cvv.length != 3) {
        flashMessage(res, 'error', 'Cvv must be only in 3 characters');
        isValid = false;
    }
    if (!isValid) {
        res.render("user/profile/addPayment", {
            nameOfCard, cardNumber, month, year, cvv,
            addresses: {
                unitnumber, postalcode, address
            }
        });
        return;

    }

    Payment.create({
        nameOfCard, cardNumber, month, year, cvv, userId
    })
        .then((payment) => {
            console.log(payment.toJSON());
            res.redirect('/user/paymentMethod');
        })
        .catch(err => console.log(err))
});
// EDIT PAYMENT
router.get('/editPayment/:id', ensureAuthenticated, (req, res) => {
    Address.findOne({
        where: { userId: req.user.id },
        order: [['updatedAt', 'DESC']],
        raw: true
    }).then((addresses) => {
        Payment.findByPk(req.params.id)
            .then((payment) => {

                res.render('user/profile/editPayment', { payment, addresses });
            })
    })
        .catch(err => console.log(err));

});
router.post('/editPayment/:id', ensureAuthenticated, (req, res) => {
    let nameOfCard = req.body.nameOfCard;
    let cardNumber = req.body.cardNumber;
    let unitnumber = req.body.unitnumber;
    let postalcode = req.body.postalcode;
    let address = req.body.address;
    let month = req.body.month;
    let year = req.body.year;
    let cvv = req.body.cvv;
    let userId = req.user.id;

    let isValid = true;
    if (cardNumber.length != 16) {
        flashMessage(res, 'error', 'Card Number must be at least 16 characters');
        isValid = false;
    }
    if (month == null) {
        flashMessage(res, 'error', 'Please select an option of MM');
        isValid = false;
    }
    if (year == null) {
        flashMessage(res, 'error', 'Please select an option of YY');
        isValid = false;
    }
    if (cvv.length != 3) {
        flashMessage(res, 'error', 'Cvv must be only in 3 characters');
        isValid = false;
    }
    if (!isValid) {
        res.render("user/profile/editPayment", {
            nameOfCard, cardNumber, month, year, cvv,
            addresses: {
                unitnumber, postalcode, address
            }
        });
        return;

    }

    Payment.update(
        {
            nameOfCard, cardNumber, month, year, cvv, userId
        },
        {
            where: { paymentId: req.params.id }
        }
    )
        .then((result) => {
            console.log(result[0] + ' card Detail updated');
            res.redirect('/user/paymentMethod');
        })
        .catch(err => console.log(err));
});
// TEST DRIVE HISTORY
router.get('/testDrivehistory', custAuthenticated, (req, res) => {
    Booking.findAll({
        where: { userId: req.user.id },
        raw: true
    })
        .then((bookings) => {
            // pass object to listVideos.handlebar
            res.render('user/profile/testDrivehistory', { bookings });
        })
        .catch(err => console.log(err));
});
// EDIT TEST DRIVE
router.get('/editTD/:id', custAuthenticated, (req, res) => {
    Booking.findByPk(req.params.id)
        .then((booking) => {
            res.render('user/profile/editTD', { booking });
        })
        .catch(err => console.log(err));
});
router.post('/editTD/:id', custAuthenticated, (req, res) => {
    let name = req.body.name;
    let email = req.body.email;
    let num = req.body.num;
    let cars = req.body.cars;
    let date = moment(req.body.date, 'DD/MM/YYYY');
    let time = req.body.time;
    let location = req.body.location;
    let userId = req.user.id;


    Booking.update(
        {
            name, email, num, cars, date, time, location, userId
        },
        { where: { bookingId: req.params.id } }
    )
        .then((result) => {
            console.log(result[0] + ' test drive booking updated');
            res.redirect('/user/testDriveHistory');
        })
        .catch(err => console.log(err));

});

// SERVICING HISTORY
router.get('/servicingHistory', custAuthenticated, (req, res) => {
    Service.findAll({
        where: { userId: req.user.id },
        order: [['dateRelease', 'DESC']],
        raw: true
    })
        .then((services) => {
            // pass object to listServices.handlebar
            res.render('user/profile/servicingHistory', { services });
        })
        .catch(err => console.log(err));
});
// EDIT SERVICING
router.get('/editservicing/:id', custAuthenticated, (req, res) => {
    Service.findByPk(req.params.id)
        .then((service) => {
            res.render('user/profile/editservicing', { service });
        })
        .catch(err => console.log(err));
});
router.post('/editservicing/:id', custAuthenticated, (req, res) => {
    let title = req.body.title;
    let name = req.body.name;
    let email = req.body.email;
    let phone = req.body.phone;
    let carP = req.body.carP;
    let carM = req.body.carM === undefined ? '' : req.body.carM.toString();
    let dateRelease = moment(req.body.dateRelease, 'DD/MM/YYYY');
    let time = req.body.time;
    let location = req.body.location === undefined ? '' : req.body.location.toString();
    let classification = req.body.classification;
    let story = req.body.story.slice(0, 1999);
    let userId = req.user.id;

    Service.update(
        {
            title, name, email, phone, carP, carM, dateRelease, time, location, classification, story, userId
        },
        { where: { serviceId: req.params.id } }
    )
        .then((result) => {
            console.log(result[0] + ' Service updated');

            res.redirect('/user/servicingHistory');
        })
        .catch(err => console.log(err));

});
// DELETE SERVICING
router.get('/deleteService/:id', ensureAuthenticated, async function (req, res) {
    try {
        let service = await Service.findByPk(req.params.id);
        if (!service) {
            flashMessage(res, 'error', 'Service not found');
            res.redirect('/user/servicingHistory');
            return;
        }
        if (req.user.id != service.userId) {
            flashMessage(res, 'error', 'Unauthorised access');
            res.redirect('/user/servicingHistory');
            return;
        }

        let result = await Service.destroy({ where: { serviceId: service.serviceId } });
        console.log(result + ' Service deleted');
        res.redirect('/user/servicingHistory');
    }
    catch (err) {
        console.log(err);
    }
});


//Test drive delete 
function sendCancel(toEmail, url, name, email, cars) {

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const message = {
        to: toEmail,
        from: `RYCE <${process.env.SENDGRID_SENDER_EMAIL}>`,
        subject: 'Cancellation Booking for Test Drive Appointment',
        html: `<div class="container"style="padding:18px 30px 18px 30px; color: white;font-family:Helvetica, arial, sans-serif; width: 100%; height: 120%; margin: 0 auto;  background-color:#8B0000; ">
        <style>
        table {
          font-family: arial, sans-serif;
          color:white; 
          border-collapse: collapse;
          width: 100%;
        }
        
        td, th {
          border: 1px solid #dddddd;
          text-align: left;
          padding: 8px;
        
        }
        </style>
        
            <div align="center">
                <img  width="200" alt="logo" src="http://cdn.mcauto-images-production.sendgrid.net/8813f1ab11dd29d3/924fb575-5bc6-4659-9011-cdfbdd3c9931/467x95.png"
                 height="42">
                </div>
                <h1>Dear ${name} ,</h1><br>
                <div>
                <div align="center">
                <h2 style="font-size: 18px">Your Test Drive Booking for ${cars} Has been cancelled.</h2>

                <h3> Thank you once again for booking with RYCE! </h3>
                
           
                
                </div>
                <br>
         
          
                <h3 style="text-align: center;">To go back to our website <br> you can click on the button below.</h3>
                
            </div><br>
                 <div style="border-radius:10px; font-size:18px; text-align:center;">
                <a href=\"${url}" style="background-color:black; border-radius:5spx;
                 color:white; font-size:14px; font-weight:bold; text-decoration:none;
                 padding:10px 20px 10px 20px; text-align:center;">Go Back </a>
                
                </div>
         </div>
               `

    };
    // Returns the promise from SendGrid to the calling function
    return new Promise((resolve, reject) => {
        sgMail.send(message)
            .then(response => resolve(response))
            .catch(err => reject(err));
    });
}
router.get('/deleteTDbooking/:id', ensureAuthenticated, async function (req, res) {

    try {
        let booking = await Booking.findByPk(req.params.id);
        if (!booking) {
            flashMessage(res, 'error', 'Booking not found');
            res.redirect('/user/servicingHistory');
            return;
        }
        if (req.user.id != booking.userId) {
            flashMessage(res, 'error', 'Unauthorised access');
            res.redirect('/user/testDrivehistory');
            return;
        }
        // let email = await User.findOne( {where: {userId: user.email}});
        // if (email == email) {
        //     let email = req.body.email;
        //     let token = jwt.sign(email, process.env.APP_SECRET);
        //     let url = `${process.env.BASE_URL}:${process.env.PORT}/user/verify/${req.params.id}/${token}`;
        //     sendCancel(email, url, name, cars);
        //     return;

        // }
        
        let result = await Booking.destroy({ where: { bookingId: booking.bookingId } });
        console.log(result + ' Booking deleted');
        res.redirect('/user/testDrivehistory');


    }

    catch (err) {
    console.log(err);

}
});



// ORDER HISTORY
router.get('/ordersHistory', (req, res) => {
    res.render('user/profile/ordersHistory');
});
// UPLOAD IMAGE
router.post('/upload', ensureAuthenticated, (req, res) => {
    // Creates user id directory for upload if not exist
    if (!fs.existsSync('./public/uploads/' + req.user.id)) {
        fs.mkdirSync('./public/uploads/' + req.user.id, {
            recursive:
                true
        });
    }
    upload(req, res, (err) => {
        if (err) {
            // e.g. File too large
            res.json({ file: '/img/no-image.jpg', err: err });
        }
        else {
            res.json({
                file: `/uploads/${req.user.id}/${req.file.filename}`
            });
        }
    });
});

// AUTHENTICATION PAGE
router.get('/noaccesspage', (req, res) => {
    res.render('user/noaccesspage');
});

//SEARCH BAR
router.get('/search', (req, res) => {
    let { term } = req.query;

    // Make lowercase
    term = term.toLowerCase();

    User.findAll({ where: { id: { [Op.like]: '%' + term + '%' } } })
        .then(users => res.render('user/listUser', { users }))
        .catch(err => res.render('error', { error: err }));
});

module.exports = router;