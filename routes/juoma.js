var express         = require("express"),
    router          = express.Router({mergeParams: true}),
    passport        = require("passport"),
    LocalStrategy   = require("passport-local"),
    flash           = require("connect-flash"),
    middleware      = require("../middleware"),
    path            = require("path"),
    fs              = require("fs"),
    progress        = require("progress-stream"),
    multer          = require("multer"),
    //upload          = multer({ dest: "public/images"}),
    upload          = multer({ storage: multer.memoryStorage()}),
    //Jimp            = require("jimp"),
    AWS             = require('aws-sdk'),
    Comment         = require("../models/comment"),
    Juoma           = require("../models/juoma");

var perPage = 20; //Determines how many products are loaded per ajaxUpdate()
p = progress();

router.get("/", function(req, res) {
    res.render("drinks/juomat");
});

router.get("/viskit", function(req, res) {
    if(req.xhr) {
        var type = "viskit";
        ajaxUpdate(req, res, type);
    } else {
        res.render("drinks/drinkTypeTemplate", {getUrl: "viskit", drinkCategory: "Viskit"});
    }
});

router.get("/oluet", function(req, res) {
    if (req.xhr) {
        var type = "oluet";
        ajaxUpdate(req, res, type);
    } else {
        res.render("drinks/drinkTypeTemplate", {getUrl: "oluet", drinkCategory: "Oluet"});
    }
});

router.get("/rommit", function(req, res) {
    if(req.xhr) {
        var type = "rommit";
        ajaxUpdate(req, res, type);
    } else {
        res.render("drinks/drinkTypeTemplate", {getUrl: "rommit", drinkCategory: "Rommit"});
    }
});

router.get("/likoorit", function(req, res) {
    if(req.xhr) {
        var type = "likoorit";
        ajaxUpdate(req, res, type);
    } else {
        res.render("drinks/drinkTypeTemplate", {getUrl: "likoorit", drinkCategory: "Liköörit"});
    }
});

router.get("/viinit", function(req, res) {
    if(req.xhr) {
        var type = JSON.parse('{"$in": ["punaviinit", "valkoviinit", "roseeviinit", "kuohuviinit"]}');
        ajaxUpdate(req, res, type);
    } else {
        res.render("drinks/drinkTypeTemplate", {getUrl: "viinit", drinkCategory: "Viinit"});
    }
});

router.get("/viinat", function(req, res) {
    if(req.xhr) {
        var type = "vodkat ja viinat";
        ajaxUpdate(req, res, type);
    } else {
        res.render("drinks/drinkTypeTemplate", {getUrl: "viinat", drinkCategory: "Viinat"});
    }
});

router.get("/konjakit", function(req, res) {
    if(req.xhr) {
        var type = "konjakit";
        ajaxUpdate(req, res, type);
    } else {
        res.render("drinks/drinkTypeTemplate", {getUrl: "konjakit", drinkCategory: "Konjakit"});
    }
});



router.post("/:category/:post_id/comment", middleware.isLoggedIn, function(req, res) {
    Juoma.findById(req.params.post_id, function(err, juoma){
        if(err){
            console.log(err);
            req.flash("error", "Kommentin lisääminen ei onnistunut");
            res.redirect("/");
        } else {
            Comment.create({text: req.body.comment, rating: req.body.stars}, function(err, comment){
                if(err){
                    req.flash("error", "Jotain meni pieleen!");
                    console.log(err);
                } else {

                    //add username and id to comment
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;

                    //save comment
                    comment.save();
                    juoma.comments.push(comment);
                    juoma.rating.push(Number(req.body.stars));
                    juoma.save();

                    req.flash("success", "Kommentti lisätty!");
                    res.redirect('/juomat/' + req.params.category + "/" + juoma._id);
                }
            });
        }
    });
});
router.get("/*/:id/edit", middleware.isLoggedIn, function(req, res) {
    Juoma.findById(req.params.id).populate("comments").exec(function(err, foundDrink){
        if(err) {
            console.log(err);
            console.log("Juomaa ei löytyny databasesta muokkaamista varten");
        } else {

            res.render("drinks/editDrink", {foundDrink : foundDrink});

        }
    });
});

