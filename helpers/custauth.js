// const flashMessage = require('../helpers/messenger');
const custAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        if(req.user.role === 'Customer')
        return next();
    }
    // flashMessage(res, 'error', 'Unauthorised access');
    res.redirect('/user/noaccesspage');
};


module.exports = custAuthenticated;