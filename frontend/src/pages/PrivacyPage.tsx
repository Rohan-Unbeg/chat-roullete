export default function PrivacyPage() {
  return (
    <div className="min-h-[100dvh] text-white p-6 sm:p-12" style={{ background: '#0a0618' }}>
      <div className="max-w-2xl mx-auto">
        <a href="/" className="text-anime-accent text-sm mb-8 inline-block hover:underline">← Back</a>
        <h1 className="text-3xl font-black font-anime mb-2 text-white">
          Privacy <span className="neon-text text-anime-primary">Policy</span>
        </h1>
        <p className="text-gray-400 text-xs mb-8">Last updated: April 2026</p>

        <div className="space-y-6 text-gray-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-white font-bold text-base mb-2">1. What We Collect</h2>
            <p>Anime Roulette is designed to be <strong>privacy-first</strong>. We do not require account registration, email addresses, or any personally identifiable information.</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-400">
              <li>We collect your chosen <strong>nickname</strong> for the duration of your chat session only.</li>
              <li>We collect an approximate <strong>IP address</strong> for abuse prevention (banning).</li>
              <li>We collect <strong>anonymous statistics</strong> (total matches, messages relayed) with no link to individual users.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">2. Chat Messages</h2>
            <p>Chat messages are <strong>relayed in real-time and NOT stored</strong> on our servers. We do not log or retain your conversations. The only exception is when a user submits a <strong>Report</strong>, in which case the last 30 messages of that session are temporarily stored for moderation review.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">3. Cookies</h2>
            <p>We use a single <strong>localStorage</strong> key to remember your mute preference for sound effects. No tracking cookies are used.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">4. Third Parties</h2>
            <p>We use <strong>Google Fonts</strong> for typography, which may set its own cookies per Google's Privacy Policy. No advertising networks or analytics platforms (e.g., Google Analytics) are used.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">5. Minors</h2>
            <p>This service is intended for users <strong>13 years of age or older</strong>. We do not knowingly collect information from children under 13.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">6. Contact</h2>
            <p>Questions? Contact us at <span className="text-anime-accent">support@animeroulette.gg</span> (replace with your actual email).</p>
          </section>
        </div>
      </div>
    </div>
  );
}
