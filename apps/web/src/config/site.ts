export const siteConfig = {
  name: "WhyLearn",
  description:
    "WhyLearn is the focused learning companion that helps independent professionals plan, track, and celebrate meaningful growth.",
  mainNav: [
    { title: "Features", href: "#features", labelKey: "nav.features" },
    { title: "Progress", href: "#progress", labelKey: "nav.progress" },
    { title: "Pricing", href: "/pricing", labelKey: "nav.pricing" },
    { title: "Docs", href: "/docs", labelKey: "nav.docs" }
  ],
  footer: {
    product: [
      { title: "Overview", href: "#features", labelKey: "nav.features" },
      { title: "Dashboard", href: "/app/dashboard", labelKey: "nav.dashboard" },
      { title: "Rewards", href: "/app/rewards", labelKey: "nav.rewards" }
    ],
    company: [
      { title: "About", href: "/about" },
      { title: "Privacy", href: "/legal/privacy" },
      { title: "Terms", href: "/legal/terms" }
    ],
    resources: [
      { title: "Support", href: "/support", labelKey: "nav.support" },
      { title: "Changelog", href: "/docs/changelog" },
      { title: "Community", href: "/community" }
    ]
  }
} as const;

export type SiteLink = (typeof siteConfig.mainNav)[number];
