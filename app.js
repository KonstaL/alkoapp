var express         = require('express'),
    app             = express(),
    bodyParser      = require("body-parser"),
    User            = require("./models/user"),
    passport        = require("passport"),
    LocalStrategy   = require("passport-local"),
    flash           = require("connect-flash"),
    seedDB          = require("./seed"),
    mongoose        = require("mongoose"),
    Juoma           = require("./models/juoma"),
    middleware      = require("./middleware");

    if(process.env.NODE_ENV === "production") {
        var secretKeys = {
            databaseKey:        process.env.ALKO_DB_KEY,
            sessionSecret:      process.env.SESSION_SECRET

        };
    } else {
        var secretKeys = require("./secret/keys"); //for local development
    }

//Requiring routes
var juomaRoutes     = require("./routes/juoma"),
    indexRoutes     = require("./routes/index");


//App setup!
mongoose.connect(secretKeys.databaseKey, {useMongoClient: true});
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(flash());

//Used for seeding the Database incase of a new .xlsx sheet
//seedDB();


//Passport setup
app.use(require("express-session")({
    secret: secretKeys.sessionSecret,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

//Use routes
app.use("/juomat", juomaRoutes);
app.use("/", indexRoutes);

//Start web-server
app.listen(process.env.PORT || 8080, process.env.IP, function() {
    console.log("Server started!");
});