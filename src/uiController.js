import { createSafeElement } from './utils/domUtils.js';

/**
 * UIController - Handles all DOM interactions, event listeners, and synchronizes
 * the UI state with the central application engines and 3D environment.
 */
export class UIController {
  /**
   * Initialize the UI Controller
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
  }

  /**
   * Updates the digital clock on the phone mockup
   */
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

  /**
   * Sync the mobile dashboard tab
   */
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

  /**
   * Safely renders the notifications list using DOM elements instead of innerHTML
   */
  renderPhoneNotifications() {
    // Clear the list safely
    while (this.phoneNotificationsList.firstChild) {
      this.phoneNotificationsList.removeChild(this.phoneNotificationsList.firstChild);
    }
    
    const notifs = this.appState.state.notifications;

    if (notifs.length === 0) {
      const emptyMsg = createSafeElement('div', 'view-desc', 'No active alerts. Your habits are stable!');
      emptyMsg.style.textAlign = 'center';
      emptyMsg.style.padding = '12px 0';
      this.phoneNotificationsList.appendChild(emptyMsg);
      return;
    }

    notifs.forEach(n => {
      const cardTypeClass = n.type || 'info';
      const card = createSafeElement('div', ['notif-card', cardTypeClass]);
      
      const header = createSafeElement('div', 'notif-header');
      const titleSpan = createSafeElement('span', 'notif-title', n.title);
      const timeSpan = createSafeElement('span', 'notif-time', n.time);
      
      header.appendChild(titleSpan);
      header.appendChild(timeSpan);
      
      const body = createSafeElement('p', 'notif-body', n.body);
      
      card.appendChild(header);
      card.appendChild(body);
      
      this.phoneNotificationsList.appendChild(card);
    });
  }

  /**
   * Syncs the diet tracker tab
   */
  syncPhoneDietUI() {
    const currentDiet = this.appState.state.daily.foodChoice;
    this.dietButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.value === currentDiet);
    });
  }

  /**
   * Safely renders the insights and historical trips using DOM elements instead of innerHTML
   */
  syncPhoneInsightsUI() {
    // Clear list safely
    while (this.phoneHistoryList.firstChild) {
      this.phoneHistoryList.removeChild(this.phoneHistoryList.firstChild);
    }

    const history = this.appState.state.history;
    if (history.length === 0) {
      const emptyMsg = createSafeElement('div', 'view-desc', 'Your travel log is empty. Use GPS tab to track trips!');
      emptyMsg.style.textAlign = 'center';
      emptyMsg.style.padding = '20px 0';
      this.phoneHistoryList.appendChild(emptyMsg);
    } else {
      history.forEach(log => {
        const item = createSafeElement('div', 'history-card');
        
        const detailsContainer = createSafeElement('div');
        const routeSpan = createSafeElement('span', 'history-route', log.routeName);
        const metaDiv = createSafeElement('div', 'history-meta', `${log.dayOfWeek} at ${log.time} • ${log.distance.toFixed(1)} km (${log.duration} mins)`);
        
        detailsContainer.appendChild(routeSpan);
        detailsContainer.appendChild(metaDiv);
        
        const badgeSpan = createSafeElement('span', 'history-badge', log.confirmedMode);
        
        item.appendChild(detailsContainer);
        item.appendChild(badgeSpan);
        
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
