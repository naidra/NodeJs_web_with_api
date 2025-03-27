const mongoose = require('mongoose');
const User = mongoose.model('User');
// const Business = mongoose.model('Business');

async function readTheLengthOfACollection(collection, query = {}) {
    const count = await collection.countDocuments(query);
    return count;
}

exports.loginPage = async (req, res) => {
    res.render('login', { title: 'Hyrje' });
};

exports.registerPage = async (req, res) => {
    res.render('register', { title: 'Regjistrimi' });
};

exports.dashboardPage = async (req, res) => {
    // const activeTerminsPage = req.query.activeTerminsPage || 1;
    // const activeBusinessTerminsPage = req.query.activeBusinessTerminsPage || 1;
    // const activeBusinessTerminsReportsPage = req.query.activeBusinessTerminsReportsPage || 1;
    // let termins = await Termins.find(terminsQuery).sort('toBeFinishedAt').skip((activeTerminsPage * 10) - 10).limit(10);
    const users = await User.find();
    return res.render('home/dashboard', { title: 'Dashboard', users });
};
