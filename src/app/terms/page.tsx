export const metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen p-6 md:p-8 max-w-3xl mx-auto">
      <a
        href="/"
        className="inline-block mb-6 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        &larr; Home
      </a>

      <h1 className="font-display text-4xl font-bold mb-3">
        Terms of Service
      </h1>
      <p className="text-sm text-text-secondary mb-12">
        Last updated: February 22, 2026
      </p>

      <div className="space-y-10 text-sm leading-relaxed text-text-secondary">
        <Section title="1. Acceptance of Terms">
          <p>
            By accessing or using Axel Pick (&quot;the Service&quot;), you agree
            to be bound by these Terms of Service. If you do not agree, do not
            use the Service.
          </p>
        </Section>

        <Section title="2. Description of Service">
          <p>
            Axel Pick is a free fantasy league for ISU figure skating. Users
            pick skaters before ISU competitions, earn points based on real
            results, and compete on leaderboards. The Service is provided free of
            charge with no advertisements.
          </p>
        </Section>

        <Section title="3. Eligibility">
          <p>
            You must be at least 13 years of age to use the Service. By using
            the Service, you represent that you meet this requirement.
          </p>
        </Section>

        <Section title="4. User Accounts">
          <p>
            To use certain features, you must create an account using an email
            address or a third-party authentication provider (e.g., Google). You
            are responsible for maintaining the security of your account
            credentials. You agree to provide accurate information and to keep it
            up to date.
          </p>
        </Section>

        <Section title="5. Acceptable Use">
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              Use the Service for any unlawful purpose or in violation of any
              applicable law
            </li>
            <li>
              Create multiple accounts to gain an unfair advantage
            </li>
            <li>
              Use automated tools, bots, or scripts to interact with the Service
            </li>
            <li>
              Attempt to interfere with the proper functioning of the Service
            </li>
            <li>
              Harass, abuse, or harm other users
            </li>
            <li>
              Impersonate any person or entity
            </li>
          </ul>
        </Section>

        <Section title="6. Fantasy Game">
          <p>
            Axel Pick is a free-to-play fantasy game. No real money is wagered,
            won, or lost. Points and leaderboard positions have no monetary
            value. We reserve the right to modify game rules, scoring, and
            mechanics at any time.
          </p>
        </Section>

        <Section title="7. Intellectual Property">
          <p>
            All content, design, and branding of the Service are the property of
            Axel Pick. You may not copy, modify, distribute, or create
            derivative works from any part of the Service without prior written
            permission. Skater names, competition names, and ISU data are used
            for informational and entertainment purposes.
          </p>
        </Section>

        <Section title="8. Disclaimer of Warranties">
          <p>
            The Service is provided &quot;as is&quot; and &quot;as
            available&quot; without warranties of any kind, express or implied.
            We do not guarantee that the Service will be uninterrupted, secure,
            or error-free. Results, scores, and standings are provided for
            entertainment purposes and may contain errors or delays.
          </p>
        </Section>

        <Section title="9. Limitation of Liability">
          <p>
            To the fullest extent permitted by law, Axel Pick shall not be
            liable for any indirect, incidental, special, consequential, or
            punitive damages arising from your use of the Service.
          </p>
        </Section>

        <Section title="10. Termination">
          <p>
            We may suspend or terminate your account at any time, with or
            without cause or notice. You may delete your account at any time by
            contacting us.
          </p>
        </Section>

        <Section title="11. Changes to Terms">
          <p>
            We may update these Terms from time to time. Continued use of the
            Service after changes constitutes acceptance of the updated Terms. We
            will notify users of material changes via the Service or email.
          </p>
        </Section>

        <Section title="12. Contact">
          <p>
            If you have questions about these Terms, contact us at{" "}
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
