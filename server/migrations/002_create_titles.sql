CREATE TABLE titles (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    mangadex_id	UUID UNIQUE,
    title TEXT NOT NULL CHECK (LENGTH(TRIM(title)) > 0),
    type TEXT NOT NULL CHECK (type IN ('manhwa', 'manhua', 'manga')),
    synopsis TEXT,
    cover_url TEXT,
    source TEXT NOT NULL CHECK (source IN ('mangadex', 'manual')),
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT titles_source_requirements_check CHECK (
        (
            source = 'manual'
            AND mangadex_id IS NULL
            AND synopsis IS NOT NULL 
            AND LENGTH(TRIM(synopsis)) > 0
            AND cover_url IS NOT NULL 
            AND LENGTH(TRIM(cover_url)) > 0
        )
        OR
        (
            source = 'mangadex'
            AND mangadex_id IS NOT NULL
            AND created_by IS NULL
        )
    )
);

CREATE UNIQUE INDEX titles_title_lower_unique ON titles (LOWER(TRIM(title)), type) WHERE source = 'manual';