// const flashMessage = require('../helpers/messenger');
const staffAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        if(req.user.role === 'Staff')
        return next();
    }
    // flashMessage(res, 'error', 'Unauthorised access');
    res.redirect('/user/noaccesspage');
};


module.exports = staffAuthenticated;