const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const apiController = require('../controllers/apiController');
const User = require('../models/User');
const { catchErrors } = require('../handlers/errorHandlers');

router.get('/forgot', userController.forgotForm);
router.post('/forgot', authController.forgot);
router.get('/login', userController.loginForm);
router.post('/login', authController.login);
// router.post('/loginImpersonate', authController.forceLoginIfImpersonated);
router.get('/register', userController.registerForm);
router.post('/register',
    // authController.checkRole,
    userController.validateRegister,
    userController.register,
    authController.login
);
router.get('/register/client', authController.checkRole, userController.registerClientForm);
router.post('/register/client',
    // authController.checkRole,
    // userController.validateRegister,
    userController.registerClient,
    // authController.login
);
router.get('/logout', authController.logout);
router.get('/logoutOfTimeout', authController.logoutOfTimeout);
router.get('/account', authController.isLoggedIn, userController.account);
router.post('/account', authController.isLoggedIn, catchErrors(userController.updateAccount));
router.post('/account/forgot', catchErrors(authController.forgot));
router.get('/account/reset/:token', catchErrors(authController.reset));
router.post('/account/reset/:token',
    authController.confirmedPasswords,
    catchErrors(authController.update)
);
router.post('/account/update/password',
    authController.confirmedPasswords,
    catchErrors(authController.updatePassword)
);
router.post('/loginClientAs', authController.isLoggedIn, catchErrors(authController.loginClientAs));

router.get('/', authController.isLoggedIn, catchErrors(homeController.dashboardPage));
router.get('/dashboard', authController.isLoggedIn, catchErrors(homeController.dashboardPage));

// router.get('/clientDevices', authController.checkRole, authController.isLoggedIn, catchErrors(clientDevicesController.clientDevicesPage));
// router.get('/clientDevices/create', authController.checkRole, authController.isLoggedIn, catchErrors(clientDevicesController.clientDevicesCreate));
// router.post('/clientDevices/create',
//     authController.checkRole,
//     authController.isLoggedIn,
//     terminsController.upload,
//     terminsController.resize,
//     catchErrors(clientDevicesController.clientDevicesCreatePost)
// );
// router.get('/clientDevices/edit/:id', authController.checkRole, authController.isLoggedIn, catchErrors(clientDevicesController.clientDeviceEdit));
// router.post('/clientDevices/edit/:id',
//     authController.checkRole,
//     authController.isLoggedIn,
//     terminsController.upload,
//     terminsController.resize,
//     catchErrors(clientDevicesController.clientDeviceEditPost)
// );
// router.get('/clientDevices/delete/:id', authController.checkRole, authController.isLoggedIn, catchErrors(clientDevicesController.clientDeviceDelete));

// router.post('/users/profile/image',
//     authController.checkRole,
//     authController.isLoggedIn,
//     userController.uploadProfilImage,
//     userController.resizeProfilImage,
//     catchErrors(userController.userImagePost)
// );

router.post('/api/register', apiController.register);
router.post('/api/login', apiController.login);
router.get('/api/dashboard', apiController.isLoggedIn, apiController.dashboard);

module.exports = router;