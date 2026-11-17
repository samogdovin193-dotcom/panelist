const env = require("../config/env");
const AppError = require("../utils/AppError");

function verifyOrigin(req, res, next) {
    const safeMethods = ["GET", "HEAD", "OPTIONS"];
    if (safeMethods.includes(req.method)){
        return next();
    }

    const origin = req.get("Origin");

    if (origin !== env.appOrigin) {
        return next(new AppError("Forbidden origin", 403));
    }

    next();
}

module.exports = verifyOrigin;