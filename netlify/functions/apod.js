// Proxies NASA's Astronomy Picture of the Day.
// The API key lives in a Netlify environment variable and never reaches the browser.
// Set it at: Site settings → Environment variables → NASA_API_KEY

exports.handler = async (event) => {
  const key = process.env.NASA_API_KEY;

  if (!key) {
    return json(500, {
      error: "no_key",
      message: "NASA_API_KEY isn't set on this site. Add it in Netlify under Site settings → Environment variables, then redeploy."
    });
  }

  // Only a date may be passed in, and only in YYYY-MM-DD form.
  // Anything else is ignored rather than forwarded.
  const date = (event.queryStringParameters || {}).date;
  const params = new URLSearchParams({ api_key: key, thumbs: "true" });
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) params.set("date", date);

  try {
    const res = await fetch(`https://api.nasa.gov/planetary/apod?${params}`);

    if (res.status === 429) {
      return json(429, { error: "rate_limit", message: "NASA rate limit reached. Try again shortly." });
    }
    if (res.status === 403) {
      return json(403, { error: "bad_key", message: "NASA rejected the API key. Check NASA_API_KEY in Netlify." });
    }
    if (!res.ok) {
      return json(res.status, { error: "upstream", message: `NASA returned ${res.status}.` });
    }

    const d = await res.json();

    // Pass through only what the app renders. Note `copyright`:
    // APOD images with this field are NOT public domain.
    return json(200, {
      date: d.date,
      title: d.title,
      explanation: d.explanation,
      media_type: d.media_type,
      url: d.media_type === "video" ? (d.thumbnail_url || d.url) : d.url,
      hdurl: d.hdurl || null,
      link: d.media_type === "video" ? d.url : null,
      copyright: d.copyright ? d.copyright.replace(/\s+/g, " ").trim() : null
    }, 21600); // cache 6h at the edge
  } catch (e) {
    return json(502, { error: "fetch_failed", message: "Couldn't reach NASA." });
  }
};

function json(status, body, maxAge) {
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": maxAge ? `public, max-age=${maxAge}` : "no-store"
    },
    body: JSON.stringify(body)
  };
}
