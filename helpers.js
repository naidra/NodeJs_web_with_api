/*
  This is a file of data and helper functions that we can expose and use in our templating function
*/

// FS is a built in module to node that let's us read files from the system we're running on
const fs = require('fs');

// moment.js is a handy library for displaying dates. We need this in our templates to display things like "Posted 5 minutes ago"
// const mmm = require('moment-timezone');
// mmm.tz.setDefault("Europe/Berlin");
exports.moment = require('moment-timezone'); // require('moment');

// Dump is a handy debugging function we can use to sort of "console.log" our data
exports.dump = (obj) => JSON.stringify(obj, null, 2);

// Making a static map is really long - this is a handy helper function to make one
// exports.staticMap = ([lng, lat]) => `https://image.maps.ls.hereapi.com/mia/1.6/mapview?c=${lat}%2C${lng}&w=600&h=250&z=14&nodot=false&style=fleet&i=1&f=1&ppi=72&apiKey=${process.env.HERE_MAP_KEY}`;
exports.staticMap = ([lng, lat]) => `https://image.maps.ls.hereapi.com/mia/1.6/mapview?c=${lat}%2C${lng}&w=600&h=250&z=12&nodot=false&style=fleet&f=1&ppi=72&u=1k&apiKey=${process.env.HERE_MAP_KEY}`;

// inserting an SVG
exports.icon = (name) => fs.readFileSync(`./public/images/icons/${name}.svg`);

// Some details about the site
exports.siteName = `Page`;

exports.menu = [
  { slug: '/stores', title: 'Stores', icon: 'store', },
  { slug: '/tags', title: 'Tags', icon: 'tag', },
  { slug: '/top', title: 'Top', icon: 'top', },
  { slug: '/add', title: 'Add', icon: 'add', },
  { slug: '/map', title: 'Map', icon: 'map', },
];
