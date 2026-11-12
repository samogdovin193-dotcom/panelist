const express = require("express");
const helmet = require("helmet");
const titlesRouter = require("./routes/titles");
const handleError = require("./middleware/handleError");

const app = express();
app.set("json spaces", 2);
app.use(helmet());
app.use(express.json());
app.use("/api/titles", titlesRouter);

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

app.use(handleError);

module.exports = app;