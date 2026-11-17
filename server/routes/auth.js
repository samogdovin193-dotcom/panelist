const express = require("express");
const router = express.Router();
const validateBody = require("../middleware/validateBody");
const { registerSchema, loginSchema } = require("../validators/authSchemas");
const { hashPassword, verifyPassword } = require("../utils/password");
const { createUser, findUserByEmail } = require("../repositories/userRepository");
const requireAuth = require("../middleware/requireAuth");
const AppError = require("../utils/AppError");

router.post("/register", validateBody(registerSchema), async (req, res, next) => {
    try {
        const { email, username, password } = req.validatedBody;
        const passwordHash = await hashPassword(password);
        const user = await createUser(email, username, passwordHash);

        res.status(201).json(user);
    } catch (error) {
        next(error);
    }
});

router.post("/login", validateBody(loginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.validatedBody;
        const user = await findUserByEmail(email);

        if (!user) {
            return next(new AppError("Invalid email or password", 401));
        }

        const isPasswordValid = await verifyPassword(user.password_hash, password);

        if (!isPasswordValid) {
            return next(new AppError("Invalid email or password", 401));
        }

        req.session.regenerate((error) => {
            if (error) {
                return next(error);
            }
            req.session.userId = user.id;
            req.session.save((error) => {
                if (error) {
                    return next(error);
                }
                res.status(200).json({
                    id: user.id,
                    email: user.email,
                    created_at: user.created_at
                });
            });
        });
    } catch (error) {
        next(error);
    }
});

router.get("/me", requireAuth, (req, res) => {
    res.status(200).json(req.user);
});

router.post("/logout", requireAuth, (req, res, next) => {
    req.session.destroy((error) => {
        if (error) {
            return next(error);
        }

        res.clearCookie("connect.sid");
        res.sendStatus(204);
    });
});

module.exports = router;