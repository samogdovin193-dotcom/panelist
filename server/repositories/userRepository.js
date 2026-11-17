const pool = require("../db");

async function createUser(email, username, passwordHash) {
    const result = await pool.query(
        "INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id, email, username, created_at;",
        [email, username, passwordHash]
    );
    return result.rows[0];
}

async function findUserByEmail(email) {
    const result = await pool.query(
        "SELECT id, email, password_hash, created_at FROM users WHERE LOWER(email) = LOWER($1)",
        [email]
    );
    return result.rows[0];
}

async function findUserById(id) {
    const result = await pool.query(
        "SELECT id, email, username, created_at FROM users WHERE id = $1",
        [id]
    );
    return result.rows[0];
}

module.exports = { createUser, findUserByEmail, findUserById };