import { useEffect, useState } from "react";

export default function Success() {
  const [state, setState] = useState({ loading: true, licenseKey: "", status: "", error: "" });

  useEffect(() => {
    const url = new URL(window.location.href);
    const sessionId = url.searchParams.get("session_id");
    if (!sessionId) {
      setState({ loading: false, licenseKey: "", status: "", error: "Missing session_id in URL" });
      return;
    }

    fetch(`/api/license?session_id=${encodeURIComponent(sessionId)}`)
      .then(r => r.json().then(j => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (!ok) throw new Error(j?.error || "Unable to fetch license");
        setState({ loading: false, licenseKey: j.licenseKey, status: j.status, error: "" });
      })
      .catch(() => {
        setState({
          loading: false,
          licenseKey: "",
          status: "",
          error: "License not ready yet. Wait 10 seconds and refresh this page."
        });
      });
  }, []);

  return (
    <main style={{ fontFamily: "system-ui", padding: 24, maxWidth: 720 }}>
      <h1>Payment complete</h1>

      {state.loading && <p>Loading your license...</p>}

      {!state.loading && state.error && (
        <>
          <p style={{ color: "#b00020" }}>{state.error}</p>
          <p>If you just paid, Stripe may take a moment to send the webhook.</p>
        </>
      )}

      {!state.loading && !state.error && (
        <>
          <p>Your license key</p>
          <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8, background: "#fafafa" }}>
            <code style={{ fontSize: 18 }}>{state.licenseKey}</code>
          </div>

          <p style={{ marginTop: 12 }}>
            Status: <b>{state.status}</b>
          </p>

          <h3 style={{ marginTop: 18 }}>Next step</h3>
          <ol>
            <li>Open the Chrome extension popup</li>
            <li>Click I already paid</li>
            <li>Paste this license key</li>
            <li>Click Activate</li>
          </ol>
        </>
      )}

      <p style={{ marginTop: 24 }}>
        <a href="/privacy-policy">Privacy policy</a>
      </p>
    </main>
  );
}
