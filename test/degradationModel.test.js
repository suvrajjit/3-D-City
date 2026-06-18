import { describe, it, expect } from 'vitest';
import { DegradationModel } from '../src/degradationModel.js';

describe('DegradationModel', () => {
  it('should return optimal metrics for score 0', () => {
    const model = new DegradationModel();
    const envVars = model.calculate(0);
    expect(envVars.metrics.heatIndexPct).toBeLessThan(15);
    expect(envVars.metrics.vegetationPct).toBeGreaterThan(90);
  });

  it('should return poor metrics for high score', () => {
    const model = new DegradationModel();
    const envVars = model.calculate(100);
    expect(envVars.metrics.vegetationPct).toBe(0);
    expect(envVars.metrics.airQualityPct).toBe(0);
  });
});
