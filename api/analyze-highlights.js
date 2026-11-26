// Vercel serverless endpoint: /api/analyze-highlights
// Keep GEMINI_API_KEY in Vercel Environment Variables.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is not configured on the server."
    });
  }

  try {
    const { frames, duration, requestedClips = 3 } = req.body || {};

    if (!Array.isArray(frames) || frames.length < 2) {
      return res.status(400).json({
        error: "Send at least two sampled video frames."
      });
    }

    const safeFrames = frames.slice(0, 24).map((frame, index) => {
      const raw =
        typeof frame === "string"
          ? frame
          : frame?.dataUrl || frame?.image || "";

      const match = raw.match(
        /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/
      );

      if (!match) {
        throw new Error(
          `Frame ${index + 1} is not a supported base64 image.`
        );
      }

      return {
        mimeType: match[1],
        data: match[2],
        timestamp:
          typeof frame === "object"
            ? Number(frame.timestamp) || 0
            : 0
      };
    });

    const parts = [
      {
        text:
          `Analyze these sampled frames from a video. Video duration: ${Number(duration) || "unknown"} seconds. ` +
          `Suggest exactly ${Math.max(1, Math.min(5, Number(requestedClips) || 3))} distinct highlight segments ` +
          `suitable for YouTube Shorts. Use timestamps in seconds. Each segment should be 15 to 60 seconds ` +
          `when the source allows it, avoid overlap, avoid dead/blank sections, and do not invent events not visible. ` +
          `Return ONLY valid JSON in this schema: ` +
          `{"highlights":[{"start":0,"end":30,"reason":"...","hook":"..."}]}. ` +
          `The timestamps supplied with each image identify its approximate position in the video.`
      },
      ...safeFrames.flatMap((frame) => [
        { text: `Frame timestamp: ${frame.timestamp} seconds` },
        {
          inline_data: {
            mime_type: frame.mimeType,
            data: frame.data
          }
        }
      ])
    ];

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
            temperature: 0.2
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

    const text = result?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    if (!text) {
      return res.status(502).json({
        error: "Gemini returned an empty response."
      });
    }

    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch {
      return res.status(502).json({
        error: "Gemini returned invalid JSON.",
        raw: text
      });
    }

    const maxDuration =
      Number(duration) > 0 ? Number(duration) : Infinity;

    const highlights = (
      Array.isArray(parsed.highlights) ? parsed.highlights : []
    )
      .map((item) => ({
        start: Math.max(0, Number(item.start) || 0),
        end: Math.min(maxDuration, Number(item.end) || 0),
        reason: String(item.reason || ""),
        hook: String(item.hook || "")
      }))
      .filter((item) => item.end > item.start)
      .slice(0, 5);

    if (!highlights.length) {
      return res.status(502).json({
        error: "No valid highlight segments were returned."
      });
    }

    return res.status(200).json({ highlights });

  } catch (error) {
    return res.status(400).json({
      error: error?.message || "Invalid request."
    });
  }
}
