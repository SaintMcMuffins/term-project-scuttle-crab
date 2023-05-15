const session = require('express-session');
const pgSession = require("connect-pg-simple")(session);
const ONE_HOUR = 1000 * 60 * 60;
var db;

const addSessionLocals = (request, _response, next) => {
    if (request.session.user !== undefined) {
      request.app.locals.user = {
        ...request.session.user,
      };
    }
  
    next();
  };
  

const sessionDB = (db) =>{
    db = db
};

const sessionMiddleware = session({
  store: new pgSession({ pgPromise: db }),
  secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: ONE_HOUR,
  },
});

module.exports = {sessionDB, sessionMiddleware, addSessionLocals};