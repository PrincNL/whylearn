export const siteConfig = {
  name: "WhyLearn",
  description:
    "WhyLearn is the focused learning companion that helps independent professionals plan, track, and celebrate meaningful growth.",
  mainNav: [
    { title: "Features", href: "#features" },
    { title: "Progress", href: "#progress" },
    { title: "Pricing", href: "/pricing" },
    { title: "Docs", href: "/docs" }
  ],
  footer: {
    product: [
      { title: "Overview", href: "#features" },
      { title: "Dashboard", href: "/app/dashboard" },
      { title: "Rewards", href: "/app/rewards" }
    ],
    company: [
      { title: "About", href: "/about" },
      { title: "Privacy", href: "/legal/privacy" },
      { title: "Terms", href: "/legal/terms" }
    ],
    resources: [
      { title: "Support", href: "/support" },
      { title: "Changelog", href: "/docs/changelog" },
      { title: "Community", href: "/community" }
    ]
  }
} as const;

type LinkItem = (typeof siteConfig.mainNav)[number];

export type SiteLink = LinkItem;
