const mongoose = require('mongoose');
const passport = require('passport');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = mongoose.model('User');
const { promisify } = require('es6-promisify');
const SECRET_KEY = process.env.SECRET;

exports.register = async (req, res) => {
    try {
        const user = new User({ ...req.body, email: req.body.email, name: req.body.name });
        const register = promisify(User.register).bind(User);
        await register(user, req.body.password);
        return res.json({ message: 'User registered successfully.' });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};


// Send JSON with post request to /login
// {
//     "email": "abcdefghotmail.com",
//     "password": "12312123"
// }
exports.login = async (req, res, next) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        return res.status(400).json({ message: "User not found" });
    }

    // Compare password with hashed password in the database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
    }

    // Use Passport's built-in login method
    req.login(user, { session: false }, async (err) => {
        if (err) {
            return res.status(400).json({ message: "Login failed" });
        }
        // Generate JWT Token
        const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: "1h" });
        return res.json({ token });
    });
};

// this checks the token that comes with every request from the mobile app
exports.isLoggedIn = async (req, res, next) => {
    // from the request header, we get the token
    const token = req.headers.authorization;
    // verify the token
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = await User.findById(decoded.id);
        return next();
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    return res.status(401).json({ error: 'Unauthorized' });
};

// on every request from the mobile app, we check token is valid
// we send headers.authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpX...
exports.dashboard = async (req, res, next) => {
    const users = await User.find();

    return res.json({ users });
};