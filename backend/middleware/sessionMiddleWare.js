const session = require('express-session');
const cookieParser = require('cookie-parser');
const ONE_HOUR = 1000 * 60 * 60;


const sessionMiddleware = session({
  secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: ONE_HOUR,
  },
});

const cookieMiddleware = cookieParser();
module.exports = { sessionMiddleware, cookieMiddleware };