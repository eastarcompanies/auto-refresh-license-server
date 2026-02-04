import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ valid: false });

  const { licenseKey } = req.body || {};
  if (!licenseKey) return res.status(200).json({ valid: false });

  const raw = await kv.get(`license:${licenseKey.trim()}`);
  if (!raw) return res.status(200).json({ valid: false });

  try {
    const data = JSON.parse(raw);
    const valid = data.status === "active";
    return res.status(200).json({ valid, status: data.status || "active" });
  } catch {
    return res.status(200).json({ valid: false });
  }
}
