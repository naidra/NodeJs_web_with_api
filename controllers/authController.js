const passport = require('passport');
const passportCustom = require('passport-custom');
const CustomStrategy = passportCustom.Strategy;
const mongoose = require('mongoose');
const User = mongoose.model('User');
const crypto = require('crypto');
const { isErrored } = require('stream');
const { promisify } = require('es6-promisify');
const mail = require('../handlers/mail');

// exports.login = passport.authenticate('many-data-types', {
exports.login = passport.authenticate('local', {
    failureRedirect: '/login',
    // failureFlash: 'Failed Login',
    successRedirect: '/',
    successFlash: 'Ju jeni kyqur me sukses!'
});

exports.logout = async (req, res) => {
    // find the logged in user and update the lastLoggedIn field by setting year to 2000
    const dateOfLogout = new Date(req.user ? req.user.lastLoggedIn : '');
    dateOfLogout.setFullYear(2000);
    const user = await User.findOneAndUpdate({ _id: req.user._id }, {
        $set: { lastLoggedIn: dateOfLogout }
    }, { new: true, runValidators: true, context: 'query' });

    req.logout(() => {
        req.flash('success', 'Je shkeputur nga sistemi (logged out)!');
        res.redirect('/');
    });
};

exports.logoutOfTimeout = async (req, res) => {
    // const dateOfLogout = new Date(req.user ? req.user.lastLoggedIn : '');
    // dateOfLogout.setFullYear(2000);
    // const user = User.findOneAndUpdate({ _id: req.user._id }, {
    //     $set: { lastLoggedIn: dateOfLogout }
    // }, { new: true, runValidators: true, context: 'query' });

    // await new Promise(resolve => setTimeout(resolve, 1000));

    req.logout(() => {
        req.flash('success', 'Jeni shkeputur nga sistemi per shkak te timeout (logged out)!');
        res.redirect('/');
    });
};

exports.isLoggedIn = async (req, res, next) => {
    if (req.isAuthenticated()) {
        next();
        return;
    }
    req.flash('error', 'Duhet te jeni i kyqur per te pare kete faqe!');
    res.redirect('/login');
};

exports.forgot = async (req, res) => {
    // 1. See if a user with that email exists
    let user = new User();
    if (req.body.dataType === 'email') {
        user = await User.findOne({ email: req.body.email });
    } else if (req.body.dataType === 'name') {
        user = await User.findOne({ name: req.body.name });
    } else if (req.body.dataType === 'personalId') {
        user = await User.findOne({ personalId: req.body.personalId });
    } else if (req.body.dataType === 'contractNumner') {
        user = await User.findOne({ contractNumner: req.body.contractNumner });
    }

    if (!user) {
        req.flash('error', 'Asnje llogari nuk eshte gjetur me kete email adres!');
        return res.redirect('/login');
    }
    // 2. Set reset tokens and expiry an their account
    user.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
    await user.save();
    // 3. Send them an email with the token
    const resetURL = `http://${req.headers.host}/account/reset/${user.resetPasswordToken}`;
    // await mail.send({
    mail.send({
        user,
        filename: 'password-reset',
        subject: 'Password Reset',
        resetURL
    });

    req.flash('success', `You have been emailed a password reset link.`);
    // 4. redirect to login page
    res.redirect('/');
};

exports.reset = async (req, res) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        req.flash('error', 'Reset passwordi eshte invalid ose ka skaduar!');
        return res.redirect('/login');
    }
    // if there is a user, show the reset password form
    res.render('reset', { title: 'Resetoni paswordin' });
};

exports.confirmedPasswords = async (req, res, next) => {
    if (req.body.password === req.body['password-confirm']) {
        next(); // keepit going!
        return;
    }
    req.flash('error', 'Paswordet nuk perputhen!');
    res.redirect('back');
};

exports.update = async (req, res, next) => {
    const user = await User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        req.flash('error', 'Reset passwordi eshte invalid ose ka skaduar!');
        return res.redirect('/login');
    }

    const setPassword = promisify(user.setPassword).bind(user);
    await setPassword(req.body.password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    const updatedUser = await user.save();
    await req.login(updatedUser);
    req.flash('success', 'Passwordi juaj eshte ndryshuar me sukses! Ju jeni tani te kyqur!');
    res.redirect('/');
};

exports.checkRole = async (req, res, next) => {
    if (
        req.user && req.user.role &&
        (
            req.user.role.endpoints.includes(req.path.split('/').slice(0, 3).join('/')) ||
            req.user.role._id == process.env.ADMIN_ROLE_ID
        )
    ) next();
    else res.redirect('/');
};

// exports.forceLoginIfImpersonated = async (req, res, next) => {
//     let searched = false;
//     if (
//             req.user &&
//             req.user.role.id === process.env.BIZNES_ROLE_ID
//         ) {
//         User.findOne({
//             email: req.body.email,
//             connectedToBusiness: req.user.id
//         }, function(err, user) {
//             req.logIn(user, function(err) { // log in this user
//                 searched = true;
//                 if (!err) return res.redirect('/');
//             });
//         });
//     }
//     // wait for the above async code to finish
//     while (!searched) {
//         await new Promise(resolve => setTimeout(resolve, 100));
//     }
    
//     if (!searched) return res.redirect('/businessClients');
// };

exports.loginClientAs = async (req, res, next) => {
    // lastLoggedIn is in this format '2024-01-06T10:39:29.777Z'
    // subtrackt 7 minutes from it
    const lastLoggedIn = new Date(req.user ? req.user ? req.user.lastLoggedIn : '' : '');
    lastLoggedIn.setMinutes(lastLoggedIn.getMinutes() - 7);

    const updatedUser = await User.findOneAndUpdate({ _id: req.user._id }, {
            $set: {
                loggedInAs: req.body.loginType,
                lastLoggedIn: lastLoggedIn
            }
        },
        { new: true, runValidators: true, context: 'query' }
    );
    await updatedUser.save();
    return res.redirect('/');
};

exports.updatePassword = async (req, res, next) => {
    const user = await User.findById(req.user._id);
    
    if (!user) {
        req.flash('danger', 'Useri nuk u gjet!');
        return res.redirect('/users/profile');
    }

    // check if the actual password is correct
    const checkPassword = promisify(user.authenticate).bind(user);
    const valid = await checkPassword(req.body.actualPassword);
    if (!valid) {
        req.flash('danger', 'Passwordi aktual nuk eshte i sakte!');
        return res.redirect('/users/profile');
    }

    const setPassword = promisify(user.setPassword).bind(user);
    await setPassword(req.body.password);
    const updatedUser = await user.save();
    await req.login(updatedUser);
    req.flash('success', 'Passwordi juaj eshte ndryshuar me sukses! Ju jeni tani te kyqur!');
    res.redirect('/users/profile');
};