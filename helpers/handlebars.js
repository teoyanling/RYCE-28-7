const moment = require('moment');

const formatDate = function (date, targetFormat) {
    return moment(date).format(targetFormat);
};

const replaceCommas = function (value) {
    return value ? value.replace(/,/g, ' | ') : 'None';
}

const checkboxCheck = function (value, checkboxValue) {
    return (value.search(checkboxValue) >= 0) ? 'checked' : '';
};

const radioCheck = function (value, radioValue) {
    return (value == radioValue) ? 'checked' : '';
};

const deliverycolour = function(value, deliveryStatus){
    if (value == deliveryStatus){
    } else {
        return "hidden";
    }
}

const notescheck = function(value){
    if (value == ""){
        return "none";
    } else{
        return value
    }
}


const checkStaff = function (role, options) {
    return role == 'Staff' ? options.fn(this) : '';
};
const checkCustomer = function (role, options) {
    return role == 'Customer' ? options.fn(this) : '';
}


const droplist = function (value, droplistV) {
    if (value === droplistV) {
        return ' selected';
    } else {
        return ''
    }
};
const genderDisplay = function (value, gender) {
    if (value == gender) {
    } else {
        return "hidden";
    }
}

module.exports = { formatDate, replaceCommas, checkboxCheck, radioCheck, deliverycolour, notescheck, checkStaff, checkCustomer, droplist, genderDisplay };