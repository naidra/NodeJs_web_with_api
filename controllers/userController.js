const fs = require('fs');
const mongoose = require('mongoose');
const { body, check, validationResult } = require('express-validator');
const User = mongoose.model('User');
const { promisify } = require('es6-promisify');

const multer = require('multer');
const sharp = require('sharp');
const uuid = require('uuid');
const cloudinary = require('../handlers/cloudinary');

const multerOptions = {
    storage: multer.memoryStorage(),
    fileFilter(req, file, next) {
        const isPhoto = file.mimetype.startsWith('image/');
        if(isPhoto) next(null, true);
        else next({ message: 'That filetype isn\'t allowed!' }, false);
    }
};

exports.upload = multer(multerOptions).single('signature');

exports.resize = async (req, res, next) => {
    if (!req.file) {
        next();
        return;
    }
    const extension = req.file.mimetype.split('/')[1];
    req.body.signature = `${uuid.v4()}.${extension}`;
    // Now we resize
    await sharp(req.file.buffer)
        .resize(800)
        .toFile(`./public/uploads/signatures/teknik/${req.body.signature}`);
    // Once we have written the photo to our filesystem, keep going
    next();
};

exports.uploadProfilImage = multer(multerOptions).single('profilImage');

exports.resizeProfilImage = async (req, res, next) => {
    if (!req.file) {
        next();
        return;
    }
    const extension = req.file.mimetype.split('/')[1];
    req.body.profilImage = `${uuid.v4()}.${extension}`;
    // Now we resize
    await sharp(req.file.buffer)
        .resize(800)
        .toFile(`./public/uploads/users/${req.body.profilImage}`);
    // Once we have written the photo to our filesystem, keep going
    next();
};

exports.forgotForm = (req, res) => {
    res.render('forgot', { title: 'Rikthe Fjalkalimin' });
};
exports.loginForm = async (req, res) => {
    res.render('login', { title: 'Identefikohu' });
};

exports.registerForm = async (req, res) => {
    const roles = []; // await Roles.find();
    res.render('register', { title: 'Krijo Klient', roles });
};

exports.registerClientForm = async (req, res) => {
    const packages = []; // await Packages.find();
    const devices = []; // await Devices.find();
    
    // Userat me role: Admin, Administrat munden me kriju usera
    // Useri me rolin administrat mundet me kriju vetem Staf/teknik edhe klient
    let rolesQuery = {};
    if (req.user.role.id === process.env.ADMINISTRAT_ROLE_ID) {
        rolesQuery = {
            _id: {
                $nin: [
                    process.env.ADMIN_ROLE_ID,
                    process.env.ADMINISTRAT_ROLE_ID,
                    process.env.STAFTEKNIK_ROLE_ID
                ]
            }
        };
    }

    const roles = []; // (await Roles.find(rolesQuery)).filter(role => role.id !== process.env.BIZNESPIKA_ROLE_ID);
    
    // check if logged in user is business
    res.render('users/register_client', {
        title: 'Krijo Klientin',
        packages,
        devices,
        roles
    });
};

exports.validateRegister = async (req, res, next) => {
    await body('name').run(req);
    await check('name', 'You must supply a name!').notEmpty().run(req);
    await check('email', 'That Email is not valid!').isEmail().run(req);
    await body('email').normalizeEmail({
        remove_dots: false,
        remove_extension: false,
        gmail_remove_subaddress: false
    }).run(req);
    await check('password', 'Password Cannot Be Blank').notEmpty().run(req);
    await check('password-confirm', 'Confirmed Password Cannot Not Be Blank').notEmpty().run(req);
    await check('password-confirm', 'Oops! Your passwords do not match').equals(req.body.password).run(req);

    const { errors } = validationResult(req);
    if (errors && errors.length) {
        req.flash('error', errors.map(err => err.msg));
        res.render('register', { title: 'Register', body: req.body, flashes: req.flash() });
        return;
    }
    next();
};

exports.register = async (req, res, next) => {
    const user = new User({ ...req.body, email: req.body.email, name: req.body.name });
    const register = promisify(User.register).bind(User);
    await register(user, req.body.password);
    next();
};

