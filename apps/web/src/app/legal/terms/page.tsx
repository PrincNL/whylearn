const sections = [
  {
    title: "1. Acceptance of terms",
    body: `By using WhyLearn, you agree to these Terms of Service. The platform is designed for professional learning teams and independent practitioners. If you do not agree, please discontinue access immediately.`,
  },
  {
    title: "2. Account responsibilities",
    body: `You are responsible for maintaining the confidentiality of your workspace credentials and for ensuring that collaborators invited to your plan comply with these terms.`,
  },
  {
    title: "3. Permitted use",
    body: `WhyLearn may be used to design learning plans, track progress, and manage coaching workflows. Reverse engineering, reselling, or using the platform for unlawful activity is prohibited.`,
  },
  {
    title: "4. Subscription & billing",
    body: `Paid tiers renew automatically unless cancelled. Fees are non-refundable except where required by law. Downgrades take effect at the end of the billing cycle.`,
  },
  {
    title: "5. Data ownership",
    body: `You retain ownership of the learning content and progress data you store. We operate JSON-based storage to keep exports portable and auditable.`,
  },
  {
    title: "6. Service changes",
    body: `We may update features or maintenance windows from time to time. Material changes are communicated via email or in-app notifications in advance.`,
  },
];

export default function TermsPage() {
  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">Terms of Service</h2>
        <p className="text-sm text-muted-foreground">Effective from 17 September 2025</p>
      </header>
      {sections.map((section) => (
        <section key={section.title} className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">{section.title}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{section.body}</p>
        </section>
      ))}
      <p className="text-xs text-muted-foreground">
        Need a signed copy for your records? Email compliance@whylearn.ai and our team will assist within two business days.
      </p>
    </article>
  );
}
