var express         = require("express"),
    router          = express.Router(),
    passport        = require("passport"),
    LocalStrategy   = require("passport-local"),
    flash           = require("connect-flash"),
    middleware      = require("../middleware"),
    async           = require("async"),
    nodemailer      = require("nodemailer"),
    crypto          = require("crypto"),
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
router.post("/login", passport.authenticate("local", {
        successRedirect: "/",
        failureRedirect: "/login",
        failureFlash: "Virhe sisäänkirjautumistunnuksissa"
    }), function(req, res) {
});


//GET register
router.get("/register", function (req, res) {
    res.render("index/register");
});

//POST register
router.post("/register", function (req, res) {
    var newUser = new User({username: req.body.username, email: req.body.email});
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


//forgot password
router.get("/forgot", function(req, res) {
    res.render("index/forgot");
});


router.post("/forgot", function(req, res) {
    async.waterfall([
        function(done) {
            crypto.randomBytes(20, function(err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function(token, done) {
            User.findOne({ email: req.body.email }, function(err, user) {
                console.log("error: " + err);
                console.log("body email: " + req.body.email);
                console.log(user);
                if (!user) {
                    req.flash('error', 'No account with that email address exists.');
                    return res.redirect('/forgot');
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                user.save().then(function() {
                    console.log("jutut tallennettu");
                });
            });
        },
        function(token, user, done) {
            var smtpTransport =  nodemailer.createTransport({
                host: 'secure172.inmotionhosting.com',
                port: 465,
                secure: true, // upgrade later with STARTTLS
                auth: {
                    user: 'support@konstalehtinen.com',
                    pass: process.env.EMAIL_PW
                }
            });

            var mailOptions = {
                to: user.email,
                from: 'Support@alkoapp.com',
                subject: 'Alkoapp salasanan nollaus',
                text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            smtpTransport.sendMail(mailOptions, function(err) {
                console.log('mail sent');
                req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                done(err, 'done');
            });
        }
    ], function(err) {
        if (err) {
            console.log(err);
            req.flash("error", err.message);
        }
        res.redirect('/forgot');

    });
});

router.get('/reset/:token', function(req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/forgot');
        }
        res.render('index/reset', {token: req.params.token});
    });
});

router.post('/reset/:token', function(req, res) {
    async.waterfall([
        function(done) {
            User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
                if (!user) {
                    req.flash('error', 'Password reset token is invalid or has expired.');
                    return res.redirect('back');
                }
                if(req.body.password === req.body.confirm) {
                    user.setPassword(req.body.password, function(err) {
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;

                        user.save(function(err) {
                            req.logIn(user, function(err) {
                                done(err, user);
                            });
                        });
                    })
                } else {
                    req.flash("error", "Passwords do not match.");
                    return res.redirect('back');
                }
            });
        },
        function(user, done) {
            var smtpTransport =  nodemailer.createTransport({
                host: 'secure172.inmotionhosting.com',
                port: 465,
                secure: true,
                auth: {
                    user: 'support@konstalehtinen.com',
                    pass:  process.env.EMAIL_PW
                }
            });
            var mailOptions = {
                to: user.email,
                from: 'support@alkoapp.com',
                subject: 'Salasanasi on vaihdettu',
                text: 'Hei,\n\n' +
                'Käyttäjäsi' + user.email + ' salasana on vaihdettu.\n\nTerveisin, alkoapp'
            };
            smtpTransport.sendMail(mailOptions, function(err) {
                req.flash('success', 'Salasanasi on vaihdettu!');
                done(err);
            });
        }
    ], function(err) {
        res.redirect('/campgrounds');
    });
});

//404-site
router.get("*", function(req, res) {
    res.render("index/404");
});



module.exports = router;