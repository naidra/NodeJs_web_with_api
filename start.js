try {
  const mongoose = require('mongoose');

  // import environmental variables from our variables.env file
  require('dotenv').config({ path: 'variables.env' });

  // Connect to our Database and handle an bad connections
  mongoose.connect(process.env.DATABASE, {});
  mongoose.Promise = global.Promise; // Tell Mongoose to use ES6 promises
  mongoose.connection
    .on('connected', () => {
      console.log('Connected to MongoDB');
    }).on('error', (err) => {
      console.error(`🙅 🚫 🙅 🚫 🙅 🚫 🙅 🚫 → ${err.message}`);
    });

  // import all of our models
  require('./models/User');
  // require('./models/ClientDevices');

  // Start our app!
  const app = require('./app');
  app.set('port', process.env.PORT || 7777);
  const server = app.listen(app.get('port'), () => {
    console.log(`Express running → PORT ${server.address().port}`);
  });
} catch (e) {
  console.log('Error from env require')
  console.log(e)
}