router.post("/*/:id/", middleware.isLoggedIn, upload.single("drinkImg"), function(req, res) {
    Juoma.findById(req.params.id, function (err, juoma) {

        if (err) {
            console.log(err);
            req.flash("error", "Juomaa ei löytynyt :(");
            res.redirect("/");
        } else {
            if(process.env.NODE_ENV === "production") {
                console.log("Were in production mode");

                AWS.config = new AWS.Config({
                    accessKeyId:        process.env.S3_KEY,
                    secretAccessKey:    process.env.S3_SECRET_KEY,
                    region:             "eu-central-1"
                });
            } else {
                console.log("Were in development mode");
                AWS.config.loadFromPath("./secret/awsConfig.json");
            }

            var drinkLink   = "",
                params      = {Bucket: 'alko-app', Key: juoma.id, Body: req.file.buffer},
            s3              = new AWS.S3();

            let uploadPromise = new Promise((resolve, reject) => {
                s3.upload(params, function (err, data) {
                    if (err) {
                        reject();
                    } else {
                        resolve();
                    }
                    console.log(err);
                    console.log(data);
                    drinkLink = data.Location;
                });
            });
            uploadPromise.then(() => {


                juoma.img = drinkLink;
                juoma.save();
                req.flash("success", "Kuva tallennettu!");
                //When the Edit form is posted, it redirects itself to the previous page once the server responds
                res.send("");



            }, () => {
                req.flash("error", "Kuvan uploadaus epäonnistui");
                res.redirect("/juomat/satunnainen/" + juoma.id);
            });
        }
    });
});


router.get("/*/:id/update", middleware.isLoggedIn, function(req, res) {
    Juoma.findById(req.params.id).populate("comments").exec(function(err, foundDrink){
        if(err) {
            console.log(err);
            console.log("Juomaa ei löytyny databasesta muokkaamista varten");
        } else {

            res.render("drinks/update", {foundDrink : foundDrink});

        }
    });
});


router.get("/*/:id", function(req, res) {
    console.log("tää on req.params" + req.params.id);
    Juoma.findById(req.params.id).populate("comments").exec(function(err, foundDrink){
        if(err) {
            console.log(err);
            console.log("Jotain meni vikaan Tuotekuvaus sivu");
        } else if (foundDrink) {
            // console.log(foundDrink);
            foundDrink.views++;
            foundDrink.save();
            Juoma.find({"nimi": foundDrink.nimi }).exec(function(err, otherSizes) {
                if (err) {
                    console.log(err);
                    req.flash("error", "Jotain meni pieleen, ota yhteyttä ylläpitoon");
                } else {
                    res.render("drinks/tuotekuvaus", {foundDrink : foundDrink, otherSizes : otherSizes});
                }
            });

        } else {
            res.render("index/home")
        }
    });
});


//For preventing workload on the server
function escapeRegExp(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}


function ajaxUpdate(req, res, type) {


    var page    = req.query.page,
        sortBy  = req.query.sort,
        asc     = Number(req.query.asc);

        console.log("type: " + type);

    var sort = {[sortBy] : asc}; //this ES6 method of declaring an object saved me, thank god
    //Sanitazes input
    const regex = new RegExp(escapeRegExp(req.query.search), "gi");
    Juoma.aggregate(
        [
            {$match: {
                $and: [{tyyppi: type}, {nimi: regex}]
            }
            },
            {$addFields:
                {avg: {$avg: "$rating"}
                }
            },
            {$sort: sort},
            {$skip: perPage * page },
            {$limit: perPage},
        ]
    ).exec(function(err, drinks) {
        if (err) {
            req.flash("error", "Something went wrong with the server, please contact admin");
            res.redirect("back");
        } else {
            if(drinks.length === 0) {
                var searchMessage = "Antamallasi hakusanalla ei löytynyt tuloksia";
            } else if (req.query.search === "") {
                var searchMessage = "Suosituimmat leiripaikkamme";
            } else {
                var searchMessage = 'Leirintäpaikat haulla "' + req.query.search + '"';
            }
        }
        //allLoaded defines whether data is injected in the upcoming render
        (drinks.length < perPage) ? allLoaded = true : allLoaded = false;

        if(page > 0) {
            res.render("partials/ajax/viskiAjax",
                {
                    foundDrink: drinks,
                    allLoaded: allLoaded,
                    searchMessage: searchMessage
                });
        } else {
            res.render("partials/ajax/viskiAjax",
                {
                    foundDrink: drinks,
                    allLoaded: allLoaded,
                    searchMessage: searchMessage
                });
        }
    });
}



module.exports = router;