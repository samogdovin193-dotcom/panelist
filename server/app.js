const express = require("express");
const titlesRouter = require("./routes/titles");
const authRouter = require("./routes/auth");
const handleError = require("./middleware/handleError");
const sessionMiddleware = require("./middleware/session");
const verifyOrigin = require("./middleware/verifyOrigin");
const helmet = require("helmet");
const env = require("./config/env");

const app = express();
if (env.isProduction) {
    app.set("trust proxy", 1);
}
app.set("json spaces", 2);
app.use(helmet());
app.use(express.json());
app.use(verifyOrigin);
app.use(sessionMiddleware);
app.use("/api/titles", titlesRouter);
app.use("/api/auth", authRouter);

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

app.use(handleError);

module.exports = app;