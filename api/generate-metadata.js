
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is missing in Vercel Environment Variables."
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

Generate accurate YouTube Shorts metadata based only on visible content.

Return valid JSON:
{
  "title": "Engaging title under 90 characters",
  "description": "1-3 natural sentences",
  "hashtags": ["#Shorts", "#relevantTag", "#relevantTag2"],
  "thumbnailHook": "2-5 words"
}

Do not invent facts.
Use relevant hashtags.
Avoid repetitive generic metadata.`
    }];

    for (const frame of frames.slice(0, 16)) {
      if (!frame || !frame.data) continue;

      const imageData = String(frame.data).replace(
        /^data:image\/[a-zA-Z0-9.+-]+;base64,/,
        ""
      );

      parts.push({
        text: `Video frame at ${Number(frame.time) || 0} seconds`
      });

      parts.push({
        inline_data: {
          mime_type: "image/jpeg",
          data: imageData
        }
      });
    }

    if (parts.length < 5) {
      return res.status(400).json({
        error: "Video frames contain insufficient image data."
      });
    }

    const apiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

    let result = null;
    let lastError = "Gemini request failed.";

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(
          `${apiUrl}?key=${encodeURIComponent(apiKey)}`,
          {
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
                temperature: 0.4,
                maxOutputTokens: 1200
              }
            })
          }
        );

        const responseData = await response.json().catch(() => ({}));

        if (response.ok) {
          result = responseData;
          break;
        }

        lastError =
          responseData?.error?.message ||
          `Gemini API error (${response.status})`;

        const retryable = [
          429, 500, 502, 503, 504
        ].includes(response.status);

        if (!retryable || attempt === 3) {
          return res.status(502).json({
            error: lastError
          });
        }

      } catch (error) {
        lastError =
          error.message || "Gemini network request failed.";

        if (attempt === 3) {
          return res.status(502).json({
            error: lastError
          });
        }
      }

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

    let data;

    try {
      data = JSON.parse(output);
    } catch {
      return res.status(502).json({
        error: "Gemini returned invalid JSON."
      });
    }

    const title = String(data.title || "").trim();
    const description = String(data.description || "").trim();

    const hashtags = [
      ...new Set(
        (Array.isArray(data.hashtags) ? data.hashtags : [])
          .map(tag => {
            const clean = String(tag)
              .trim()
              .replace(/[^\p{L}\p{N}_#]/gu, "");

            if (!clean) return "";

            return clean.startsWith("#")
              ? clean
              : `#${clean}`;
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
      ).trim().slice(0, 40)
    });

  } catch (error) {
    console.error("Generate metadata error:", error);

    return res.status(500).json({
      error: error.message || "Metadata generation failed."
    });
  }
}
