const express = require('express');
const router = express.Router();
const moment = require('moment');
const Booking = require('../models/Booking');
const User = require('../models/User');
const ensureAuthenticated = require('../helpers/auth');
const staffAuthenticated = require('../helpers/staffauth');
// Required for email verification
require('dotenv').config();
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');



router.get('/createTestDBooking', staffAuthenticated, (req, res) => {
    res.render('booking/createTestDBooking');
});

router.get('/bookings', staffAuthenticated, (req, res) => {
    Booking.findAll({
       
        raw: true
    })
        .then((bookings) => {
            // pass object to listVideos.handlebar
            res.render('booking/bookings', { bookings });
        })
        .catch(err => console.log(err));
});

router.post('/createTestDBooking', staffAuthenticated, (req, res) => {
    let name = req.body.name;
    let email = req.body.email;
    let num  = req.body.num;
    let cars = req.body.cars;
    let date = moment(req.body.date, 'DD/MM/YYYY');
    let time = req.body.time;
    let location = req.body.location;
    let userId = req.user.id;
  
    Booking.create(
        {
            name, email, num, cars, date, time, location, userId
        }
    )
        .then((booking) => {
            console.log(booking.toJSON());
            res.redirect('/booking/bookings');
        })
        .catch(err => console.log(err))
});

router.get('/editTestDBooking/:id', staffAuthenticated, (req, res) => {
    Booking.findByPk(req.params.id)
        .then((booking) => {
            res.render('booking/editTestDBooking', { booking });
        })
        .catch(err => console.log(err));
});

router.post('/editTestDBooking/:id', staffAuthenticated, (req, res) => {
    let name = req.body.name;
    let email = req.body.email;
    let num  = req.body.num;
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
            res.redirect('/booking/bookings');
        })
        .catch(err => console.log(err));
});


router.get('/TDform', (req, res) => {
    res.render('booking/TDform');
});

function sendEmail(toEmail, url, name, email, num, cars, date, time, location, userId) {

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const message = {
        to: toEmail,
        from: `RYCE <${process.env.SENDGRID_SENDER_EMAIL}>`,
        subject: 'Confirmation Booking for Test Drive Appointment',
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
                <h2 style="font-size: 18px">Your Test Drive Booking Has been confirmed, here are the booking details: </h2>

                <h3>Customer ID: ${userId}</h3>
                <h3>Email: ${email}</h3>
                <h3>Number: ${num}</h3>
                <h3>Car Plate: ${cars}</h3>
                <h3>Date: ${date}</h3>
                <h3>Time: ${time}</h3>
                <h3>Location: ${location}</h3>
           
                
                </div>
                <br>
         
          
                <h3 style="text-align: center;">To go back to our website to check or amend your bookings,<br> you can click on the button below.</h3>
                
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

router.get('/Supportform', (req, res) => {
    res.render('booking/Supportform');
});

// // trying for form in cust side 


router.post('/TDform', ensureAuthenticated, (req, res) => {
    let name = req.body.name;
    let email = req.body.email;
    let num = req.body.num;
    let cars = req.body.cars;
    let date = moment(req.body.date, 'DD/MM/YYYY');
    let time = req.body.time;
    let location = req.body.location;
    let userId = req.user.id;

    Booking.create(
        {
            name, email, num, cars, date, time, location, userId
        }
    )
        .then((booking) => {
            console.log(booking.toJSON());
            User.findOne({
                where: { id: req.user.id }
            })
                .then((result) => {
                    var isAdmin = result.role == 'Staff';
                    if (isAdmin) {
                        res.redirect('/booking/bookings');
                    } else {
                        res.redirect('/user/testDrivehistory');
                    }
                })
                .catch(err => 
                    console.log(err));
        })
        .catch(err => console.log(err)) 
        let token = jwt.sign(email, process.env.APP_SECRET);
        let url = `${process.env.BASE_URL}:${process.env.PORT}/user/verify/${req.params.id}/${token}`;
        sendEmail(email, url, name, email, num, cars, date, time, location, userId);

});

router.get('/testDrivehistory', ensureAuthenticated, (req, res) => {
    Booking.findAll({
        where: { userId: req.user.id },
        raw: true
    })
        .then((bookings) => {
            // pass object to listVideos.handlebar
            res.render('/user/testDrivehistory', { bookings });
        })
        .catch(err => console.log(err));
});


module.exports = router;



