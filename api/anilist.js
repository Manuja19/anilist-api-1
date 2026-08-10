export default async function handler(req, res) {

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

    try {

        const malId =
            Number(req.query.malId);

        if (!malId) {

            return res.status(400).json({
                error: "Missing or invalid malId"
            });

        }

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

                    episodes
                    status

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

        const response = await fetch(
            "https://graphql.anilist.co",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
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

        if (!response.ok) {

            return res
                .status(response.status)
                .json(result);

        }

        return res
            .status(200)
            .json(result);

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            error:
                "Failed to contact AniList",

            message:
                error.message

        });

    }
}
