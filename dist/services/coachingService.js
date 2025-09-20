"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coachingService = exports.CoachingService = void 0;
const dataService_1 = require("./dataService");
const toPercentage = (ratio) => `${Math.round(ratio * 100)}%`;
class CoachingService {
    store;
    constructor(store = dataService_1.dataService) {
        this.store = store;
    }
    async generateSession(input) {
        const progress = await this.store.getProgressOverview(input.userId, input.planId);
        const gamification = await this.store.getGamificationStatus(input.userId, progress.planId);
        const advice = this.buildAdvice({ progress, gamification });
        const feedbackRecord = await this.store.recordCoachingFeedback({
            userId: input.userId,
            planId: gamification.planId,
            summary: advice.summary,
            recommendedMilestones: advice.recommendedMilestones,
            recommendedActions: advice.recommendedActions,
            focusAreas: advice.focusAreas,
            motivationalMessage: advice.motivationalMessage,
            planAdjustments: advice.planAdjustments,
            metadata: {
                boosters: advice.boosters,
                insights: advice.insights,
                notes: input.notes ?? null,
                level: gamification.level,
                badges: gamification.badges.map((badge) => badge.code),
            },
        });
        const history = await this.store.fetchCoachingFeedback(input.userId, gamification.planId, 5);
        return {
            advice,
            progress,
            gamification,
            history: normalizeHistory(feedbackRecord, history),
        };
    }
    async getCoachingStatus(userId, planId, limit = 5) {
        const progress = await this.store.getProgressOverview(userId, planId);
        const gamification = await this.store.getGamificationStatus(userId, progress.planId);
        const history = await this.store.fetchCoachingFeedback(userId, gamification.planId, limit);
        const latestAdvice = history[0];
        const status = {
            progress,
            gamification,
            history,
        };
        if (latestAdvice) {
            status.latestAdvice = latestAdvice;
        }
        return status;
    }
    buildAdvice(context) {
        const { progress, gamification } = context;
        const completionRate = progress.totalMilestones
            ? progress.completedMilestones / progress.totalMilestones
            : 0;
        const pendingMilestones = progress.milestones.filter((milestone) => milestone.status !== 'completed');
        const recommendedMilestones = pendingMilestones.slice(0, 2).map((milestone) => milestone.title);
        const nextMilestoneTitle = pendingMilestones[0]?.title;
        const badgeSummary = gamification.badges.length
            ? `Badges: ${gamification.badges.map((badge) => badge.name).join(', ')}`
            : 'Nog geen badges � tijd om er een te verdienen!';
        const summary = `Je hebt ${progress.completedMilestones}/${progress.totalMilestones} mijlpalen voltooid (`
            + `${toPercentage(completionRate)}). Level ${gamification.level} met ${gamification.totalPoints} punten.`;
        const focusAreas = [];
        const recommendedActions = [];
        const boosters = [];
        if (completionRate < 0.34) {
            focusAreas.push('Consistente leergewoonten');
            recommendedActions.push('Plan twee korte sessies om momentum op te bouwen.');
        }
        else if (completionRate < 0.67) {
            focusAreas.push('Versnel voortgang');
            recommendedActions.push('Reserveer een langere sessie voor de volgende mijlpaal.');
        }
        else {
            focusAreas.push('Afronden en reflecteren');
            recommendedActions.push('Documenteer inzichten uit afgeronde mijlpalen voor kennisborging.');
        }
        if (gamification.bonusPoints < gamification.progressPoints * 0.2) {
            focusAreas.push('Bonuspunten maximaliseren');
            boosters.push('Activeer een community challenge om extra bonuspunten te verdienen.');
        }
        if (nextMilestoneTitle) {
            recommendedActions.push(`Richt je op "${nextMilestoneTitle}" voor de grootste impact.`);
            boosters.push(`Vraag een accountability-buddy om de voortgang op "${nextMilestoneTitle}" te volgen.`);
        }
        if (!recommendedMilestones.length && pendingMilestones.length === 0) {
            recommendedActions.push('Start een verdiepend project of herhaal de reflectiefase.');
        }
        const motivationalMessage = badgeSummary + ' Blijf bouwen aan je momentum!';
        const planAdjustments = [];
        if (completionRate < 0.5 && pendingMilestones.length > 0) {
            planAdjustments.push('Verdeel komende mijlpalen in kleinere tussentaken om drempels te verlagen.');
        }
        if (gamification.level > 1 && completionRate >= 0.5) {
            planAdjustments.push('Voeg een stretch-doel toe dat aansluit bij je huidige level.');
        }
        const insights = [
            {
                label: 'Voltooiingsgraad',
                value: toPercentage(completionRate),
                tone: completionRate >= 0.67 ? 'positive' : completionRate >= 0.34 ? 'neutral' : 'attention',
            },
            {
                label: 'Totale punten',
                value: gamification.totalPoints.toString(),
                tone: gamification.totalPoints >= 300 ? 'positive' : 'neutral',
            },
            {
                label: 'Badge status',
                value: gamification.badges.length ? `${gamification.badges.length} badges` : 'Nog geen badges',
                tone: gamification.badges.length ? 'positive' : 'attention',
            },
        ];
        return {
            summary,
            recommendedMilestones,
            recommendedActions,
            focusAreas,
            motivationalMessage,
            planAdjustments,
            boosters,
            insights,
        };
    }
}
exports.CoachingService = CoachingService;
const normalizeHistory = (latest, existing) => {
    const [first] = existing;
    if (!first) {
        return [latest];
    }
    if (first.id === latest.id) {
        return existing;
    }
    const filtered = existing.filter((item) => item.id !== latest.id);
    return [latest, ...filtered];
};
exports.coachingService = new CoachingService();
//# sourceMappingURL=coachingService.js.map