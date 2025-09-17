export interface LearningPlanMilestone {
    id: string;
    title: string;
    description: string;
    durationHours: number;
    resources: string[];
}
export interface LearningPlan {
    goal: string;
    summary: string;
    motivation: string;
    milestones: LearningPlanMilestone[];
    totalDurationHours: number;
    recommendedPaceHoursPerWeek: number;
    createdAt: string;
}
export declare const generateLearningPlan: (rawGoal: string, preferredPaceHoursPerWeek?: number) => LearningPlan;
//# sourceMappingURL=learningPlanService.d.ts.map