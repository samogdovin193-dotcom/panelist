require("dotenv").config();

const nodeEnv = process.env.NODE_ENV || "development";
const port = Number(process.env.PORT ?? 3000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535");
}

if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is required");
}

if (!process.env.APP_ORIGIN) {
    throw new Error("APP_ORIGIN is required");
}

const env = {
    nodeEnv,
    port,
    sessionSecret: process.env.SESSION_SECRET,
    appOrigin: process.env.APP_ORIGIN,
    isProduction: nodeEnv === "production",
    isTest: nodeEnv === "test"
};

module.exports = env;