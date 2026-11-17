const { test, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const env = require("../config/env");

if (process.env.NODE_ENV !== "test") {
    throw new Error("Unsafe test configuration: NODE_ENV must be test");
}

if (process.env.PGDATABASE !== "panelist_test") {
    throw new Error("Unsafe test configuration: wrong PostgreSQL database");
}

const pool = require("../db");
const app = require("../app");

beforeEach(async () => {
    const client = await pool.connect();

    try {
        const result = await client.query("SELECT current_database()");
        const databaseName = result.rows[0].current_database;

        if (databaseName !== "panelist_test") {
            throw new Error(`Unsafe database connection: ${databaseName}`);
        }

        await client.query("TRUNCATE TABLE user_titles, titles, users RESTART IDENTITY;");
    } finally {
        client.release();
    }
});

after(async () => {
    await pool.end();
});

test("POST /api/auth/register rejects invalid input", async () => {
    const response = await request(app).post("/api/auth/register").set("Origin", env.appOrigin).send({ email: "invalid-email", username: "ab", password: "123"});

    assert.equal(response.status, 400);
    assert.ok(Array.isArray(response.body.errors));
    assert.ok(response.body.errors.length > 0);
});

test("POST /api/auth/register creates a user", async () => {
    const response = await request(app).post("/api/auth/register").set("Origin", env.appOrigin).send({ email: "reader@example.com", username: "TestReader", password: "TestPassword123!" });

    assert.equal(response.status, 201);
    assert.equal(response.body.email, "reader@example.com");
    assert.equal(response.body.username, "TestReader");
    assert.equal(response.body.password_hash, undefined);

    const result = await pool.query(
        "SELECT * FROM users WHERE email = $1",
        ["reader@example.com"]
    );

    assert.equal(result.rows.length, 1);
    assert.equal(result.rows[0].username, "TestReader");
    assert.notEqual(result.rows[0].password_hash, "TestPassword123!");
});

test("POST /api/auth/register rejects duplicate email", async () => {
    const response = await request(app).post("/api/auth/register").set("Origin", env.appOrigin).send({ email: "reader@example.com", username: "TestReader1", password: "TestPassword12321!" });
    assert.equal(response.status, 201);

    const response2 = await request(app).post("/api/auth/register").set("Origin", env.appOrigin).send({ email: "reader@example.com", username: "TestReader2", password: "TestPassword12345!" });
    assert.equal(response2.status, 409);
    assert.equal(response2.body.error, "An account with this email already exists");
});

test("POST /api/auth/register rejects duplicate username", async () => {
    const response = await request(app).post("/api/auth/register").set("Origin", env.appOrigin).send({ email: "reader1@example.com", username: "TestReader", password: "TestPassword12321!" });
    assert.equal(response.status, 201);
    
    const response2 = await request(app).post("/api/auth/register").set("Origin", env.appOrigin).send({ email: "reader2@example.com", username: "TestReader", password: "TestPassword12345!" });
    assert.equal(response2.status, 409);
    assert.equal(response2.body.error, "An account with this username already exists");
});

test("POST /api/auth/login succeeds with valid credentials", async () => {
    const registerResponse = await request(app).post("/api/auth/register").set("Origin", env.appOrigin).send({ email: "reader@example.com", username: "TestReader", password: "TestPassword123!" });
    assert.equal(registerResponse.status, 201);

    const loginResponse = await request(app).post("/api/auth/login").set("Origin", env.appOrigin).send({ email: "reader@example.com", password: "TestPassword123!"});
    assert.equal(loginResponse.status, 200);
    assert.equal(loginResponse.body.email, "reader@example.com");
    assert.equal(loginResponse.body.password_hash, undefined);
    
    const cookies = loginResponse.headers["set-cookie"];

    assert.ok(cookies);
    assert.ok(cookies.some(cookie => cookie.startsWith("connect.sid=")));
});

test("POST /api/auth/login rejects incorrect password", async () => {
    const registerResponse = await request(app).post("/api/auth/register").set("Origin", env.appOrigin).send({ email: "reader@example.com", username: "TestReader", password: "TestPassword123!" });
    assert.equal(registerResponse.status, 201);

    const loginResponse = await request(app).post("/api/auth/login").set("Origin", env.appOrigin).send({ email: "reader@example.com", password: "TestPassword12345!"});
    assert.equal(loginResponse.status, 401);
    assert.equal(loginResponse.body.error, "Invalid email or password");
    assert.equal(loginResponse.headers["set-cookie"], undefined);
});

test("POST /api/auth/login rejects unknown email", async () => {
    const loginResponse = await request(app).post("/api/auth/login").set("Origin", env.appOrigin).send({ email: "false_reader@example.com", password: "TestPassword123!"});
    assert.equal(loginResponse.status, 401);
    assert.equal(loginResponse.body.error, "Invalid email or password");
    assert.equal(loginResponse.headers["set-cookie"], undefined);
});

test("GET /api/auth/me rejects unauthenticated users", async () => {
    const response = await request(app).get("/api/auth/me");

    assert.equal(response.status, 401);
    assert.equal(response.body.error, "Authentication required");
});

test("GET /api/auth/me accepts authenticated users", async () => {
    const registerResponse = await request(app).post("/api/auth/register").set("Origin", env.appOrigin).send({ email: "reader@example.com", username: "TestReader", password: "TestPassword123!" });
    assert.equal(registerResponse.status, 201);
    
    const agent = request.agent(app);

    const loginResponse = await agent.post("/api/auth/login").set("Origin", env.appOrigin).send({ email: "reader@example.com", password: "TestPassword123!"});
    assert.equal(loginResponse.status, 200);

    const response = await agent.get("/api/auth/me");
    assert.equal(response.status, 200);
    assert.equal(response.body.email, "reader@example.com");
    assert.equal(response.body.username, "TestReader");
    assert.equal(response.body.password_hash, undefined);
});

test("POST /api/auth/logout invalidates the session", async () => {
    const registerResponse = await request(app).post("/api/auth/register").set("Origin", env.appOrigin).send({ email: "reader@example.com", username: "TestReader", password: "TestPassword123!" });
    assert.equal(registerResponse.status, 201);
    
    const agent = request.agent(app);

    const loginResponse = await agent.post("/api/auth/login").set("Origin", env.appOrigin).send({ email: "reader@example.com", password: "TestPassword123!"});
    assert.equal(loginResponse.status, 200);

    const response1 = await agent.get("/api/auth/me");
    assert.equal(response1.status, 200);

    const logoutResponse = await agent.post("/api/auth/logout").set("Origin", env.appOrigin);
    assert.equal(logoutResponse.status, 204);

    const response2 = await agent.get("/api/auth/me");
    assert.equal(response2.status, 401);
    assert.equal(response2.body.error, "Authentication required");
});

test("POST /api/auth/register rejects missing origin", async () => {
    const registerResponse = await request(app).post("/api/auth/register").send({ email: "reader@example.com", username: "TestReader", password: "TestPassword123!" });
    assert.equal(registerResponse.status, 403);
    assert.equal(registerResponse.body.error, "Forbidden origin");

    const result = await pool.query("SELECT COUNT(*)::int AS count FROM users");
    assert.equal(result.rows[0].count, 0);
});

test("POST /api/auth/register rejects incorrect origin", async () => {
    const registerResponse = await request(app).post("/api/auth/register").set("Origin", "https://malicious.example").send({ email: "reader@example.com", username: "TestReader", password: "TestPassword123!" });
    assert.equal(registerResponse.status, 403);
    assert.equal(registerResponse.body.error, "Forbidden origin");

    const result = await pool.query("SELECT COUNT(*)::int AS count FROM users");
    assert.equal(result.rows[0].count, 0);
});