const env = require("../config/env");
const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);
const pool = require("../db");

const store = new PgSession({
    pool,
    tableName: "session",
    createTableIfMissing: true
});

const sessionMiddleware = session({
    store,
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: env.isProduction,
        maxAge: 24 * 60 * 60 * 1000
    }
});

module.exports = sessionMiddleware;