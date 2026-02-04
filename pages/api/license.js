import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  const { session_id } = req.query || {};
  if (!session_id) return res.status(400).json({ error: "missing session_id" });

  const licenseKey = await kv.get(`session:${session_id}`);
  if (!licenseKey) return res.status(404).json({ error: "not found" });

  const raw = await kv.get(`license:${licenseKey}`);
  let status = "active";
  try {
    status = raw ? JSON.parse(raw).status : "active";
  } catch {}

  return res.status(200).json({ licenseKey, status });
}
