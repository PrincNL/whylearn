import type { CoachingFeedback, GamificationStatus, ProgressOverview } from './supabaseService';
export interface CoachingAdvice {
    summary: string;
    recommendedMilestones: string[];
    recommendedActions: string[];
    focusAreas: string[];
    motivationalMessage: string;
    planAdjustments: string[];
    boosters: string[];
    insights: Array<{
        label: string;
        value: string;
        tone: 'positive' | 'neutral' | 'attention';
    }>;
}
export interface CoachingSessionResponse {
    advice: CoachingAdvice;
    progress: ProgressOverview;
    gamification: GamificationStatus;
    history: CoachingFeedback[];
}
export interface GenerateCoachingInput {
    userId: string;
    planId?: string;
    notes?: string;
}
export interface CoachingStatusResponse {
    progress: ProgressOverview;
    gamification: GamificationStatus;
    history: CoachingFeedback[];
    latestAdvice?: CoachingFeedback;
}
export declare class CoachingService {
    private readonly supabase;
    constructor(supabase?: import("./supabaseService").SupabaseService);
    generateSession(input: GenerateCoachingInput): Promise<CoachingSessionResponse>;
    getCoachingStatus(userId: string, planId?: string, limit?: number): Promise<CoachingStatusResponse>;
    private buildAdvice;
}
export declare const coachingService: CoachingService;
//# sourceMappingURL=coachingService.d.ts.map