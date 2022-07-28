const express = require('express');
const router = express.Router();
const moment = require('moment');
const Service = require('../models/Services');
const ensureAuthenticated = require('../helpers/auth');
const staffAuthenticated = require('../helpers/staffauth');
const flashMessage = require('../helpers/messenger');
const User = require('../models/User');
// Required for email verification
require('dotenv').config();
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');

router.get('/listServices', staffAuthenticated, (req, res) => {
    Service.findAll({
        where: { userId: req.user.id },
        order: [['dateRelease', 'DESC']],
        raw: true
    })
        .then((services) => {
            // pass object to listServices.handlebar
            res.render('service/listServices', { services });
        })
        .catch(err => console.log(err));
});

router.get('/addServices', staffAuthenticated, (req, res) => {
    res.render('service/addServices');
});

router.post('/addServices', staffAuthenticated, (req, res) => {
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
    Service.create(
        { title, name, email, phone, carP, carM, dateRelease, time, location, classification, story, userId }
    )
        .then((service) => {
            console.log(service.toJSON());
            res.redirect('/service/listServices');
        })
        .catch(err => console.log(err))
});

router.get('/editServices/:id', staffAuthenticated, (req, res) => {
    Service.findByPk(req.params.id)
        .then((service) => {
            if (!service) {
                flashMessage(res, 'error', 'Service not found');
                res.redirect('/service/listServices');
                return;
            }
            if (req.user.id != service.userId) {
                flashMessage(res, 'error', 'Unauthorised access');
                res.redirect('/service/listServices');
                return;
            }

            res.render('service/editServices', { service });
        })
        .catch(err => console.log(err));
});

router.post('/editServices/:id', staffAuthenticated, (req, res) => {
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

            res.redirect('/service/listServices');
        })
        .catch(err => console.log(err));
});

router.get('/Sform', (req, res) => {
    res.render('service/Sform');
});


function sendEmail(toEmail, url, name,email, phone, carP, carM, dateRelease, time, location, classification, story) {

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const message = {
        to: toEmail,
        from: `RYCE <${process.env.SENDGRID_SENDER_EMAIL}>`,
        subject: 'Confirmation Booking for Car Servicing',
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
                <h3>Dear ${name},</h3><br>
                <div>
                <div align="center">
                <h2 style="font-size: 22px">Your Servicing Booking Has been confirmed, here are the booking details: </h2>
                
                <h3>Email: ${email}</h3>
                <h3>Number: ${phone}</h3>
                <h3>Car Plate: ${carP}</h3>
                <h3>Car Model: ${carM}</h3>
                <h3>Date: ${dateRelease}</h3>
                <h3>Time: ${time}</h3>
                <h3>Service Type: ${classification}</h3>
            <h3>Location: ${location}</h3>
            <h3>Remarks: ${story}</h3>
                
                </div>
                <br>
         
          
                <h4 style="text-align: center;">To go back to our website to check or amend your bookings,<br> you can click on the button below.</h4>
                
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

router.post('/Sform', ensureAuthenticated, (req, res) => {
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
    Service.create(
        { title, name, email, phone, carP, carM, dateRelease, time, location, classification, story, userId }
    )
        .then((service) => {
            console.log(service.toJSON());
            User.findOne({
                where: { id: req.user.id }
            })
                .then((result) => {
                    var isAdmin = result.role == 'Staff';
                    if (isAdmin) {
                        res.redirect('/service/listServices');
                    } else {
                        res.redirect('/user/servicingHistory');
                    }
                })
                .catch(err => console.log(err));
        })
        .catch(err => console.log(err))
    
    let token = jwt.sign(email, process.env.APP_SECRET);
    let url = `${process.env.BASE_URL}:${process.env.PORT}/user/verify/${req.params.id}/${token}`;
    sendEmail(email, url, name,carP,carM,dateRelease, time, location, classification, story);
  
});

router.get('/editservicing', ensureAuthenticated, (req, res) => {
    res.render('user/editservicing');
});

router.get('/search', (req, res) => {
    let { term } = req.query;

    // Make lowercase
    term = term.toLowerCase();

    Service.findAll({ where: { carP: { [Op.like]: '%' + term + '%' } } })
        .then(services => res.render('service/listServices', { services }))
        .catch(err => res.render('error', { error: err }));
});
module.exports = router;