// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GPSController } from '../src/gpsController.js';
import { AppState } from '../src/appState.js';

describe('GPSController', () => {
  let appState;
  let onCompleteCallback;
  let gpsController;

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="gps-setup-panel"></div>
      <div id="gps-running-panel" class="hidden"></div>
      <div id="gps-summary-panel" class="hidden"></div>
      <select id="gps-route-select">
        <option value="market">Home ➔ Grocery Store</option>
      </select>
      <input type="checkbox" id="gps-congestion-toggle">
      <button id="gps-btn-start"></button>
      <span id="gps-lat"></span><span id="gps-lng"></span>
      <span id="gps-stat-distance"></span><span id="gps-stat-duration"></span>
      <span id="gps-stat-speed"></span>
      <div id="gps-trip-bar"></div><strong id="gps-heuristic-val"></strong>
      
      <strong id="summary-route"></strong><strong id="summary-distance"></strong>
      <strong id="summary-speed"></strong><strong id="summary-duration"></strong>
      <div id="summary-badge"></div><p id="summary-warning"></p>
      
      <div id="override-section" class="hidden"></div>
      <select id="summary-mode-override"><option value="Transit">Transit</option></select>
      <button id="gps-btn-override"></button>
      <button id="gps-btn-confirm"></button>
    `;

    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      clear: vi.fn()
    };

    vi.useFakeTimers();
    appState = new AppState();
    onCompleteCallback = vi.fn();
    gpsController = new GPSController(appState, onCompleteCallback);
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('should initialize and bind elements', () => {
    expect(gpsController.gpsBtnStart).not.toBeNull();
  });

  it('should start trip simulation and update UI', () => {
    gpsController.gpsRouteSelect.value = 'market';
    gpsController.gpsBtnStart.click();

    expect(gpsController.gpsSetupPanel.classList.contains('hidden')).toBe(true);
    expect(gpsController.gpsRunningPanel.classList.contains('hidden')).toBe(false);

    // Advance timers by half the trip (25 ticks of 150ms = 3750ms)
    vi.advanceTimersByTime(3750);
    expect(gpsController.gpsTripBar.style.width).toBe('50%');

    // Finish trip
    vi.advanceTimersByTime(3750);
    expect(gpsController.gpsRunningPanel.classList.contains('hidden')).toBe(true);
    expect(gpsController.gpsSummaryPanel.classList.contains('hidden')).toBe(false);
    expect(gpsController.summaryBadge.textContent).toBe('Transit (Bus)');
  });
});
