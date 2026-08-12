export default async function handler(req, res) {

    // =========================
    // CORS
    // =========================

    res.setHeader(
        "Access-Control-Allow-Origin",
        "*"
    );

    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, OPTIONS"
    );

    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type"
    );

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }


    // =========================
    // ONLY GET
    // =========================

    if (req.method !== "GET") {

        return res.status(405).json({
            error: "Method not allowed"
        });

    }


    try {

        // =========================
        // MAL ID
        // =========================

        const malId =
            Number(req.query.malId);

        if (!malId) {

            return res.status(400).json({
                error: "Missing or invalid malId"
            });

        }


        // =========================
        // ANILIST QUERY
        // =========================

        const query = `

            query ($malId: Int) {

                Media(
                    idMal: $malId
                    type: ANIME
                ) {

                    id
                    idMal

                    title {
                        romaji
                        english
                        native
                    }

                    description(
                        asHtml: false
                    )

                    coverImage {
                        large
                        extraLarge
                    }

                    bannerImage

                    averageScore

                    episodes

                    status

                    format

                    season

                    seasonYear

                    duration

                    genres

                    studios(
                        isMain: true
                    ) {
                        nodes {
                            name
                        }
                    }

                    airingSchedule {
                        nodes {
                            episode
                            airingAt
                        }
                    }

                    nextAiringEpisode {
                        episode
                        airingAt
                    }
                }
            }

        `;


        // =========================
        // REQUEST ANILIST
        // =========================

        const response =
            await fetch(
                "https://graphql.anilist.co",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        query,

                        variables: {
                            malId
                        }

                    })
                }
            );


        const result =
            await response.json();


        // =========================
        // ANILIST ERROR
        // =========================

        if (!response.ok) {

            return res
                .status(response.status)
                .json(result);

        }


        if (
            result.errors &&
            result.errors.length > 0
        ) {

            return res.status(500).json({
                error: "AniList returned an error",
                details: result.errors
            });

        }


        // =========================
        // CHECK ANIME
        // =========================

        const anime =
            result.data?.Media;


        if (!anime) {

            return res.status(404).json({

                error:
                    "Anime not found on AniList",

                malId

            });

        }


        // =========================
        // AIRING INFORMATION
        // =========================

        const schedule =
            anime.airingSchedule?.nodes || [];


        const now =
            Math.floor(
                Date.now() / 1000
            );


        // Episodes whose scheduled
        // airing time has passed

        const airedEpisodes =
            schedule
                .filter(
                    function (episode) {

                        return (
                            episode.airingAt <= now
                        );

                    }
                )
                .map(
                    function (episode) {

                        return episode.episode;

                    }
                );


        // Highest episode that has
        // actually reached its airing time

        const airedEpisodeCount =
            airedEpisodes.length > 0
                ? Math.max(...airedEpisodes)
                : 0;


        // =========================
        // NEXT EPISODE
        // =========================

        const nextEpisode =
            anime.nextAiringEpisode
                ?.episode || null;


        const nextAiringAt =
            anime.nextAiringEpisode
                ?.airingAt || null;


        // =========================
        // RETURN CLEAN DATA
        // =========================

        return res.status(200).json({

            malId:
                anime.idMal,

            anilistId:
                anime.id,

            // -------------------------
            // TITLES
            // -------------------------

            titleEnglish:
                anime.title?.english ||
                anime.title?.romaji ||
                "Unknown Anime",

            titleRomaji:
                anime.title?.romaji ||
                "",

            titleJapanese:
                anime.title?.native ||
                "",


            // -------------------------
            // INFORMATION
            // -------------------------

            description:
                anime.description || "",

            coverImage:
                anime.coverImage?.extraLarge ||
                anime.coverImage?.large ||
                "",

            bannerImage:
                anime.bannerImage ||
                "",

            score:
                anime.averageScore
                    ? anime.averageScore / 10
                    : null,

            episodes:
                anime.episodes ||
                null,

            status:
                anime.status ||
                null,

            format:
                anime.format ||
                null,

            season:
                anime.season ||
                null,

            seasonYear:
                anime.seasonYear ||
                null,

            duration:
                anime.duration ||
                null,

            genres:
                anime.genres ||
                [],


            // -------------------------
            // STUDIOS
            // -------------------------

            studios:
                anime.studios?.nodes
                    ?.map(
                        function (studio) {

                            return studio.name;

                        }
                    ) || [],


            // -------------------------
            // AIRING
            // -------------------------

            airedEpisodes:
                airedEpisodeCount,

            nextEpisode:
                nextEpisode,

            nextAiringAt:
                nextAiringAt,

            airingSchedule:
                schedule

        });

    } catch (error) {

        console.error(
            "[AniList Proxy]",
            error
        );


        return res.status(500).json({

            error:
                "Failed to contact AniList",

            message:
                error.message

        });

    }

}
