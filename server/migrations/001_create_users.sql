CREATE TABLE users (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email TEXT NOT NULL CHECK (LENGTH(TRIM(email)) > 0),
    username TEXT NOT NULL CHECK (LENGTH(TRIM(username)) > 0),
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX users_email_lower_unique ON users (LOWER(email));
CREATE UNIQUE INDEX users_username_lower_unique ON users (LOWER(username));