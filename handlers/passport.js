const passport = require('passport');
const passportCustom = require('passport-custom');
const CustomStrategy = passportCustom.Strategy;
const mongoose = require('mongoose');
const User = mongoose.model('User');

passport.use(User.createStrategy());
// passport.use('many-data-types', new CustomStrategy(
//     async function(req, done) {
//         let { dataType, password } = req.body;

//         try {
//             const user = await User.findOne({ [dataType]: { $exists: true, $in: [req.body[dataType]] }});

//             if (!user) {
//                 req.flash('warning', 'Incorrect credentials.');
//                 return done(null, false, { message: 'No user found.' });
//             }

//             dataType = dataType.replace(/([A-Z])/g, ' $1').trim(); // add a space when it's a capital letter
//             dataType = dataType.charAt(0).toUpperCase() + dataType.slice(1); // make the first letter uppercase

//             const isMatch = await user.authenticate(password);
//             if (isMatch.error) {
//                 req.flash('warning', `Incorrect '${dataType}' or 'Password'.`);
//                 return done(null, false, { message: isMatch.error });
//             }

//             // check if user role is client
//             if (user.role.id === process.env.KLIENT_ROLE_ID) {
//                 const updatedUser = await User.findOneAndUpdate(
//                     { _id: user._id },
//                     { $set: { lastLoggedIn: Date.now() } },
//                     { new: true, runValidators: true, context: 'query' }
//                 );

//                 await updatedUser.save();
//             }
            
//             return done(null, user);
//         } catch (error) {
//             console.error('Error in passport strategy:', error);
//             return done(error);
//         }
//     }
// ));


passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());