export default function PrivacyPolicy() {
  return (
    <main style={{ fontFamily: "system-ui", padding: 24, maxWidth: 860 }}>
      <h1>Privacy Policy</h1>
      <p>
        This website is used to provide payment confirmation and license activation for the Auto Refresh Pro Chrome extension.
      </p>
      <h2>Data collected</h2>
      <ul>
        <li>Stripe sends payment metadata to this server via webhook (for example session id and customer id).</li>
        <li>This server stores a generated license key and its activation status.</li>
      </ul>
      <h2>Data not collected</h2>
      <ul>
        <li>No browsing history is collected.</li>
        <li>No page content is collected.</li>
      </ul>
      <h2>Contact</h2>
      <p>If you need support, contact the publisher email shown on the Chrome Web Store listing.</p>
    </main>
  );
}
