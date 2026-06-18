/**
 * GPSController - Manages the mock GPS trip simulation, heuristic detection,
 * and user overrides within the Phone Companion UI.
 */
export class GPSController {
  /**
   * Initialize the GPS controller
   * @param {Object} appState - Global state manager for logging trips
   * @param {Function} onTripCompleteCallback - Callback to trigger UI changes after trip completion
   */
  constructor(appState, onTripCompleteCallback) {
    this.appState = appState;
    this.onTripCompleteCallback = onTripCompleteCallback;

    this.gpsInterval = null;
    this.simulatedTripData = null;

    this.bindElements();
    this.bindEvents();
  }

  /**
   * Retrieves all DOM elements required for GPS simulation
   */
  bindElements() {
    this.gpsSetupPanel = document.querySelector('#gps-setup-panel');
    this.gpsRunningPanel = document.querySelector('#gps-running-panel');
    this.gpsSummaryPanel = document.querySelector('#gps-summary-panel');
    this.gpsRouteSelect = document.querySelector('#gps-route-select');
    this.gpsCongestionToggle = document.querySelector('#gps-congestion-toggle');
    this.gpsBtnStart = document.querySelector('#gps-btn-start');
    
    // Running Stats
    this.gpsLat = document.querySelector('#gps-lat');
    this.gpsLng = document.querySelector('#gps-lng');
    this.gpsStatDistance = document.querySelector('#gps-stat-distance');
    this.gpsStatDuration = document.querySelector('#gps-stat-duration');
    this.gpsStatSpeed = document.querySelector('#gps-stat-speed');
    this.gpsTripBar = document.querySelector('#gps-trip-bar');
    this.gpsHeuristicVal = document.querySelector('#gps-heuristic-val');

    // Summary screen
    this.summaryRoute = document.querySelector('#summary-route');
    this.summaryDistance = document.querySelector('#summary-distance');
    this.summarySpeed = document.querySelector('#summary-speed');
    this.summaryDuration = document.querySelector('#summary-duration');
    this.summaryBadge = document.querySelector('#summary-badge');
    this.summaryWarning = document.querySelector('#summary-warning');
    
    // Overrides
    this.overrideSection = document.querySelector('#override-section');
    this.summaryModeOverride = document.querySelector('#summary-mode-override');
    this.gpsBtnOverride = document.querySelector('#gps-btn-override');
    this.gpsBtnConfirm = document.querySelector('#gps-btn-confirm');
  }

