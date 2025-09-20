export const demoPlan = {
  goal: "Launch design leadership cohort",
  motivation: "Guide independent designers to grow into confident leaders.",
  milestones: [
    { id: "milestone-1", title: "Define cohort outcomes", durationHours: 6 },
    { id: "milestone-2", title: "Design weekly playbooks", durationHours: 8 },
    { id: "milestone-3", title: "Record kickoff walkthrough", durationHours: 4 },
    { id: "milestone-4", title: "Pilot feedback loop", durationHours: 5 },
  ],
};

export const demoProgress = {
  streakDays: 6,
  totalPoints: 1450,
  completedMilestones: 2,
  totalMilestones: demoPlan.milestones.length,
  nextAction: "Run feedback interviews with your pilot group",
};

export const demoBadges = [
  { code: "first_milestone", name: "First Milestone", earnedAt: "2025-09-02" },
  { code: "streak_5", name: "Five Day Streak", earnedAt: "2025-09-15" },
];

export const demoCoaching = [
  {
    id: "coach-1",
    createdAt: "2025-09-10",
    summary: "Celebrate the progress on the first milestone and maintain cadence with micro check-ins.",
    recommendedActions: ["Share a 3-question reflection survey", "Highlight one learner cohort win"],
  },
  {
    id: "coach-2",
    createdAt: "2025-09-16",
    summary: "Give learners a preview of the rewards system to sustain motivation for milestone two.",
    recommendedActions: ["Publish reward criteria", "Invite feedback on the gamification flow"],
  },
];

export const demoEntitlements = [
  { code: "progress", name: "Progress analytics" },
  { code: "rewards", name: "Rewards automation" },
  { code: "ai_coaching", name: "AI coaching snapshots" },
];
