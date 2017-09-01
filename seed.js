var mongoose = require("mongoose"),
    Juoma = require("./models/juoma"),
    fs = require("fs"),
    node_xj = require("xls-to-json-lc");


var file = "./output.json",
    juomaData = [];


function seedDB() {
    console.log("Ollaan seed.db sisällä");

    node_xj({
        input: "alko.xls",      // input xls 
        output: "output.json",  // output json 
        sheet: "Alkon Hinnasto Tekstitiedostona",  // specific sheetname in the .xls
        lowerCaseHeaders: true
    }, function (err, result, hello) {
        if (err) {
            console.error(err);
        } else {
            console.log(result);
            fs.readFile(file, "utf8", function (err, data) {
                if (err) {
                    console.log(err);
                    console.log("error reading the file");
                } else {
                    console.log(typeof(data));
                    juomaData = JSON.parse(data);
                    console.log("juomaData luettu ja tallennu muuttujaan");

                    //remove previous data from DB
                    Juoma.remove({}, function (err) {
                        if (err) {
                            console.log(err);
                            console.log("Error while deleting drinks");
                        } else {
                            console.log("Drinks removed!");

                            //Loop over the array and ADD each item
                            juomaData.forEach(function (seed) {
                                //Add "Tyyppi" for drinks using data parsed from hintajärjestyskoodi
                                if (seed.tyyppi === "") {
                                    seed = addDrinkType(seed);
                                }
                                seed = convertToCents(seed);

                                Juoma.create(seed, function (err, juoma) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        //SAVE each item
                                        juoma.save();
                                        console.log("Saved a drink");
                                    }
                                });
                            });
                        }
                    });
                }
            });
        }
    });
}




function addDrinkType(seed) {
    console.log("Lisäillään juomatyyppejä");
    if (seed.hinnastojärjestyskoodi === "S90") {
        seed.tyyppi = "vodkat ja viinat"
    } else if (seed.hinnastojärjestyskoodi === "S30" || seed.hinnastojärjestyskoodi === "415") {
        seed.tyyppi = "vodkat ja viinat"
    } else if (seed.hinnastojärjestyskoodi === "S20") {
        seed.tyyppi = "konjakit"
    } else if (seed.hinnastojärjestyskoodi === "S10") {
        seed.tyyppi = "muut viinit"
    } else if (seed.hinnastojärjestyskoodi === "H40") {
        seed.tyyppi = "hanavalkoviinit"
    } else if (seed.hinnastojärjestyskoodi === "H30") {
        seed.tyyppi = "hanaroseeviinit"
    } else if (seed.hinnastojärjestyskoodi === "H20") {
        seed.tyyppi = "hanapunaviinit"
    } else if (seed.hinnastojärjestyskoodi === "710") {
        seed.tyyppi = "alkoholittomat"
    } else if (seed.hinnastojärjestyskoodi === "S40") {
        seed.tyyppi = "likoorit"
    } else if (seed.hinnastojärjestyskoodi === "S50" ||
        seed.hinnastojärjestyskoodi === "S60" ||
        seed.hinnastojärjestyskoodi === "S70" ||
        seed.hinnastojärjestyskoodi === "S80" ) {
        seed.tyyppi = "kuohuviinit"
    }
    return seed;
}


function convertToCents(seed) {
    console.log("test");
    //convert to cents for better mongoose usability
    //The cents are rounded to prevent quirky decimal behaviour
    seed.hinta = Math.round(seed.hinta * 100);
    seed.litrahinta = Math.round(seed.litrahinta * 100);
    return seed;
}



module.exports = seedDB;