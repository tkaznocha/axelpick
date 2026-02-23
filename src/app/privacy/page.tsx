export const dynamic = "force-static";

export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen p-6 md:p-8 max-w-3xl mx-auto">
      <a
        href="/"
        className="inline-block mb-6 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        &larr; Home
      </a>

      <h1 className="font-display text-4xl font-bold mb-3">Privacy Policy</h1>
      <p className="text-sm text-text-secondary mb-12">
        Last updated: February 22, 2026
      </p>

      <div className="space-y-10 text-sm leading-relaxed text-text-secondary">
        <Section title="1. Introduction">
          <p>
            Axel Pick (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates
            a free fantasy league for ISU figure skating. This Privacy Policy
            explains what information we collect, how we use it, and your rights
            regarding that information.
          </p>
        </Section>

        <Section title="2. Information We Collect">
          <h3 className="font-display font-semibold text-text-primary mt-4 mb-2">
            Information you provide
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong className="text-text-primary">Account information:</strong>{" "}
              email address and display name when you create an account
            </li>
            <li>
              <strong className="text-text-primary">Waitlist:</strong> email
              address if you sign up for early access
            </li>
            <li>
              <strong className="text-text-primary">Game data:</strong> your
              skater picks, league memberships, and league names you create
            </li>
          </ul>

          <h3 className="font-display font-semibold text-text-primary mt-4 mb-2">
            Information collected automatically
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong className="text-text-primary">Analytics:</strong> page
              views and basic performance metrics via Vercel Analytics (no
              cookies, no personal identifiers)
            </li>
            <li>
              <strong className="text-text-primary">Authentication data:</strong>{" "}
              if you sign in with Google, we receive your name, email, and
              profile picture from Google. We do not access any other Google data
            </li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Information">
          <p>We use your information to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Provide and operate the fantasy league</li>
            <li>Display your name on leaderboards and within leagues</li>
            <li>Send you notifications about events, results, and your picks</li>
            <li>
              Notify waitlist subscribers when the Service becomes available
            </li>
            <li>Monitor and improve Service performance and reliability</li>
          </ul>
          <p className="mt-3">
            We do <strong className="text-text-primary">not</strong> sell your
            personal information. We do{" "}
            <strong className="text-text-primary">not</strong> use your
            information for advertising. We do{" "}
            <strong className="text-text-primary">not</strong> share your
            information with third parties for their marketing purposes.
          </p>
        </Section>

        <Section title="4. Third-Party Services">
          <p>We use the following third-party services to operate Axel Pick:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <strong className="text-text-primary">Supabase</strong> — database
              and authentication (
              <a
                href="https://supabase.com/privacy"
                className="text-emerald hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                privacy policy
              </a>
              )
            </li>
            <li>
              <strong className="text-text-primary">Vercel</strong> — hosting
              and privacy-friendly analytics (
              <a
                href="https://vercel.com/legal/privacy-policy"
                className="text-emerald hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                privacy policy
              </a>
              )
            </li>
            <li>
              <strong className="text-text-primary">Google</strong> — optional
              sign-in via OAuth (
              <a
                href="https://policies.google.com/privacy"
                className="text-emerald hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                privacy policy
              </a>
              )
            </li>
          </ul>
        </Section>

        <Section title="5. Data Storage and Security">
          <p>
            Your data is stored securely in Supabase (hosted on AWS). We use
            row-level security policies to ensure users can only access their own
            data. All data is transmitted over HTTPS.
          </p>
        </Section>

        <Section title="6. Data Retention">
          <p>
            We retain your account and game data for as long as your account is
            active. Waitlist emails are retained until the Service launches or
            you request removal. If you delete your account, we will remove your
            personal information within 30 days.
          </p>
        </Section>

        <Section title="7. Your Rights">
          <p>You have the right to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              <strong className="text-text-primary">Access</strong> the personal
              information we hold about you
            </li>
            <li>
              <strong className="text-text-primary">Correct</strong> inaccurate
              information
            </li>
            <li>
              <strong className="text-text-primary">Delete</strong> your account
              and associated data
            </li>
            <li>
              <strong className="text-text-primary">Export</strong> your data in
              a portable format
            </li>
            <li>
              <strong className="text-text-primary">Withdraw consent</strong>{" "}
              for data processing at any time by deleting your account
            </li>
          </ul>
          <p className="mt-3">
            To exercise any of these rights, contact us at{" "}
            <a
              href="mailto:hello@axelpick.app"
              className="text-emerald hover:underline"
            >
              hello@axelpick.app
            </a>
            .
          </p>
        </Section>

        <Section title="8. Cookies">
          <p>
            Axel Pick uses only essential cookies required for authentication
            (session tokens). We do not use tracking cookies, advertising
            cookies, or any non-essential cookies. Vercel Analytics is
            cookie-free and does not track individual users.
          </p>
        </Section>

        <Section title="9. Children&apos;s Privacy">
          <p>
            The Service is not directed to children under 13. We do not
            knowingly collect personal information from children under 13. If you
            believe a child under 13 has provided us with personal information,
            please contact us and we will delete it.
          </p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify
            users of material changes via the Service or email. Continued use of
            the Service after changes constitutes acceptance of the updated
            policy.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>
            For questions or concerns about this Privacy Policy, contact us at{" "}
            <a
              href="mailto:hello@axelpick.app"
              className="text-emerald hover:underline"
            >
              hello@axelpick.app
            </a>
            .
          </p>
        </Section>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-text-primary mb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}
