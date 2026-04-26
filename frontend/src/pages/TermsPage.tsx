export default function TermsPage() {
  return (
    <div className="min-h-[100dvh] text-white p-6 sm:p-12" style={{ background: '#0a0618' }}>
      <div className="max-w-2xl mx-auto">
        <a href="/" className="text-anime-accent text-sm mb-8 inline-block hover:underline">← Back</a>
        <h1 className="text-3xl font-black font-anime mb-2 text-white">
          Terms of <span className="neon-text text-anime-primary">Service</span>
        </h1>
        <p className="text-gray-400 text-xs mb-8">Last updated: April 2026</p>

        <div className="space-y-6 text-gray-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-white font-bold text-base mb-2">1. Acceptance</h2>
            <p>By using Anime Roulette, you agree to these Terms. If you don't agree, please don't use the service. It's that simple.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">2. Prohibited Conduct</h2>
            <p>The following are strictly prohibited and will result in an <strong>immediate permanent ban</strong>:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-400">
              <li>Harassment, hate speech, slurs, or threats</li>
              <li>Sharing sexual content or soliciting minors</li>
              <li>Sharing personal information (doxxing)</li>
              <li>Spamming URLs or phishing links</li>
              <li>Attempting to circumvent bans or abuse systems</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">3. Age Requirement</h2>
            <p>You must be at least <strong>13 years old</strong> to use this service. Users under 18 should use this service with parental awareness.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">4. No Guarantee of Service</h2>
            <p>We provide Anime Roulette "as-is." We don't guarantee uptime, message delivery, or the behavior of other users. Use at your own risk.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">5. Moderation</h2>
            <p>We reserve the right to ban any user at any time for any reason, including violations of these terms. Bans are enforced by IP address.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">6. Limitation of Liability</h2>
            <p>Anime Roulette and its operators are not liable for any damages arising from your use of the service, including content shared by other users.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">7. Changes</h2>
            <p>We may update these terms at any time. Continued use of the service after changes constitutes acceptance.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
