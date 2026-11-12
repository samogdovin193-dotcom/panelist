const { Pool } = require("pg");
require("dotenv").config();

if (
    process.env.NODE_ENV === "test" &&
    process.env.PGDATABASE !== "panelist_test"
) {
    throw new Error("Tests must use panelist_test");
}

const isProduction = process.env.NODE_ENV === "production";

if (isProduction && !process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required in production");
}

const pool = new Pool(
    isProduction
        ? {
            connectionString: process.env.DATABASE_URL
        }
        : {
            host: process.env.PGHOST,
            port: Number(process.env.PGPORT),
            database: process.env.PGDATABASE,
            user: process.env.PGUSER,
            password: process.env.PGPASSWORD
        }
);

module.exports = pool;