import { describe, it, expect } from 'vitest';
import { CarbonEngine } from '../src/carbonEngine.js';

describe('CarbonEngine', () => {
  it('should start with default values', () => {
    const engine = new CarbonEngine();
    expect(engine.carKm).toBe(20);
    expect(engine.foodChoice).toBe('balanced');
  });

  it('should calculate an eco score of 7 for vegan walking', () => {
    const engine = new CarbonEngine();
    engine.setTransport(0, 0, 10);
    engine.setFood('vegan');
    const score = engine.getCarbonScore();
    expect(score).toBe(7);
  });

  it('should calculate a high score for meat heavy and heavy car use', () => {
    const engine = new CarbonEngine();
    engine.setTransport(100, 0, 0);
    engine.setFood('meat-heavy');
    const score = engine.getCarbonScore();
    expect(score).toBeGreaterThan(80);
  });
});
