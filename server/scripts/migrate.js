const fs = require("node:fs/promises");
const path = require("node:path");
const pool = require("../db");
const migrationsDir = path.join(__dirname, "../migrations");

async function getMigrationFiles() {
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter(filename => filename.endsWith(".sql"));
    sqlFiles.sort();
    return sqlFiles;
}

async function ensureMigrationsTable(client) {
    await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            filename TEXT PRIMARY KEY,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);
}

async function getAppliedMigrations(client) {
    const result = await client.query("SELECT filename FROM schema_migrations");

    const names = result.rows.map(row => row.filename);

    return new Set(names);
}

async function applyMigration(client, filename) {
    const filePath = path.join(migrationsDir, filename);
    const sql = await fs.readFile(filePath, "utf8");
    try {
        await client.query("BEGIN");

        await client.query(sql);

        await client.query(
            "INSERT INTO schema_migrations (filename) VALUES ($1);",
            [filename]
        );

        await client.query("COMMIT");

        console.log(`Applied migration: ${filename}`);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }
}

async function runMigrations() {
    const client = await pool.connect();

    try {
        await ensureMigrationsTable(client);

        const files = await getMigrationFiles();

        const applied = await getAppliedMigrations(client);

        const availableFiles = new Set(files);

        for (const filename of applied) {
            if (!availableFiles.has(filename)) {
                throw new Error(`Unknown applied migration: ${filename}`);
            }
        }

        let encounteredPending = false;

        for (const filename of files) {
            if (!applied.has(filename)) {
                encounteredPending = true;
            } else if (encounteredPending) {
                throw new Error("Migration history contains a gap");
            }
        }

        if (applied.size === 0) {
            const result = await client.query(
                "SELECT to_regclass('public.users') AS users_table"
            );

            if (result.rows[0].users_table !== null) {
                throw new Error(
                    "Existing schema has no migration history. Baseline verification required."
                );
            }
        }

        for (const filename of files) {
            if (applied.has(filename)) {
                console.log(`Skipping: ${filename}`);
                continue;
            }

            await applyMigration(client, filename);
        }
    } finally {
        client.release();
    }
}

async function main() {
    try {
        await runMigrations();
        console.log("Migration process completed successfully");
    } catch (error) {
        console.error("Migration failed:", error);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

main();