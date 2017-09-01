var mongoose        = require("mongoose"),
    AutoIncrement   = require('mongoose-sequence')(mongoose);

var juomaSchema = new mongoose.Schema({
    numero: String,
    nimi: String,
    valmistaja: String,
    pullokoko: String,
    hinta: Number,
    litrahinta: Number,
    uutuus: String,
    tyyppi: String,
    erityisryhmä: String,
    oluttyyppi: String,
    valmistusmaa: String,
    alue: String,
    hinnastojärjestyskoodi: String,
    vuosikerta: String,
    etikettimerkintöjä: String,
    huomautus: String,
    rypäleet: String,
    luonnehdinta: String,
    pakkaustyyppi: String,
    suljentatyppi: String, //not a typo, it's written that way in the .xlsx file
    "alkoholi-%": Number,
    "energia kcal/100 ml": String,
    valikoima: String,
    img: String,
    views: {default: 0, type: Number},
    rating: [],
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }    
    ]
});


//Used on the product page
juomaSchema.methods.getAvarageRating = function() {
    if (this.rating.length !== 0) {
        var totalScore = 0;
        this.rating.forEach(function(drinkRating) {
            totalScore += drinkRating
        });
        return totalScore/this.rating.length;
    } else {
        return 0;
    }
};

module.exports = mongoose.model("Juoma", juomaSchema);
