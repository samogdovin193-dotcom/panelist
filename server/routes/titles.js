const express = require("express");
const AppError = require("../utils/AppError");

const router = express.Router();

router.get("/search", async (req, res, next) => {
    const searchTerm = req.query.q;
    if (typeof searchTerm !== "string" || !searchTerm.trim()) {
        return res.status(400).json({
            error: "Search query is required"
        });
    }

    const url = new URL("https://api.mangadex.org/manga");
    url.searchParams.set("title", searchTerm.trim());
    url.searchParams.set("limit", "10");
    url.searchParams.append("includes[]", "cover_art");
    let response;

    try {
        response = await fetch(url);
    } catch (error) {
        return next(new AppError("Failed to fetch titles from MangaDex", 502));
    }

    if (!response.ok) {
        throw new AppError("Failed to fetch titles from MangaDex", 502);
    }
    const data = await response.json();
    const results = data.data.map(manga => {
        const attributes = manga.attributes;

        let type = null;
        if(attributes.originalLanguage === "ko"){
            type = "manhwa";
        }else if(attributes.originalLanguage === "zh" || attributes.originalLanguage === "zh-hk"){
            type = "manhua";
        }else if(attributes.originalLanguage === "ja"){
            type = "manga";
        }

        const englishAlternative = attributes.altTitles?.find(item => item.en);

        const title =
            attributes.title?.en ||
            englishAlternative?.en ||
            Object.values(attributes.title ?? {})[0] ||
            "Unknown title";

        const description =
            attributes.description?.en ||
            Object.values(attributes.description ?? {})[0] ||
            null;

        const coverArt = manga.relationships?.find(
            relationship => relationship.type === "cover_art"
        );
        const coverFileName = coverArt?.attributes?.fileName ?? null;
        const mangaId = manga.id;
        const coverUrl = coverFileName ? `https://uploads.mangadex.org/covers/${mangaId}/${coverFileName}` : null;
        
        return {
            id: manga.id,
            title,
            type,
            status: attributes.status,
            year: attributes.year,
            synopsis: description,
            coverUrl
        };
    });

    res.json({
        total: data.total,
        results
    });
});

module.exports = router;