import {
  CALCULATOR_STEPS,
  calculateProgress,
  getNextStep,
  getPreviousStep,
  getStepById,
  getStepByOrder,
  getTotalSteps,
  isFirstStep,
  isLastStep,
} from '@/lib/core/calculator/config';
import { describe, expect, it } from 'vitest';

describe('Calculator Config', () => {
  it('should have defined steps', () => {
    expect(CALCULATOR_STEPS.length).toBeGreaterThan(0);
    expect(CALCULATOR_STEPS[0].id).toBe('step-01');
  });

  it('should get step by ID', () => {
    const step = getStepById('step-01');
    expect(step).toBeDefined();
    expect(step?.order).toBe(1);
  });

  it('should get step by order', () => {
    const step = getStepByOrder(1);
    expect(step).toBeDefined();
    expect(step?.id).toBe('step-01');
  });

  it('should get next step', () => {
    const next = getNextStep('step-01');
    expect(next).toBeDefined();
    expect(next?.order).toBe(2);
  });

  it('should get previous step', () => {
    const prev = getPreviousStep('step-02');
    expect(prev).toBeDefined();
    expect(prev?.order).toBe(1);
  });

  it('should detect first step', () => {
    expect(isFirstStep('step-01')).toBe(true);
    expect(isFirstStep('step-02')).toBe(false);
  });

  it('should detect last step', () => {
    const lastStep = CALCULATOR_STEPS[CALCULATOR_STEPS.length - 1];
    expect(isLastStep(lastStep.id)).toBe(true);
    expect(isLastStep('step-01')).toBe(false);
  });

  it('should calculate progress', () => {
    const progress1 = calculateProgress('step-01');
    const progress2 = calculateProgress('step-02');

    expect(progress1).toBeLessThan(progress2);
    expect(progress1).toBeGreaterThanOrEqual(0);
    expect(progress1).toBeLessThanOrEqual(100);
  });

  it('should return total steps', () => {
    const total = getTotalSteps();
    expect(total).toBe(CALCULATOR_STEPS.length);
  });
});
