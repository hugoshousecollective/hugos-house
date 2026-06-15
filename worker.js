const LIST_ID = "677a0d24-68c8-11f1-a685-bf6715868eec";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/subscribe" && request.method === "POST") {
      return handleSubscribe(request, env);
    }

    // Everything else: serve the static site.
    return env.ASSETS.fetch(request);
  }
};

async function handleSubscribe(request, env) {
  let email;
  try {
    const body = await request.json();
    email = (body.email || "").trim();
  } catch {
    return json({ ok: false }, 400);
  }

  if (!email || !email.includes("@")) {
    return json({ ok: false }, 400);
  }

  const res = await fetch(
    `https://api.emailoctopus.com/lists/${LIST_ID}/contacts`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.EO_API_KEY}`
      },
      body: JSON.stringify({
        email_address: email,
        status: "SUBSCRIBED"
      })
    }
  );

  if (res.ok) return json({ ok: true }, 200);

  // Someone signing up twice should not see an error.
  if (res.status === 409) return json({ ok: true }, 200);
  const text = await res.text().catch(() => "");
  if (/exist|conflict/i.test(text)) return json({ ok: true }, 200);

  return json({ ok: false }, 400);
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
