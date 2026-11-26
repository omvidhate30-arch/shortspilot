
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is not configured in Vercel."
    });
  }

  try {
    const { frames, duration } = req.body || {};

    if (!Array.isArray(frames) || frames.length < 2) {
      return res.status(400).json({
        error: "At least two video frames are required."
      });
    }

    const parts = [{
      text: `Analyze these frames from a ${Number(duration) || "unknown"} second video.

Create unique YouTube Shorts metadata based only on visible content.

Return JSON only:
{
  "title": "Engaging accurate title under 90 characters",
  "description": "1-3 natural sentences",
  "hashtags": ["#relevantTag1", "#relevantTag2", "#relevantTag3"],
  "thumbnailHook": "2-5 words"
}

Do not invent facts.
Generate relevant hashtags based on the video.
Avoid generic repetitive metadata.`
    }];

    for (const frame of frames.slice(0, 24)) {
      if (!frame.data) continue;

      parts.push({
        text: `Frame at ${Number(frame.time) || 0} seconds`
      });

      parts.push({
        inline_data: {
          mime_type: "image/jpeg",
          data: frame.data
        }
      });
    }

    const apiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=" +
      encodeURIComponent(apiKey);

    let result = null;
    let lastError = "Gemini request failed.";

    // Retry temporary Gemini server errors
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts
            }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.65
            }
          })
        });

        const responseData = await response.json();

        if (response.ok) {
          result = responseData;
          break;
        }

        lastError =
          responseData?.error?.message || "Gemini request failed.";

        const temporaryError =
          response.status === 429 ||
          response.status === 500 ||
          response.status === 502 ||
          response.status === 503 ||
          response.status === 504;

        if (!temporaryError || attempt === 3) {
          return res.status(response.status).json({
            error: lastError
          });
        }
      } catch (error) {
        lastError = error.message || "Network request failed.";

        if (attempt === 3) {
          return res.status(502).json({
            error: lastError
          });
        }
      }

      // Wait before retry: 1 second, then 2 seconds
      await new Promise(resolve =>
        setTimeout(resolve, attempt * 1000)
      );
    }

    if (!result) {
      return res.status(503).json({
        error: lastError
      });
    }

    const output = result?.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("")
      .trim();

    if (!output) {
      return res.status(502).json({
        error: "Gemini returned an empty response."
      });
    }

    const data = JSON.parse(output);

    const title = String(data.title || "").trim();
    const description = String(data.description || "").trim();

    const hashtags = [
      ...new Set(
        (Array.isArray(data.hashtags) ? data.hashtags : [])
          .map(tag => {
            const clean = String(tag)
              .trim()
              .replace(/[^\p{L}\p{N}_#]/gu, "");

            return clean.startsWith("#")
              ? clean
              : "#" + clean;
          })
          .filter(tag => tag.length > 1)
      )
    ].slice(0, 5);

    if (!title || !description || !hashtags.length) {
      return res.status(502).json({
        error: "Gemini metadata was incomplete."
      });
    }

    return res.status(200).json({
      title: title.slice(0, 95),
      description: description.slice(0, 1800),
      hashtags,
      thumbnailHook: String(
        data.thumbnailHook || title
      ).slice(0, 40)
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message || "Metadata generation failed."
    });
  }
}
