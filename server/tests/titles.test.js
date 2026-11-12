const { test, mock } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const app = require("../app");

test("GET /api/titles/search without q returns 400", async () => {
    const response = await request(app).get("/api/titles/search");

    assert.equal(response.status, 400);
    assert.equal(response.body.error, "Search query is required");
});

test("GET /api/titles/search?q=%20%20%20 (spaces only) returns 400", async () => {
    const response = await request(app).get("/api/titles/search?q=%20%20%20");

    assert.equal(response.status, 400);
    assert.equal(response.body.error, "Search query is required");
});

const fakeMangaDexResponse = {
    total: 1,
    data: [
        {
            id: "test-manga-id",
            attributes: {
                title: { en: "Solo Leveling" },
                altTitles: [],
                originalLanguage: "ko",
                status: "completed",
                year: 2018,
                description: {
                    en: "A hunter becomes stronger."
                }
            },
            relationships: [
                {
                    type: "cover_art",
                    attributes: {
                        fileName: "cover.jpg"
                    }
                }
            ]
        }
    ]
};

test("GET /api/titles/search transforms MangaDex data", async (t) => {
    const fetchMock = mock.method(global, "fetch", async () => ({
        ok: true,
        json: async () => fakeMangaDexResponse
    }));

    t.after(() => fetchMock.mock.restore());

    const response = await request(app).get("/api/titles/search?q=solo");
    const manga = response.body.results[0];

    assert.equal(response.status, 200);
    assert.equal(response.body.total, 1);
    assert.equal(response.body.results.length, 1);
    assert.equal(manga.id, "test-manga-id");
    assert.equal(manga.title, "Solo Leveling");
    assert.equal(manga.type, "manhwa");
    assert.equal(manga.status, "completed");
    assert.equal(manga.year, 2018);
    assert.equal(manga.synopsis, "A hunter becomes stronger.");
    assert.equal(manga.coverUrl, "https://uploads.mangadex.org/covers/test-manga-id/cover.jpg");
});

test("GET /api/titles/search handles missing cover art", async (t) => {
    const fakeResponseWithoutCover = structuredClone(fakeMangaDexResponse);
    fakeResponseWithoutCover.data[0].relationships = [];

    const fetchMock = mock.method(global, "fetch", async () => ({
        ok: true,
        json: async () => fakeResponseWithoutCover
    }));

    t.after(() => fetchMock.mock.restore());

    const response = await request(app).get("/api/titles/search?q=solo");
    const manga = response.body.results[0];

    assert.equal(response.status, 200);
    assert.equal(manga.coverUrl, null);
});

test("GET /api/titles/search handles MangaDex errors", async (t) => {
    const fakeResponseWithoutCover = structuredClone(fakeMangaDexResponse);
    fakeResponseWithoutCover.data[0].relationships = [];

    const fetchMock = mock.method(global, "fetch", async () => ({
        ok: false,
        status: 500
    }));

    t.after(() => fetchMock.mock.restore());

    const response = await request(app).get("/api/titles/search?q=solo");

    assert.equal(response.status, 502);
    assert.equal(response.body.error, "Failed to fetch titles from MangaDex");
});

test("GET /api/titles/search handles network failure", async (t) => {
    const fetchMock = mock.method(global, "fetch", async () => {
        throw new Error("Network connection failed");
    });

    t.after(() => fetchMock.mock.restore());

    const response = await request(app).get("/api/titles/search?q=solo");

    assert.equal(response.status, 502);
    assert.equal(response.body.error, "Failed to fetch titles from MangaDex");
});