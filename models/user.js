var mongoose                = require("mongoose"),
    passportLocalMongoose   = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
    username: {type: String, unique:true, required: true},
    email: String,
    password: String,
    points: Number,
    isAdmin: {type: Boolean, value: false}
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);