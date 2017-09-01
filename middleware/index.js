var Juoma   = require("../models/juoma"),
    Comment = require("../models/comment");

var middlewareObj = {};

middlewareObj.isLoggedIn = function(req, res, next) {
    if(req.isAuthenticated()) {
        console.log("on autentikoitunut");
        if(req.user.isAdmin) {
            console.log("on admin");
            return next();
        } else {
            return next();
        }
    } else {
        req.flash("error", "Sun täytyy olla kirjautunut sisään tehdäksesi tuon");
        res.redirect("back");
    }
};

middlewareObj.isAdmin= function(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    } else {
        req.flash("error", "Sun täytyy olla kirjautunut sisään tehdäksesi tuon");
        res.redirect("back");
    }
};


module.exports = middlewareObj;