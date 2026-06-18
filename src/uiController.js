/**
 * UIController - Handles all DOM interactions, event listeners, and synchronizes
 * the UI state with the central application engines and 3D environment.
 */
export class UIController {
  /**
   * @param {Object} appState - Global state manager
   * @param {Object} carbonEngine - Carbon footprint calculator
   * @param {Object} degradationModel - Maps score to environmental factors
   * @param {Object} threeSetup - Wrapper for the Three.js scene
   */
  constructor(appState, carbonEngine, degradationModel, threeSetup) {
    this.appState = appState;
    this.carbonEngine = carbonEngine;
    this.degradationModel = degradationModel;
    this.threeSetup = threeSetup;

    this.bindElements();
    this.bindEvents();
    this.updateSimulation();
    
    // GPS simulation state
    this.gpsInterval = null;
    this.simulatedTripData = null;
    
    // Phone clock tick
    this.updatePhoneClock();
    setInterval(() => this.updatePhoneClock(), 30000);
  }

  /**
   * Query all necessary DOM elements once on startup
   */
  bindElements() {
    // Nav Bar
    this.navBtnCity = document.querySelector('#nav-btn-city');
    this.navBtnMobile = document.querySelector('#nav-btn-mobile');
    this.navScoreBadge = document.querySelector('#nav-score-badge');
    this.mobileOverlay = document.querySelector('#mobile-overlay');
    this.desktopDashboard = document.querySelector('#dashboard');
    this.canvas = document.querySelector('#city-canvas');

    // Desktop Inputs
    this.valCar = document.querySelector('#val-car');
    this.valTransit = document.querySelector('#val-transit');
    this.valActive = document.querySelector('#val-active');
    this.inputCar = document.querySelector('#input-car');
    this.inputTransit = document.querySelector('#input-transit');
    this.inputActive = document.querySelector('#input-active');
    this.inputDiet = document.querySelector('#input-diet');

    // Desktop Displays
    this.scoreNum = document.querySelector('#score-num');
    this.scoreCircleOuter = document.querySelector('.score-circle-outer');
    this.lifestyleLabel = document.querySelector('#lifestyle-label');
    this.co2Label = document.querySelector('#co2-label');
    this.statusDot = document.querySelector('#status-dot');
    this.logoDot = document.querySelector('.logo-dot');

    // Desktop Presets & Actions
    this.btnEco = document.querySelector('#btn-eco');
    this.btnAvg = document.querySelector('#btn-avg');
    this.btnHigh = document.querySelector('#btn-high');
    this.btnRegenerate = document.querySelector('#btn-regenerate');

    // Desktop Metrics
    this.barHeat = document.querySelector('#bar-heat');
    this.barVeg = document.querySelector('#bar-veg');
    this.barAir = document.querySelector('#bar-air');
    this.barWater = document.querySelector('#bar-water');
    this.valHeat = document.querySelector('#val-metric-heat');
    this.valVeg = document.querySelector('#val-metric-veg');
    this.valAir = document.querySelector('#val-metric-air');
    this.valWater = document.querySelector('#val-metric-water');

    // Mobile Displays
    this.phoneClock = document.querySelector('#phone-clock');
    this.phoneScoreNum = document.querySelector('#phone-score-num');
    this.phoneScoreRing = document.querySelector('.phone-score-ring-container');
    this.phoneStatusDot = document.querySelector('#phone-status-dot');
    this.phoneLifestyleLabel = document.querySelector('#phone-lifestyle-label');
    this.phoneCo2Label = document.querySelector('#phone-co2-label');
    this.phoneBarToday = document.querySelector('#phone-bar-today');
    this.phoneNotificationsList = document.querySelector('#phone-notifications-list');

    // Mobile Nav & Views
    this.phoneNavItems = document.querySelectorAll('.phone-nav-bar .phone-nav-item');
    this.phoneViews = document.querySelectorAll('.phone-screen .phone-view');

    // Mobile GPS Tab
    this.gpsSetupPanel = document.querySelector('#gps-setup-panel');
    this.gpsRunningPanel = document.querySelector('#gps-running-panel');
    this.gpsSummaryPanel = document.querySelector('#gps-summary-panel');
    this.gpsRouteSelect = document.querySelector('#gps-route-select');
    this.gpsCongestionToggle = document.querySelector('#gps-congestion-toggle');
    this.gpsBtnStart = document.querySelector('#gps-btn-start');
    this.gpsLat = document.querySelector('#gps-lat');
    this.gpsLng = document.querySelector('#gps-lng');
    this.gpsStatDistance = document.querySelector('#gps-stat-distance');
    this.gpsStatDuration = document.querySelector('#gps-stat-duration');
    this.gpsStatSpeed = document.querySelector('#gps-stat-speed');
    this.gpsTripBar = document.querySelector('#gps-trip-bar');
    this.gpsHeuristicVal = document.querySelector('#gps-heuristic-val');

    // Mobile GPS Summary
    this.summaryRoute = document.querySelector('#summary-route');
    this.summaryDistance = document.querySelector('#summary-distance');
    this.summarySpeed = document.querySelector('#summary-speed');
    this.summaryDuration = document.querySelector('#summary-duration');
    this.summaryBadge = document.querySelector('#summary-badge');
    this.summaryWarning = document.querySelector('#summary-warning');
    this.overrideSection = document.querySelector('#override-section');
    this.summaryModeOverride = document.querySelector('#summary-mode-override');
    this.gpsBtnOverride = document.querySelector('#gps-btn-override');
    this.gpsBtnConfirm = document.querySelector('#gps-btn-confirm');

    // Mobile Diet & Insights Tabs
    this.dietButtons = document.querySelectorAll('.diet-grid .diet-btn');
    this.insightsBtnAnalyze = document.querySelector('#insights-btn-analyze');
    this.insightsResultsCard = document.querySelector('#insights-results-card');
    this.insightsTitle = document.querySelector('#insights-title');
    this.insightsBody = document.querySelector('#insights-body');
    this.insightsSavings = document.querySelector('#insights-savings');
    this.phoneHistoryList = document.querySelector('#phone-history-list');
    this.phoneBtnClear = document.querySelector('#phone-btn-clear');
  }

