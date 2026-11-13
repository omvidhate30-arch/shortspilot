export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ error: "Missing refresh_token" });

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token,
        grant_type: "refresh_token",
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(400).json(data);

    res.status(200).json({ access_token: data.access_token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
