"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLearningPlan = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const BASE_DURATION = 40; // baseline hours allocated per learning journey
const toTitleCase = (text) => text
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
const buildResources = (goal, context) => [
    `Official ${goal} foundations guide`,
    `${goal} community forum`,
    `Hands-on ${context.toLowerCase()} challenges for ${goal}`,
];
const buildMilestones = (goal) => {
    const focus = toTitleCase(goal);
    return [
        {
            id: node_crypto_1.default.randomUUID(),
            title: `${focus} Fundamentals`,
            description: `Learn the key concepts that define ${focus}. Focus on vocabulary, methodologies, and the mindset needed to excel.`,
            durationHours: Math.round(BASE_DURATION * 0.25),
            resources: buildResources(focus, 'Introductory'),
        },
        {
            id: node_crypto_1.default.randomUUID(),
            title: `Practice ${focus} Skills`,
            description: `Apply what you learn through curated exercises tailored to ${focus}. Track progress, capture reflections, and iterate on mistakes.`,
            durationHours: Math.round(BASE_DURATION * 0.35),
            resources: buildResources(focus, 'Practice'),
        },
        {
            id: node_crypto_1.default.randomUUID(),
            title: `Build a ${focus} Project`,
            description: `Consolidate your knowledge by delivering a portfolio-ready project aligned with your ${focus} objective.`,
            durationHours: Math.round(BASE_DURATION * 0.25),
            resources: buildResources(focus, 'Project-Based'),
        },
        {
            id: node_crypto_1.default.randomUUID(),
            title: 'Reflect & Optimize',
            description: `Review outcomes, gather feedback, and adjust the next steps to keep momentum toward ${focus}.`,
            durationHours: Math.round(BASE_DURATION * 0.15),
            resources: buildResources(focus, 'Reflection'),
        },
    ];
};
const generateLearningPlan = (rawGoal, preferredPaceHoursPerWeek = 6) => {
    const goal = rawGoal.trim();
    if (!goal) {
        throw new Error('Learning goal is required to generate a plan.');
    }
    const goalTitle = toTitleCase(goal);
    const milestones = buildMilestones(goalTitle);
    const totalDurationHours = milestones.reduce((total, item) => total + item.durationHours, 0);
    const recommendedPaceHoursPerWeek = Math.max(3, Math.round(totalDurationHours / Math.max(4, Math.ceil(totalDurationHours / preferredPaceHoursPerWeek))));
    return {
        goal: goalTitle,
        summary: `A focused roadmap to master ${goalTitle} through fundamentals, deliberate practice, and reflective improvements.`,
        motivation: `Stay consistent�${goalTitle} rewards small, steady wins. Celebrate each completed milestone and share progress with your accountability circle.`,
        milestones,
        totalDurationHours,
        recommendedPaceHoursPerWeek,
        createdAt: new Date().toISOString(),
    };
};
exports.generateLearningPlan = generateLearningPlan;
//# sourceMappingURL=learningPlanService.js.map