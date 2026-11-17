const argon2 = require("argon2");

async function hashPassword(password) {
    return await argon2.hash(password, {
        type: argon2.argon2id
    });
}

async function verifyPassword(storedHash, enteredPassword) {
    return await argon2.verify(storedHash, enteredPassword);
}

module.exports = { hashPassword, verifyPassword };