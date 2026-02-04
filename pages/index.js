export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui", padding: 24, maxWidth: 720 }}>
      <h1>Auto Refresh Pro</h1>
      <p>This site handles payments and license activation for the Chrome extension.</p>

      <p>
        After purchase, your license will appear on the success page:
        <br />
        <code>/success?session_id=CHECKOUT_SESSION_ID</code>
      </p>

      <p>
        Privacy policy: <a href="/privacy-policy">/privacy-policy</a>
      </p>
    </main>
  );
}