  /**
   * Attaches event listeners to all interactive UI components
   */
  bindEvents() {
    // Top Nav Toggles
    this.navBtnCity.addEventListener('click', () => {
      if (this.navBtnCity.classList.contains('active')) return;
      this.navBtnMobile.classList.remove('active');
      this.navBtnCity.classList.add('active');
      this.mobileOverlay.classList.add('hidden');
      this.canvas.classList.remove('blurred');
      this.desktopDashboard.classList.remove('hidden');
      this.updateSimulation();
    });

    this.navBtnMobile.addEventListener('click', () => {
      if (this.navBtnMobile.classList.contains('active')) return;
      this.navBtnCity.classList.remove('active');
      this.navBtnMobile.classList.add('active');
      this.mobileOverlay.classList.remove('hidden');
      this.canvas.classList.add('blurred');
      this.desktopDashboard.classList.add('hidden');
      this.syncPhoneDashboardUI();
    });

    // Desktop Sliders
    [this.inputCar, this.inputTransit, this.inputActive].forEach(slider => {
      slider.addEventListener('input', () => {
        this.appState.updateDaily(this.inputCar.value, this.inputTransit.value, this.inputActive.value, this.inputDiet.value);
        this.updateSimulation();
      });
    });

    this.inputDiet.addEventListener('change', () => {
      this.appState.updateDaily(this.inputCar.value, this.inputTransit.value, this.inputActive.value, this.inputDiet.value);
      this.updateSimulation();
    });

    // Desktop Presets
    this.btnEco.addEventListener('click', () => {
      this.appState.updateDaily(0, 5, 12, 'vegan');
      this.updateSimulation();
    });

    this.btnAvg.addEventListener('click', () => {
      this.appState.updateDaily(20, 10, 2, 'balanced');
      this.updateSimulation();
    });

    this.btnHigh.addEventListener('click', () => {
      this.appState.updateDaily(70, 5, 0, 'meat-heavy');
      this.updateSimulation();
    });

    this.btnRegenerate.addEventListener('click', () => {
      this.threeSetup.cityGenerator.buildCity();
      this.updateSimulation();
    });

    // Mobile Nav Tabs
    this.phoneNavItems.forEach(item => {
      item.addEventListener('click', () => {
        this.phoneNavItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        const targetViewId = `phone-view-${item.dataset.view}`;
        this.phoneViews.forEach(view => {
          view.classList.toggle('hidden', view.id !== targetViewId);
        });

        if (item.dataset.view === 'dashboard') this.syncPhoneDashboardUI();
        else if (item.dataset.view === 'insights') this.syncPhoneInsightsUI();
        else if (item.dataset.view === 'diet') this.syncPhoneDietUI();
      });
    });

    // Mobile Diet
    this.dietButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const choice = btn.dataset.value;
        this.appState.logDiet(choice);
        this.syncPhoneDietUI();
        this.appState.addNotification({
          title: 'Diet logged for today',
          body: `Your diet choice has been updated to ${choice.toUpperCase()}. Emission coefficient refreshed.`,
          type: 'success'
        });
      });
    });

    // Mobile Insights
    this.insightsBtnAnalyze.addEventListener('click', () => {
      const res = this.appState.analyzePatterns();
      this.insightsResultsCard.classList.remove('hidden');
      if (res.detected) {
        this.insightsTitle.textContent = 'Commute Behavior Detected';
        this.insightsBody.textContent = res.message;
        this.insightsSavings.textContent = res.savings;
        this.insightsSavings.classList.remove('hidden');
        this.appState.addNotification({
          title: 'New Behavioral Advice',
          body: res.message,
          type: 'warning'
        });
      } else {
        this.insightsTitle.textContent = 'Commute Scan Finished';
        this.insightsBody.textContent = res.message;
        this.insightsSavings.classList.add('hidden');
      }
    });

    this.phoneBtnClear.addEventListener('click', () => {
      if (confirm('Clear all logged travel history and reset daily carbon values?')) {
        this.appState.clearAllData();
        this.syncPhoneInsightsUI();
        this.appState.addNotification({
          title: 'History Cleared',
          body: 'All travel histories and custom stats have been cleared.',
          type: 'info'
        });
      }
    });

    // Mobile GPS Logic
    this.bindGPSEvents();
  }

  /**
   * Bind event listeners specifically for GPS mock logic
   */
  bindGPSEvents() {
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

      this.simulatedTripData = { routeName: route.name, distance, speed, duration, detectedMode: heuristicMode, confirmedMode: heuristicMode, isCongested };

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

      this.gpsSetupPanel.classList.remove('hidden');
      this.gpsSummaryPanel.classList.add('hidden');
      document.querySelector('.phone-nav-bar [data-view="dashboard"]').click();
    });
  }

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

  updatePhoneClock() {
    const now = new Date();
    let hrs = now.getHours();
    let mins = now.getMinutes();
    const ampm = hrs >= 12 ? 'PM' : 'AM';
    hrs = hrs % 12 || 12;
    mins = mins < 10 ? '0' + mins : mins;
    this.phoneClock.textContent = `${hrs}:${mins} ${ampm}`;
  }

  /**
   * Synchronizes data from central engines into the UI layers
   * and triggers 3D scene environment updates.
   * @returns {Object} Data regarding current score and co2.
   */
  updateSimulation() {
    const daily = this.appState.state.daily;

    this.carbonEngine.setTransport(daily.carKm, daily.transitKm, daily.activeKm);
    this.carbonEngine.setFood(daily.foodChoice);
    
    const score = this.carbonEngine.getCarbonScore();
    const dailyCO2 = this.carbonEngine.calculateDailyEmissions().toFixed(1);
    const lifestyle = this.carbonEngine.getLifestyleDescription(score);

    const envVars = this.degradationModel.calculate(score);

    this.threeSetup.cityGenerator.updateCityState(score, envVars);
    this.threeSetup.updateAtmosphere(score);

    this.navScoreBadge.textContent = `Carbon Score: ${score}`;
    this.navScoreBadge.className = 'nav-badge';
    if (score >= 75) this.navScoreBadge.classList.add('danger');
    else if (score >= 50) this.navScoreBadge.classList.add('warning');
    else this.navScoreBadge.classList.add('eco');

    if (!this.desktopDashboard.classList.contains('hidden')) {
      this.inputCar.value = daily.carKm;
      this.inputTransit.value = daily.transitKm;
      this.inputActive.value = daily.activeKm;
      this.inputDiet.value = daily.foodChoice;

      this.valCar.textContent = `${daily.carKm} km`;
      this.valTransit.textContent = `${daily.transitKm} km`;
      this.valActive.textContent = `${daily.activeKm} km`;

      this.scoreNum.textContent = score;
      this.co2Label.textContent = `${dailyCO2} kg CO2e / day`;
      this.lifestyleLabel.textContent = lifestyle;

      let ratingColor = 'var(--accent-green)';
      if (score >= 75) ratingColor = 'var(--accent-red)';
      else if (score >= 50) ratingColor = 'var(--accent-yellow)';
      else if (score >= 25) ratingColor = 'var(--accent-blue)';

      this.scoreCircleOuter.style.background = `conic-gradient(${ratingColor} ${score}%, rgba(255, 255, 255, 0.05) ${score}%)`;
      this.statusDot.style.backgroundColor = ratingColor;
      this.logoDot.style.backgroundColor = ratingColor;
      this.logoDot.style.boxShadow = `0 0 10px ${ratingColor}`;

      const { metrics } = envVars;
      this.barHeat.style.width = `${metrics.heatIndexPct}%`;
      this.valHeat.textContent = metrics.heatIndexPct < 30 ? 'Optimal (Cool)' : (metrics.heatIndexPct < 70 ? 'Warning (Warm)' : 'Danger (Hot)');

      this.barVeg.style.width = `${metrics.vegetationPct}%`;
      this.valVeg.textContent = `${metrics.vegetationPct}% Cover`;

      this.barAir.style.width = `${metrics.airQualityPct}%`;
      this.valAir.textContent = metrics.airQualityPct > 80 ? 'Pristine' : (metrics.airQualityPct > 45 ? 'Hazy Smog' : 'Toxic Polluted');

      this.barWater.style.width = `${metrics.waterQualityPct}%`;
      this.valWater.textContent = metrics.waterQualityPct > 80 ? 'Excellent' : (metrics.waterQualityPct > 45 ? 'Murky' : 'Acidic/Dead');

      this.btnEco.classList.remove('active');
      this.btnAvg.classList.remove('active');
      this.btnHigh.classList.remove('active');
      if (daily.carKm === 0 && daily.transitKm === 5 && daily.activeKm === 12 && daily.foodChoice === 'vegan') this.btnEco.classList.add('active');
      else if (daily.carKm === 20 && daily.transitKm === 10 && daily.activeKm === 2 && daily.foodChoice === 'balanced') this.btnAvg.classList.add('active');
      else if (daily.carKm === 70 && daily.transitKm === 5 && daily.activeKm === 0 && daily.foodChoice === 'meat-heavy') this.btnHigh.classList.add('active');
    }

    return { score, dailyCO2, lifestyle };
  }

  syncPhoneDashboardUI() {
    const { score, dailyCO2, lifestyle } = this.updateSimulation();
    
    this.phoneScoreNum.textContent = score;
    this.phoneCo2Label.textContent = `${dailyCO2} kg CO2e / day`;
    this.phoneLifestyleLabel.textContent = lifestyle;

    let ratingColor = 'var(--accent-green)';
    if (score >= 75) ratingColor = 'var(--accent-red)';
    else if (score >= 50) ratingColor = 'var(--accent-yellow)';
    else if (score >= 25) ratingColor = 'var(--accent-blue)';

    this.phoneScoreRing.style.background = `conic-gradient(${ratingColor} ${score}%, rgba(255, 255, 255, 0.05) ${score}%)`;
    this.phoneStatusDot.style.backgroundColor = ratingColor;

    const barHeight = Math.max(5, Math.round((score / 100) * 85));
    this.phoneBarToday.style.height = `${barHeight}%`;
    this.phoneBarToday.style.backgroundColor = ratingColor;

    this.renderPhoneNotifications();
  }

  renderPhoneNotifications() {
    this.phoneNotificationsList.innerHTML = '';
    const notifs = this.appState.state.notifications;

    if (notifs.length === 0) {
      this.phoneNotificationsList.innerHTML = `<div class="view-desc" style="text-align:center; padding: 12px 0;">No active alerts. Your habits are stable!</div>`;
      return;
    }

    notifs.forEach(n => {
      const card = document.createElement('div');
      card.className = `notif-card ${n.type || 'info'}`;
      card.innerHTML = `<div class="notif-header"><span class="notif-title">${n.title}</span><span class="notif-time">${n.time}</span></div><p class="notif-body">${n.body}</p>`;
      this.phoneNotificationsList.appendChild(card);
    });
  }

  syncPhoneDietUI() {
    const currentDiet = this.appState.state.daily.foodChoice;
    this.dietButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.value === currentDiet);
    });
  }

  syncPhoneInsightsUI() {
    this.phoneHistoryList.innerHTML = '';
    const history = this.appState.state.history;
    if (history.length === 0) {
      this.phoneHistoryList.innerHTML = `<div class="view-desc" style="text-align:center; padding: 20px 0;">Your travel log is empty. Use GPS tab to track trips!</div>`;
    } else {
      history.forEach(log => {
        const item = document.createElement('div');
        item.className = 'history-card';
        item.innerHTML = `<div><span class="history-route">${log.routeName}</span><div class="history-meta">${log.dayOfWeek} at ${log.time} • ${log.distance.toFixed(1)} km (${log.duration} mins)</div></div><span class="history-badge">${log.confirmedMode}</span>`;
        this.phoneHistoryList.appendChild(item);
      });
    }

    if (this.appState.state.patternsAnalyzed) {
      this.insightsResultsCard.classList.remove('hidden');
      const pat = this.appState.analyzePatterns();
      if (pat.detected) {
        this.insightsTitle.textContent = 'Behavioral Commute Identified';
        this.insightsBody.textContent = pat.message;
        this.insightsSavings.textContent = pat.savings;
        this.insightsSavings.classList.remove('hidden');
      }
    } else {
      this.insightsResultsCard.classList.add('hidden');
    }
  }
}
