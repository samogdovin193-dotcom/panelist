const { findUserById } = require("../repositories/userRepository");
const AppError = require("../utils/AppError");

async function requireAuth(req, res, next) {
    try {
        if (!req.session?.userId) {
            return next(new AppError("Authentication required", 401));
        }

        const user = await findUserById(req.session.userId);
        if (!user) {
            return next(new AppError("Authentication required", 401));
        }
        req.user = user;

        next();
    } catch (error) {
        next(error);
    }
}

module.exports = requireAuth;