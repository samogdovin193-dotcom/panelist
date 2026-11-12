CREATE TABLE user_titles (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title_id INTEGER NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'plan_to_read' CHECK (status IN ('reading', 'completed', 'on_hold', 'dropped', 'plan_to_read')),
    score SMALLINT CHECK (score BETWEEN 1 AND 10),
    chapters_read NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (chapters_read >= 0),
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, title_id)
);