  /**
   * Attaches event listeners for starting the trip and confirming overrides
   */
  bindEvents() {
    const ROUTE_COORDS = {
      college: { name: 'Home ➔ College', distance: 12.5, startCoords: { lat: 37.77492, lng: -122.41942 }, endCoords: { lat: 37.80761, lng: -122.47413 }, baseSpeed: 50, normalTime: 25 },
      market: { name: 'Home ➔ Grocery Store', distance: 2.8, startCoords: { lat: 37.77492, lng: -122.41942 }, endCoords: { lat: 37.75830, lng: -122.42840 }, baseSpeed: 24, normalTime: 7 },
      office: { name: 'Home ➔ Office', distance: 22.0, startCoords: { lat: 37.77492, lng: -122.41942 }, endCoords: { lat: 37.62130, lng: -122.37900 }, baseSpeed: 70, normalTime: 30 },
      gym: { name: 'Office ➔ Gym', distance: 4.5, startCoords: { lat: 37.62130, lng: -122.37900 }, endCoords: { lat: 37.64100, lng: -122.40100 }, baseSpeed: 32, normalTime: 12 }
    };

    this.gpsBtnStart.addEventListener('click', () => {
      const route = ROUTE_COORDS[this.gpsRouteSelect.value];
      if (!route) return;

      const distance = route.distance;
      const isCongested = this.gpsCongestionToggle.checked;
      const speed = isCongested ? route.baseSpeed * 0.40 : route.baseSpeed;
      const duration = isCongested ? Math.round(route.normalTime * 2.5) : route.normalTime;
      
      let heuristicMode = 'Car';
      if (speed < 6) heuristicMode = 'Walking';
      else if (speed < 20) heuristicMode = 'Bicycle';
      else if (speed < 45) heuristicMode = 'Transit (Bus)';

      this.simulatedTripData = { 
        routeName: route.name, 
        distance, 
        speed, 
        duration, 
        detectedMode: heuristicMode, 
        confirmedMode: heuristicMode, 
        isCongested 
      };

      this.gpsSetupPanel.classList.add('hidden');
      this.gpsRunningPanel.classList.remove('hidden');
      this.gpsSummaryPanel.classList.add('hidden');

      let ticks = 0;
      const totalTicks = 50;
      this.gpsTripBar.style.width = '0%';
      
      this.gpsInterval = setInterval(() => {
        ticks++;
        const progress = ticks / totalTicks;
        const currentLat = route.startCoords.lat + (route.endCoords.lat - route.startCoords.lat) * progress;
        const currentLng = route.startCoords.lng + (route.endCoords.lng - route.startCoords.lng) * progress;
        
        // Add artificial jitter for realism
        const jitterLat = currentLat + (Math.random() - 0.5) * 0.0002;
        const jitterLng = currentLng + (Math.random() - 0.5) * 0.0002;
        const currentSpeedJitter = Math.max(1, Math.round(speed + (Math.random() - 0.5) * 5));

        this.gpsLat.textContent = jitterLat.toFixed(5);
        this.gpsLng.textContent = jitterLng.toFixed(5);
        this.gpsStatDistance.textContent = `${(distance * progress).toFixed(1)} km`;
        
        const currentMins = Math.floor(duration * progress);
        const currentSecs = Math.floor((duration * progress * 60) % 60);
        this.gpsStatDuration.textContent = `${currentMins}:${currentSecs < 10 ? '0' + currentSecs : currentSecs}`;
        this.gpsStatSpeed.textContent = `${currentSpeedJitter} km/h`;
        
        this.gpsTripBar.style.width = `${progress * 100}%`;
        this.gpsHeuristicVal.textContent = heuristicMode;

        if (ticks >= totalTicks) {
          clearInterval(this.gpsInterval);
          this.showGpsTripSummary();
        }
      }, 150);
    });

    this.gpsBtnOverride.addEventListener('click', () => {
      this.overrideSection.classList.toggle('hidden');
    });

    this.gpsBtnConfirm.addEventListener('click', () => {
      let confirmed = this.simulatedTripData.detectedMode;
      if (!this.overrideSection.classList.contains('hidden')) {
        confirmed = this.summaryModeOverride.value;
      }
      this.simulatedTripData.confirmedMode = confirmed;
      this.appState.addTrip(this.simulatedTripData);

      // Reset UI back to setup state
      this.gpsSetupPanel.classList.remove('hidden');
      this.gpsSummaryPanel.classList.add('hidden');
      
      // Fire callback to navigate back to dashboard
      if (typeof this.onTripCompleteCallback === 'function') {
        this.onTripCompleteCallback();
      }
    });
  }

  /**
   * Transition UI to the summary screen after trip completes
   */
  showGpsTripSummary() {
    this.gpsRunningPanel.classList.add('hidden');
    this.gpsSummaryPanel.classList.remove('hidden');

    this.summaryRoute.textContent = this.simulatedTripData.routeName;
    this.summaryDistance.textContent = `${this.simulatedTripData.distance.toFixed(1)} km`;
    this.summarySpeed.textContent = `${Math.round(this.simulatedTripData.speed)} km/h`;
    this.summaryDuration.textContent = `${this.simulatedTripData.duration} mins`;

    this.summaryBadge.textContent = this.simulatedTripData.detectedMode;
    this.summaryBadge.className = 'guess-badge';
    
    if (this.simulatedTripData.detectedMode === 'Car') {
      this.summaryBadge.style.backgroundColor = 'var(--accent-red)';
      this.summaryBadge.style.color = '#fff';
    } else if (this.simulatedTripData.detectedMode.includes('Transit')) {
      this.summaryBadge.style.backgroundColor = 'var(--accent-blue)';
      this.summaryBadge.style.color = '#000';
    } else {
      this.summaryBadge.style.backgroundColor = 'var(--accent-green)';
      this.summaryBadge.style.color = '#fff';
    }

    if (this.simulatedTripData.isCongested) {
      if (this.simulatedTripData.routeName.includes('College') && this.simulatedTripData.detectedMode.includes('Transit')) {
        this.summaryWarning.textContent = 'CONGESTION MISCLASSIFICATION: Car journey slowed to transit speeds. Correct it below.';
        this.summaryWarning.style.color = 'var(--accent-yellow)';
        this.overrideSection.classList.remove('hidden');
      } else {
        this.summaryWarning.textContent = 'Heavy traffic congestion slowed this journey.';
        this.summaryWarning.style.color = 'var(--accent-yellow)';
        this.overrideSection.classList.remove('hidden');
      }
    } else {
      this.summaryWarning.textContent = 'Heuristic matches average speeds.';
      this.summaryWarning.style.color = 'var(--color-text-dim)';
      this.overrideSection.classList.add('hidden');
    }
  }
}
