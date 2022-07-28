const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const ensureAuthenticated = require('../helpers/auth');
const staffAuthenticated = require('../helpers/staffauth');

// Required for file upload 
const fs = require('fs');
const upload = require('../helpers/imageUpload');
const Shoppart = require('../models/Shoppart');
const Cartlist = require('../models/Cartlist');
const Cart = require('../models/Cart');

router.get('/ourcar', (req, res) => {
    Product.findAll({
        // where: { userId: req.user.id },
        raw: true
    })
        .then((products) => {
            // pass object to ourcar.handlebar
            res.render('product/ourcar', { products });
        })
        .catch(err => console.log(err));
});

router.get('/productmanagement',staffAuthenticated, (req, res) => {
    Product.findAll({
        where: { userId: req.user.id },
        raw: true
    })
        .then((products) => {
            // pass object to productmanagement.handlebar
            res.render('product/productmanagement', { products });
        })
        .catch(err => console.log(err));

});

router.get('/addproduct', staffAuthenticated,(req, res) => {
    res.render('product/addproduct');
});

router.post('/addproduct', staffAuthenticated,(req, res) => {
    let imgURL = req.body.imgURL;
    let productname = req.body.productname;
    let price = req.body.price;
    let coe = req.body.coe;
    let hireprice6 = req.body.hireprice6;
    let hireprice12 = req.body.hireprice12;
    let cartype = req.body.cartype;
    let description = req.body.description.slice(0, 199);
    let userId = req.user.id;
    Product.create(
        {
            imgURL, productname, price, coe, hireprice6, hireprice12,
            cartype, description, userId
        }
    )
        .then((products) => {
            console.log(products.toJSON());
            res.redirect('/product/productmanagement');
            res.redirect('/product/ourcar');
        })
        .catch(err => console.log(err))
});

router.get('/editproduct/:id',  staffAuthenticated, (req, res) => {
    Product.findByPk(req.params.id)
        .then((product) => {
            res.render('product/editproduct', { product });
        })
        .catch(err => console.log(err));
});

router.post('/editproduct/:id',  staffAuthenticated, (req, res) => {
    let imgURL = req.body.imgURL;
    let productname = req.body.productname;
    let price = req.body.price;
    let coe = req.body.coe;
    let hireprice6 = req.body.hireprice6;
    let hireprice12 = req.body.hireprice12;
    let cartype = req.body.cartype;
    let description = req.body.description.slice(0, 199);
    let userId = req.user.id;
    Product.update(
        {
            imgURL, productname, price, coe, hireprice6, hireprice12,
            cartype, description, userId
        },
        { where: { carId: req.params.id } }
    )
        .then((result) => {
            console.log(result[0] + ' Product updated');
            res.redirect('/product/productmanagement');
            res.redirect('/product/ourcar');
        })
        .catch(err => console.log(err));
});


router.get('/shoppartmanagement',  staffAuthenticated,(req, res) => {
    Shoppart.findAll({
        where: { userId: req.user.id },
        raw: true
    })
        .then((shopparts) => {
            // pass object to productmanagement.handlebar
            res.render('product/shoppartmanagement', { shopparts });
        })
        .catch(err => console.log(err));

});

router.get('/addshoppart',  staffAuthenticated,(req, res) => {
    res.render('product/addshoppart');
});

router.post('/addshoppart', staffAuthenticated, (req, res) => {
    let imgURL = req.body.imgURL;
    let name = req.body.name;
    let price = req.body.price;
    let userId = req.user.id;
    Shoppart.create(
        {
            imgURL, name, price, userId
        }
    )
        .then((shopparts) => {
            console.log(shopparts.toJSON());
            res.redirect('/product/shoppartmanagement');
            res.redirect('/product/Shoppart');
        })
        .catch(err => console.log(err))
});
router.get('/editshoppart/:id',  staffAuthenticated, (req, res) => {
    Shoppart.findByPk(req.params.id)
        .then((Shoppart) => {
            res.render('product/editshoppart', { Shoppart });
        })
        .catch(err => console.log(err));
});

router.post('/editshoppart/:id',  staffAuthenticated, (req, res) => {
    let imgURL = req.body.imgURL;
    let productname = req.body.productname;
    let price = req.body.price;
    let userId = req.user.id;
    Shoppart.update(
        {
            imgURL, productname, price, userId
        },
        { where: { productId: req.params.id } }
    )
        .then((result) => {
            console.log(result[0] + ' Product updated');
            res.redirect('/product/shoppartmanagement');
            res.redirect('/product/Shoppart');
        })
        .catch(err => console.log(err));
});

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

// chloe's add to cart
router.get('/Shoppart', (req, res) => {
    Shoppart.findAll({
        raw: true
    })
        .then((shopparts) => {
            // pass object to Shoppart.handlebar
            Cart.findAll({
                raw: true
            })
                .then((cart) => {
                    // pass object to Shoppart.handlebar
                    res.render('product/Shoppart', { shopparts, cart });
                })
                .catch(err => console.log(err));
        })
        .catch(err => console.log(err));

    
});

// router.get('/Shoppart/:productId', ensureAuthenticated, (req, res) => {
//     Shoppart.findByPk(req.params.id)
//         .then((shoppart) => {
//             if (!shoppart) {
//                 flashMessage(res, 'error', 'Order not found');
//                 res.redirect('/checkout/ordermanagement');
//                 return;
//             }
//             res.render('checkout/cart', { shoppart });
//         })
//         .catch(err => console.log(err));
// });

router.post('/Shoppart', (req, res) => {
    // let imgURL = req.body.imgURL;
    // let name = req.body.name;
    // let price = req.body.price;
    // let userId = req.user.id
    // let shoppartProductId = req.body.productId;
    // let quantity = req.body.quantity;
    // let subtotal = req.body.subtotal;
    // let cartCartId = req.body.cartCartId;
    

    let userId = req.user.id
    let shoppartProductId = req.body.shoppartProductId;
    let quantity = 1
    Cartlist.create(
        {
            shoppartProductId , userId, quantity
        }
    )
        .then((cartlist) => {
            console.log(cartlist.toJSON());
            res.redirect('/checkout/cart');
        })
        .catch(err => console.log(err))  
});

router.get('/login', (req, res) => {
    res.render('user/login');
});



module.exports = router;

