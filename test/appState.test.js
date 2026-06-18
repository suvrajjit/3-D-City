import { describe, it, expect } from 'vitest';
import { AppState } from '../src/appState.js';

describe('AppState', () => {
  it('should start with default daily values', () => {
    const state = new AppState();
    expect(state.state.daily.carKm).toBe(20);
    expect(state.state.daily.foodChoice).toBe('balanced');
  });

  it('should update daily values', () => {
    const state = new AppState();
    state.updateDaily(50, 20, 5, 'vegan');
    expect(state.state.daily.carKm).toBe(50);
    expect(state.state.daily.foodChoice).toBe('vegan');
  });
  
  it('should add notifications', () => {
    const state = new AppState();
    state.addNotification({ title: 'Test', body: 'Body', type: 'info' });
    expect(state.state.notifications.length).toBeGreaterThan(0);
    expect(state.state.notifications[0].title).toBe('Test');
  });
});
