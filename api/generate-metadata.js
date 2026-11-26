
// Gemini video-specific Shorts metadata endpoint
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
Do not invent facts or use generic repetitive metadata.
Generate hashtags specifically for the visible subject and action in these frames.
Do not force #Shorts, #Viral, #Trending, or any fixed hashtag unless it is genuinely relevant.
Use different, content-specific hashtags for each different video.`
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

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      encodeURIComponent(apiKey),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.65
          }
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: result?.error?.message || "Gemini request failed."
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
            const clean = String(tag).trim()
              .replace(/[^\p{L}\p{N}_#]/gu, "");
            return clean.startsWith("#") ? clean : "#" + clean;
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
      thumbnailHook: String(data.thumbnailHook || title).slice(0, 40)
    });

  } catch (error) {
    return res.status(500).json({
      error: error.message || "Metadata generation failed."
    });
  }
}
