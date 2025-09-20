const sections = [
  {
    title: "1. Data collection",
    body: `We collect account details (email, name) and workspace activity required to deliver learning plans, progress analytics, and coaching snapshots. We do not sell personal data.`,
  },
  {
    title: "2. Storage & security",
    body: `All data is stored in encrypted JSON datasets with append-only journals. Backups occur daily and are encrypted at rest. Access is limited to vetted team members.`,
  },
  {
    title: "3. Integrations",
    body: `Optional integrations such as Stripe for billing and AI providers for coaching prompts operate under separate agreements. We share only the minimum data needed to fulfil the service.`,
  },
  {
    title: "4. Your rights",
    body: `You can export or delete your data at any time from the account settings. EU and UK customers may exercise GDPR rights by contacting privacy@whylearn.ai.`,
  },
  {
    title: "5. Retention",
    body: `Free workspaces are retained for 12 months of inactivity before secure deletion. Paid workspaces follow contractual retention schedules and can request earlier erasure.`,
  },
  {
    title: "6. Contact",
    body: `Questions about privacy? Email privacy@whylearn.ai. We respond within five business days.`,
  },
];

export default function PrivacyPage() {
  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">Privacy Policy</h2>
        <p className="text-sm text-muted-foreground">Last updated 17 September 2025</p>
      </header>
      {sections.map((section) => (
        <section key={section.title} className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{section.title}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{section.body}</p>
        </section>
      ))}
      <p className="text-xs text-muted-foreground">
        We will revise this policy whenever there are material updates to our data practices. Notices are delivered in-app and via email.
      </p>
    </article>
  );
}
