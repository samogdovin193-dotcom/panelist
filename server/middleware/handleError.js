const isDevelopment = process.env.NODE_ENV !== "production";
const AppError = require("../utils/AppError");

function handleError(err, req, res, next) {
    if (err.code === "23505" && err.constraint === "users_email_lower_unique") {
        return res.status(409).json({
            "error": "An account with this email already exists"
        });
    }

    if (err.code === "23505" && err.constraint === "users_username_lower_unique") {
        return res.status(409).json({
            error: "An account with this username already exists"
        });
    }

    let statusCode;
    if (typeof err.status === "number" && err.status >= 400 && err.status <= 599) {
        statusCode = err.status;
    } else {
        statusCode = 500;
    }
    if (isDevelopment && statusCode >= 500) {
        console.error("Something went wrong:", err.message);
    }if (err instanceof AppError) {
        return res.status(statusCode).json({
            error: err.message
        });
    }

    return res.status(statusCode).json({
        error: "Internal server error"
    });
}

module.exports = handleError;