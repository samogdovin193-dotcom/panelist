const { z } = require("zod");

const emailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email());
const usernameSchema = z.string().trim().min(3).max(30).regex(/^[A-Za-z0-9_]+$/);
const passwordSchema = z.string().min(8).max(128);
const loginPasswordSchema = z.string().min(1);

const registerSchema = z.object({
    email: emailSchema,
    username: usernameSchema,
    password: passwordSchema
});

const loginSchema = z.object({
    email: emailSchema,
    password: loginPasswordSchema
});

module.exports = { registerSchema, loginSchema };