exports.registerClient = async (req, res, next) => {
    let albfixId = 1;
    const user = new User({ ...req.body, albfixId });
    const register = promisify(User.register).bind(User);
    const newUser = await register(user, req.body.password);
    return res.json(newUser);
};

exports.account = async (req, res) => {
    res.render('account', { title: 'Edit Your Account' });
};

exports.updateAccount = async (req, res) => {
    const updates = {
        name: req.body.name,
        email: req.body.email
    };

    const user = await User.findOneAndUpdate(
        { _id: req.user._id },
        { $set: updates },
        { new: true, runValidators: true, context: 'query' }
    );

    req.flash('success', 'Updated the profile!');
    res.redirect('back');
};


exports.editClientPost = async (req, res) => {
    if (req.body.onlyBusiness) req.body.onlyBusiness = true;
    else req.body.onlyBusiness = false;
    const user = await User.findOneAndUpdate({ _id: req.params.id }, req.body, {
        new: true, // to return the new updated values
        runValidators: true
    }).exec();
    req.flash('success', `Client successfully changed.`);
    res.redirect('/users/clientsList');
};

exports.deleteClient = async (req, res) => {
    const client = await User.findOneAndDelete({ _id: req.params.id });
    req.flash('success', `Client successfully deleted.`);
    res.redirect('/users/clientsList');
};

exports.changeClientRole = async (req, res) => {
    const user = await User.findOneAndUpdate({ _id: req.params.id }, { role: req.params.roleId }, {
        new: true, // to return the new updated values
        runValidators: true
    }).exec();
    res.json(user);
};

exports.profileEdit = async (req, res) => {
    res.render('users/profile', { title: 'Edito Profilin' });
};

exports.businessClients = async (req, res) => {
    // find all clients that have connectedToBusiness field equal to req.user.id
    const clients = await User.find({ connectedToBusiness: req.user.id });
    res.render('users/list_of_business_clients', { title: 'Klientet e biznesit', clients });
};

exports.userSignature = async (req, res) => {
    // find all clients that have connectedToBusiness field equal to req.user.id
    const clients = await User.find({ connectedToBusiness: req.user.id });
    res.render('users/signature', { title: 'Klientet e biznesit', clients });
};

exports.userSignaturePost = async (req, res) => {
    if (req.file) {
        if (req.user.signature) { // delete image that was uploaded on our server
            if (fs.existsSync(`public/uploads/signatures/teknik/${req.user.signature}`))
                fs.unlinkSync(`public/uploads/signatures/teknik/${req.user.signature}`);
        }
        
        if (req.user.signature) {
            const public_id = req.user.cloudinarySignature.split('public_id=')[1];
            await cloudinary.deleteImage(public_id);
        }
        const { url: newPhotoImage, public_id } = await cloudinary.uploadBuffer(req.file.buffer);
        req.body.cloudinarySignature = `${newPhotoImage}?public_id=${public_id}`;

        const user = await User.findOneAndUpdate({ _id: req.user._id }, req.body, {
            new: true, // to return the new updated values
            runValidators: true
        }).exec();
        req.flash('success', `Nenshkrimi u ndryshua me sukses.`);
    } else {
        req.flash('error', `Nuk u gjet nenshkrimi.`);
    }
    
    res.redirect('/users/signature');
};

exports.userImagePost = async (req, res) => {
    if (req.file) {
        if (req.user.profilImage) { // delete image that was uploaded on our server
            if (fs.existsSync(`public/uploads/users/${req.user.profilImage}`))
                fs.unlinkSync(`public/uploads/users/${req.user.profilImage}`);
        }
        
        if (req.user.cloudinaryProfilImage) {
            const public_id = req.user.cloudinaryProfilImage.split('public_id=')[1];
            await cloudinary.deleteImage(public_id);
        }
        const { url: newPhotoImage, public_id } = await cloudinary.uploadBuffer(req.file.buffer);
        req.body.cloudinaryProfilImage = `${newPhotoImage}?public_id=${public_id}`;

        const user = await User.findOneAndUpdate({ _id: req.user._id }, req.body, {
            new: true, // to return the new updated values
            runValidators: true
        }).exec();
        req.flash('success', `Foto u ndryshua me sukses.`);
    } else {
        req.flash('danger', `Nuk u gjet Foto.`);
    }
    
    return res.redirect('/users/profile');
};