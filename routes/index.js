var express         = require("express"),
    router          = express.Router(),
    passport        = require("passport"),
    LocalStrategy   = require("passport-local"),
    flash           = require("connect-flash"),
    middleware      = require("../middleware"),
    Juoma           = require("../models/juoma"),
    User            = require("../models/user");

//GET homepage
router.get("/", function(req, res) {
    Juoma.aggregate(
        { $sample: { size: 4 } }).exec(function(err, foundDrink) {
        if(err) {
            console.log(err);
            console.log("Virhe satunnaisjuomia hakiessa!");
        } else {
            res.render("index/home",{foundDrink: foundDrink} );
        }
    });
});


//GET info
router.get("/info", function (req, res) {
    res.render("index/info");
});

//GET login
router.get("/login", function (req, res) {
    res.render("index/login");
});

//POST login
router.post("/login", passport.authenticate("local",
    {
        successRedirect: "/",
        failureRedirect: "/login"
    }), function(req, res) {
});


//GET register
router.get("/register", function (req, res) {
    res.render("index/register");
});

//POST register
router.post("/register", function (req, res) {
    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function (err, user) {
        if(err) {
            req.flash("error", err.message);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function() {
                req.flash("success", "Tervetuloa AlkoAppiin " + user.username);
                res.redirect("/");
            })
        }
    })
});

//LOGOUT
router.get("/logout", function(req, res) {
    req.logout();
    req.flash("success", "Uloskirjaus onnistui");
    res.redirect("/");
});

//GET suggestions
router.get("/suggestions", middleware.isAdmin, function (req, res) {
    res.send("yeah");
});


//GET top
router.get("/top", function (req, res) {
    function add(data) {
        console.log(data);
    }
    Juoma.aggregate(
        [
            {$match: {}
            },
            {$addFields:
                {avg: {$avg: "$rating"}
                }
            },
            {$sort: {rating: -1}},
            {$limit: 12},
        ]
    ).exec(function(err, bestDrinks) {
        if (err) {
            console.log(err);
            req.flash("error", "Jotain meni pieleen, ota yhteyttä ylläpitoon mikäli ongelma jatkuu");
            res.redirect("/");
        } else {
            Juoma.find().sort({views: -1}).limit(12).exec(function (err, viewedDrinks) {
                if(err) {
                    req.flash("error", "Jotain meni pieleen suosituimpia juomia hakiessa");
                    res.render("/");
                } else {
                    res.render("index/top", {bestDrinks: bestDrinks, viewedDrinks: viewedDrinks});
                }
            });
        }
    });
});


//404-site
router.get("*", function(req, res) {
    res.render("index/404");
});



module.exports = router;