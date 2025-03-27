const mongoose = require('mongoose');
const Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
const md5 = require('md5');
const validator = require('validator');
const bcrypt = require("bcryptjs");
const mongodbErrorHandler = require('mongoose-mongodb-errors');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
    email: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
        validate: [validator.isEmail, 'Invalid Email Address'],
        required: 'Please Supply an email address'
    },
    name: {
        type: String,
        required: 'Please supply a name',
        trim: true
    },
    password: {
        type: String,
        required: true,
        select: false // Hide password by default
    },
    loggedInAs: { type: String },
    lastLoggedIn: { type: Date },
    profilImage: { type: String },
    cloudinaryProfilImage: { type: String },
    created: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date
}, {
    toJSON: { virtuals:true },
    toObject: { virtuals:true }
});

userSchema.virtual('gravatar').get(function() {
    const hash = md5(this.email);
    return `https://gravatar.com/avatar/${hash}?s=200`;
});

userSchema.plugin(passportLocalMongoose, { usernameField: 'email' });
userSchema.plugin(mongodbErrorHandler);

// Hash password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// function autopopulate(next) {
//     this.populate('role');
//     this.populate('package');
//     next();
// }

// userSchema.pre('find', autopopulate);
// userSchema.pre('findOne', autopopulate);

module.exports = mongoose.model('User', userSchema);