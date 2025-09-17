import { describe, expect, it } from 'vitest';
import { generateLearningPlan } from '../src/services/learningPlanService';

describe('generateLearningPlan', () => {
  it('creates a deterministic plan with expected sections', () => {
    const plan = generateLearningPlan('learn python automation', 7);

    expect(plan.goal).toBe('Learn Python Automation');
    expect(plan.milestones).toHaveLength(4);
    expect(plan.totalDurationHours).toBeGreaterThan(0);
    expect(plan.milestones[0].title).toContain('Learn Python Automation');
    expect(plan.recommendedPaceHoursPerWeek).toBeGreaterThan(0);
  });

  it('defaults to baseline pace when value is omitted', () => {
    const plan = generateLearningPlan('master storytelling');
    expect(plan.recommendedPaceHoursPerWeek).toBeGreaterThanOrEqual(3);
  });

  it('throws when goal is empty', () => {
    expect(() => generateLearningPlan('   ')).toThrow('Learning goal is required to generate a plan.');
  });
});
