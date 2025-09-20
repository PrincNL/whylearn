import { describe, expect, it, vi } from 'vitest';
import type {
  CoachingFeedback,
  GamificationStatus,
  ProgressMilestoneOverview,
  ProgressOverview,
} from '../src/services/dataService';
import { CoachingService } from '../src/services/coachingService';

const progressMock: ProgressOverview = {
  userId: 'user-123',
  planId: 'plan-1',
  goal: 'Master Data Analysis',
  totalMilestones: 4,
  completedMilestones: 1,
  milestones: [
    { milestoneId: 'm1', title: 'Intro', status: 'completed', progressTimestamp: '2025-01-01T00:00:00.000Z', points: 100, badgeCodes: ['first_milestone'] },
    { milestoneId: 'm2', title: 'Practice', status: 'pending', progressTimestamp: null, points: 0, badgeCodes: [] },
    { milestoneId: 'm3', title: 'Project', status: 'pending', progressTimestamp: null, points: 0, badgeCodes: [] },
    { milestoneId: 'm4', title: 'Reflect', status: 'pending', progressTimestamp: null, points: 0, badgeCodes: [] },
  ] satisfies ProgressMilestoneOverview[],
};

const gamificationMock: GamificationStatus = {
  userId: 'user-123',
  planId: 'plan-1',
  totalPoints: 150,
  progressPoints: 100,
  bonusPoints: 50,
  level: 1,
  completionRate: 0.25,
  completedMilestones: progressMock.completedMilestones,
  totalMilestones: progressMock.totalMilestones,
  badges: [
    {
      code: 'first_milestone',
      name: 'First Milestone',
      description: 'Completed the first milestone in a learning plan.',
      awardedAt: '2025-01-01T00:00:00.000Z',
      bonusPoints: 50,
    },
  ],
};

describe('CoachingService', () => {
  it('generates advice using progress and gamification context', async () => {
    const storeMock = {
      getProgressOverview: vi.fn().mockResolvedValue(progressMock),
      getGamificationStatus: vi.fn().mockResolvedValue(gamificationMock),
      recordCoachingFeedback: vi.fn().mockResolvedValue({
        id: 'feedback-1',
        userId: 'user-123',
        planId: 'plan-1',
        summary: 'summary',
        recommendedMilestones: [],
        recommendedActions: [],
        focusAreas: [],
        motivationalMessage: 'Keep going',
        planAdjustments: [],
        metadata: null,
        createdAt: '2025-01-01T00:00:00.000Z',
      } satisfies CoachingFeedback),
      fetchCoachingFeedback: vi.fn().mockResolvedValue([] as CoachingFeedback[]),
    };

    const service = new CoachingService(storeMock as any);
    const result = await service.generateSession({ userId: 'user-123' });

    expect(result.gamification.totalPoints).toBe(150);
    expect(result.advice.focusAreas.length).toBeGreaterThan(0);
    expect(result.advice.recommendedMilestones).toContain('Practice');
    expect(result.advice.motivationalMessage).toContain('Badges');
    expect(storeMock.recordCoachingFeedback).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-123', planId: 'plan-1' })
    );
  });

  it('returns status with history snapshot', async () => {
    const history: CoachingFeedback[] = [
      {
        id: 'feedback-1',
        userId: 'user-123',
        planId: 'plan-1',
        summary: 'Focus on practice',
        recommendedMilestones: ['Practice'],
        recommendedActions: ['Plan review'],
        focusAreas: ['Consistent execution'],
        motivationalMessage: 'Keep it up!',
        planAdjustments: [],
        metadata: null,
        createdAt: '2025-01-02T00:00:00.000Z',
      },
    ];

    const storeMock = {
      getProgressOverview: vi.fn().mockResolvedValue(progressMock),
      getGamificationStatus: vi.fn().mockResolvedValue(gamificationMock),
      fetchCoachingFeedback: vi.fn().mockResolvedValue(history),
    };

    const service = new CoachingService(storeMock as any);
    const status = await service.getCoachingStatus('user-123');

    expect(status.latestAdvice?.summary).toBe('Focus on practice');
    expect(status.history).toHaveLength(1);
    expect(status.progress.goal).toBe('Master Data Analysis');
  });
});
