import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CarbonEngine } from './carbonEngine.js';
import { DegradationModel } from './degradationModel.js';
import { CityGenerator } from './cityGenerator.js';
import { AppState } from './appState.js';

// --- CENTRAL STATE & ENGINES ---
const appState = new AppState();
const carbonEngine = new CarbonEngine();
const degradationModel = new DegradationModel();

// --- 1. THREE.JS INITIALIZATION ---
const canvas = document.querySelector('#city-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Enable beautiful shadows
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Create Scene
const scene = new THREE.Scene();

// Initialize Fog (Exponential fog for realistic smog rolling in)
const initialFogColor = 0xbae6fd; // soft sky blue
scene.fog = new THREE.FogExp2(initialFogColor, 0.008);
scene.background = new THREE.Color(initialFogColor);

// Setup Camera
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(22, 20, 32);

// Setup Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 10;
controls.maxDistance = 65;
controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent camera from going underground
controls.target.set(0, 2, 0);

// --- 2. LIGHTING SETUP ---
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.9);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
sunLight.position.set(20, 35, 20);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 80;

const d = 30; // Orthographic frustum boundary for shadow coverage
sunLight.shadow.camera.left = -d;
sunLight.shadow.camera.right = d;
sunLight.shadow.camera.top = d;
sunLight.shadow.camera.bottom = -d;
sunLight.shadow.bias = -0.0005;

scene.add(sunLight);

// --- 3. CITY GENERATION ---
const cityGenerator = new CityGenerator(scene);
cityGenerator.buildCity();

// --- 4. HTML ELEMENT SELECTION (DESKTOP & TOP NAV) ---
// Top Navigation Bar
const navBtnCity = document.querySelector('#nav-btn-city');
const navBtnMobile = document.querySelector('#nav-btn-mobile');
const navScoreBadge = document.querySelector('#nav-score-badge');
const mobileOverlay = document.querySelector('#mobile-overlay');
const desktopDashboard = document.querySelector('#dashboard');

// Desktop Override panel inputs
const valCar = document.querySelector('#val-car');
const valTransit = document.querySelector('#val-transit');
const valActive = document.querySelector('#val-active');
const inputCar = document.querySelector('#input-car');
const inputTransit = document.querySelector('#input-transit');
const inputActive = document.querySelector('#input-active');
const inputDiet = document.querySelector('#input-diet');

const scoreNum = document.querySelector('#score-num');
const scoreCircleOuter = document.querySelector('.score-circle-outer');
const lifestyleLabel = document.querySelector('#lifestyle-label');
const co2Label = document.querySelector('#co2-label');
const statusDot = document.querySelector('#status-dot');
const logoDot = document.querySelector('.logo-dot');

const btnEco = document.querySelector('#btn-eco');
const btnAvg = document.querySelector('#btn-avg');
const btnHigh = document.querySelector('#btn-high');
const btnRegenerate = document.querySelector('#btn-regenerate');

// Metrics variables
const barHeat = document.querySelector('#bar-heat');
const barVeg = document.querySelector('#bar-veg');
const barAir = document.querySelector('#bar-air');
const barWater = document.querySelector('#bar-water');
const valHeat = document.querySelector('#val-metric-heat');
const valVeg = document.querySelector('#val-metric-veg');
const valAir = document.querySelector('#val-metric-air');
const valWater = document.querySelector('#val-metric-water');

// --- 5. HTML ELEMENT SELECTION (MOBILE APP MOCK) ---
const phoneClock = document.querySelector('#phone-clock');
const phoneScoreNum = document.querySelector('#phone-score-num');
const phoneScoreRing = document.querySelector('.phone-score-ring-container');
const phoneStatusDot = document.querySelector('#phone-status-dot');
const phoneLifestyleLabel = document.querySelector('#phone-lifestyle-label');
const phoneCo2Label = document.querySelector('#phone-co2-label');
const phoneBarToday = document.querySelector('#phone-bar-today');
const phoneNotificationsList = document.querySelector('#phone-notifications-list');

// Phone navigation tabs
const phoneNavItems = document.querySelectorAll('.phone-nav-bar .phone-nav-item');
const phoneViews = document.querySelectorAll('.phone-screen .phone-view');

// GPS Tab panels & inputs
const gpsSetupPanel = document.querySelector('#gps-setup-panel');
const gpsRunningPanel = document.querySelector('#gps-running-panel');
const gpsSummaryPanel = document.querySelector('#gps-summary-panel');
const gpsRouteSelect = document.querySelector('#gps-route-select');
const gpsCongestionToggle = document.querySelector('#gps-congestion-toggle');
const gpsBtnStart = document.querySelector('#gps-btn-start');
const gpsLat = document.querySelector('#gps-lat');
const gpsLng = document.querySelector('#gps-lng');
const gpsStatDistance = document.querySelector('#gps-stat-distance');
const gpsStatDuration = document.querySelector('#gps-stat-duration');
const gpsStatSpeed = document.querySelector('#gps-stat-speed');
const gpsTripBar = document.querySelector('#gps-trip-bar');
const gpsHeuristicVal = document.querySelector('#gps-heuristic-val');

// GPS Summary outputs
const summaryRoute = document.querySelector('#summary-route');
const summaryDistance = document.querySelector('#summary-distance');
const summarySpeed = document.querySelector('#summary-speed');
const summaryDuration = document.querySelector('#summary-duration');
const summaryBadge = document.querySelector('#summary-badge');
const summaryWarning = document.querySelector('#summary-warning');
const overrideSection = document.querySelector('#override-section');
const summaryModeOverride = document.querySelector('#summary-mode-override');
const gpsBtnOverride = document.querySelector('#gps-btn-override');
const gpsBtnConfirm = document.querySelector('#gps-btn-confirm');

// Diet Tab inputs
const dietButtons = document.querySelectorAll('.diet-grid .diet-btn');

// Insights Tab inputs
const insightsBtnAnalyze = document.querySelector('#insights-btn-analyze');
const insightsResultsCard = document.querySelector('#insights-results-card');
const insightsTitle = document.querySelector('#insights-title');
const insightsBody = document.querySelector('#insights-body');
const insightsSavings = document.querySelector('#insights-savings');
const phoneHistoryList = document.querySelector('#phone-history-list');
const phoneBtnClear = document.querySelector('#phone-btn-clear');

// --- 6. CORE SIMULATION OVERVIEW SYNCHRONIZER ---

/**
 * Reads state from central store and runs the Three.js and UI rendering updates
 */
function updateSimulation() {
  const daily = appState.state.daily;

  // A. Feed Carbon Engine & get metrics
  carbonEngine.setTransport(daily.carKm, daily.transitKm, daily.activeKm);
  carbonEngine.setFood(daily.foodChoice);
  
  const score = carbonEngine.getCarbonScore();
  const dailyCO2 = carbonEngine.calculateDailyEmissions().toFixed(1);
  const lifestyle = carbonEngine.getLifestyleDescription(score);

  // B. Feed Degradation Model
  const envVars = degradationModel.calculate(score);

  // C. Update 3D elements inside Three.js
  cityGenerator.updateCityState(score, envVars);
  updateAtmosphere(score);

  // D. Update Top Nav stats badge
  navScoreBadge.textContent = `Carbon Score: ${score}`;
  navScoreBadge.className = 'nav-badge';
  if (score >= 75) navScoreBadge.classList.add('danger');
  else if (score >= 50) navScoreBadge.classList.add('warning');
  else navScoreBadge.classList.add('eco');

  // E. Update Desktop Dashboard Panel UI (if visible)
  if (!desktopDashboard.classList.contains('hidden')) {
    // Sync slider input values to match state
    inputCar.value = daily.carKm;
    inputTransit.value = daily.transitKm;
    inputActive.value = daily.activeKm;
    inputDiet.value = daily.foodChoice;

    valCar.textContent = `${daily.carKm} km`;
    valTransit.textContent = `${daily.transitKm} km`;
    valActive.textContent = `${daily.activeKm} km`;

    // Update numbers
    scoreNum.textContent = score;
    co2Label.textContent = `${dailyCO2} kg CO2e / day`;
    lifestyleLabel.textContent = lifestyle;

    // Conic gradient ring
    let ratingColor = 'var(--accent-green)';
    if (score >= 75) ratingColor = 'var(--accent-red)';
    else if (score >= 50) ratingColor = 'var(--accent-yellow)';
    else if (score >= 25) ratingColor = 'var(--accent-blue)';

    scoreCircleOuter.style.background = `conic-gradient(${ratingColor} ${score}%, rgba(255, 255, 255, 0.05) ${score}%)`;
    statusDot.style.backgroundColor = ratingColor;
    logoDot.style.backgroundColor = ratingColor;
    logoDot.style.boxShadow = `0 0 10px ${ratingColor}`;

    // Update metric progress bars
    const { metrics } = envVars;
    barHeat.style.width = `${metrics.heatIndexPct}%`;
    valHeat.textContent = metrics.heatIndexPct < 30 ? 'Optimal (Cool)' : (metrics.heatIndexPct < 70 ? 'Warning (Warm)' : 'Danger (Hot)');

    barVeg.style.width = `${metrics.vegetationPct}%`;
    valVeg.textContent = `${metrics.vegetationPct}% Cover`;

    barAir.style.width = `${metrics.airQualityPct}%`;
    valAir.textContent = metrics.airQualityPct > 80 ? 'Pristine' : (metrics.airQualityPct > 45 ? 'Hazy Smog' : 'Toxic Polluted');

    barWater.style.width = `${metrics.waterQualityPct}%`;
    valWater.textContent = metrics.waterQualityPct > 80 ? 'Excellent' : (metrics.waterQualityPct > 45 ? 'Murky' : 'Acidic/Dead');

    // Preset button highlight helper
    btnEco.classList.remove('active');
    btnAvg.classList.remove('active');
    btnHigh.classList.remove('active');
    if (daily.carKm === 0 && daily.transitKm === 5 && daily.activeKm === 12 && daily.foodChoice === 'vegan') {
      btnEco.classList.add('active');
    } else if (daily.carKm === 20 && daily.transitKm === 10 && daily.activeKm === 2 && daily.foodChoice === 'balanced') {
      btnAvg.classList.add('active');
    } else if (daily.carKm === 70 && daily.transitKm === 5 && daily.activeKm === 0 && daily.foodChoice === 'meat-heavy') {
      btnHigh.classList.add('active');
    }
  }

  // F. Return score and CO2 for phone dashboard calculations
  return { score, dailyCO2, lifestyle };
}

/**
 * Updates lighting, sky and fog colors based on the current Carbon Score
 */
function updateAtmosphere(carbonScore) {
  const t = carbonScore / 100.0; // 0.0 to 1.0

  const cleanSky = new THREE.Color(0xbae6fd);
  const dirtySky = new THREE.Color(0x272522); // dark sepia grey
  const targetSkyColor = cleanSky.clone().lerp(dirtySky, t);
  
  scene.background.copy(targetSkyColor);
  scene.fog.color.copy(targetSkyColor);
  renderer.setClearColor(targetSkyColor);

  // Fog density
  scene.fog.density = 0.008 + (0.030 * t);

  // Sun Light
  const cleanSunColor = new THREE.Color(0xffffff);
  const dirtySunColor = new THREE.Color(0xef4444);
  sunLight.color.copy(cleanSunColor).lerp(dirtySunColor, t);
  sunLight.intensity = 1.2 - (0.7 * t);

  // Hemisphere Ambient Light
  const cleanHemiSky = new THREE.Color(0xffffff);
  const dirtyHemiSky = new THREE.Color(0x57534e);
  const cleanHemiGround = new THREE.Color(0x444444);
  const dirtyHemiGround = new THREE.Color(0x1c1917);
  
  hemiLight.color.copy(cleanHemiSky).lerp(dirtyHemiSky, t);
  hemiLight.groundColor.copy(cleanHemiGround).lerp(dirtyHemiGround, t);
}

// --- 7. VIEW TOGGLE ACTION ---
navBtnCity.addEventListener('click', () => {
  if (navBtnCity.classList.contains('active')) return;

  // Set Nav Active Classes
  navBtnMobile.classList.remove('active');
  navBtnCity.classList.add('active');

  // Hide Mobile Overlay, Un-blur City, Show Desktop Panel
  mobileOverlay.classList.add('hidden');
  canvas.classList.remove('blurred');
  desktopDashboard.classList.remove('hidden');

  // Sync state changes from phone activities to digital twin
  updateSimulation();
});

navBtnMobile.addEventListener('click', () => {
  if (navBtnMobile.classList.contains('active')) return;

  // Set Nav Active Classes
  navBtnCity.classList.remove('active');
  navBtnMobile.classList.add('active');

  // Show Mobile Overlay, Blur City, Hide Desktop Panel
  mobileOverlay.classList.remove('hidden');
  canvas.classList.add('blurred');
  desktopDashboard.classList.add('hidden');

  // Sync and render the phone companion layout
  syncPhoneDashboardUI();
});

// --- 8. SMARTPHONE COMPANION CONTROLLER ---

/**
 * Formats simulated clock time at top of phone
 */
function updatePhoneClock() {
  const now = new Date();
  let hrs = now.getHours();
  let mins = now.getMinutes();
  const ampm = hrs >= 12 ? 'PM' : 'AM';
  hrs = hrs % 12;
  hrs = hrs ? hrs : 12;
  mins = mins < 10 ? '0' + mins : mins;
  phoneClock.textContent = `${hrs}:${mins} ${ampm}`;
}
updatePhoneClock();
setInterval(updatePhoneClock, 30000);

/**
 * Handles Tab navigation inside the simulated smartphone screen
 */
phoneNavItems.forEach(item => {
  item.addEventListener('click', () => {
    // Set active tab styling
    phoneNavItems.forEach(nav => nav.classList.remove('active'));
    item.classList.add('active');

    // Switch view panel visibility
    const targetViewId = `phone-view-${item.dataset.view}`;
    phoneViews.forEach(view => {
      if (view.id === targetViewId) {
        view.classList.remove('hidden');
      } else {
        view.classList.add('hidden');
      }
    });

    // Run tab specific syncing
    if (item.dataset.view === 'dashboard') {
      syncPhoneDashboardUI();
    } else if (item.dataset.view === 'insights') {
      syncPhoneInsightsUI();
    } else if (item.dataset.view === 'diet') {
      syncPhoneDietUI();
    }
  });
});

/**
 * Renders phone dashboard variables, notifications and chart bars
 */
function syncPhoneDashboardUI() {
  // A. Trigger calculations to read latest state
  const { score, dailyCO2, lifestyle } = updateSimulation();
  
  // B. Write to phone dashboard dials
  phoneScoreNum.textContent = score;
  phoneCo2Label.textContent = `${dailyCO2} kg CO2e / day`;
  phoneLifestyleLabel.textContent = lifestyle;

  let ratingColor = 'var(--accent-green)';
  if (score >= 75) ratingColor = 'var(--accent-red)';
  else if (score >= 50) ratingColor = 'var(--accent-yellow)';
  else if (score >= 25) ratingColor = 'var(--accent-blue)';

  phoneScoreRing.style.background = `conic-gradient(${ratingColor} ${score}%, rgba(255, 255, 255, 0.05) ${score}%)`;
  phoneStatusDot.style.backgroundColor = ratingColor;

  // C. Update mock weekly chart bar for "Today"
  // Map score (0-100) to height percentage (5% to 90%)
  const barHeight = Math.max(5, Math.round((score / 100) * 85));
  phoneBarToday.style.height = `${barHeight}%`;
  phoneBarToday.style.backgroundColor = ratingColor;

  // D. Render Notifications list
  renderPhoneNotifications();
}

/**
 * Renders notifications from central store
 */
function renderPhoneNotifications() {
  phoneNotificationsList.innerHTML = '';
  const notifs = appState.state.notifications;

  if (notifs.length === 0) {
    phoneNotificationsList.innerHTML = `<div class="view-desc" style="text-align:center; padding: 12px 0;">No active alerts. Your habits are stable!</div>`;
    return;
  }

  notifs.forEach(n => {
    const card = document.createElement('div');
    card.className = `notif-card ${n.type || 'info'}`;
    card.innerHTML = `
      <div class="notif-header">
        <span class="notif-title">${n.title}</span>
        <span class="notif-time">${n.time}</span>
      </div>
      <p class="notif-body">${n.body}</p>
    `;
    phoneNotificationsList.appendChild(card);
  });
}

/**
 * Syncs the diet logger layout choice
 */
function syncPhoneDietUI() {
  const currentDiet = appState.state.daily.foodChoice;
  dietButtons.forEach(btn => {
    if (btn.dataset.value === currentDiet) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Diet Buttons Click binding
dietButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const choice = btn.dataset.value;
    appState.logDiet(choice);
    
    // Rerender layout
    syncPhoneDietUI();
    
    // Post notification
    appState.addNotification({
      title: 'Diet logged for today',
      body: `Your diet choice has been updated to ${choice.toUpperCase()}. Emission coefficient refreshed.`,
      type: 'success'
    });
  });
});

/**
 * Renders insights historical log lists
 */
function syncPhoneInsightsUI() {
  // Clear lists
  phoneHistoryList.innerHTML = '';
  
  const history = appState.state.history;
  if (history.length === 0) {
    phoneHistoryList.innerHTML = `<div class="view-desc" style="text-align:center; padding: 20px 0;">Your travel log is empty. Use GPS tab to track trips!</div>`;
  } else {
    history.forEach(log => {
      const item = document.createElement('div');
      item.className = 'history-card';
      item.innerHTML = `
        <div>
          <span class="history-route">${log.routeName}</span>
          <div class="history-meta">${log.dayOfWeek} at ${log.time} • ${log.distance.toFixed(1)} km (${log.duration} mins)</div>
        </div>
        <span class="history-badge">${log.confirmedMode}</span>
      `;
      phoneHistoryList.appendChild(item);
    });
  }

  // Sync results card
  if (appState.state.patternsAnalyzed) {
    insightsResultsCard.classList.remove('hidden');
    // Rerun pattern checker silently to display results on page load
    const pat = appState.analyzePatterns();
    if (pat.detected) {
      insightsTitle.textContent = 'Behavioral Commute Identified';
      insightsBody.textContent = pat.message;
      insightsSavings.textContent = pat.savings;
      insightsSavings.classList.remove('hidden');
    }
  } else {
    insightsResultsCard.classList.add('hidden');
  }
}

// Insights Pattern Recognition Click binding
insightsBtnAnalyze.addEventListener('click', () => {
  const res = appState.analyzePatterns();
  
  insightsResultsCard.classList.remove('hidden');
  if (res.detected) {
    insightsTitle.textContent = 'Commute Behavior Detected';
    insightsBody.textContent = res.message;
    insightsSavings.textContent = res.savings;
    insightsSavings.classList.remove('hidden');
    
    // Add success notification details
    appState.addNotification({
      title: 'New Behavioral Advice',
      body: res.message,
      type: 'warning'
    });
  } else {
    insightsTitle.textContent = 'Commute Scan Finished';
    insightsBody.textContent = res.message;
    insightsSavings.classList.add('hidden');
  }
});

// Clear data binding
phoneBtnClear.addEventListener('click', () => {
  if (confirm('Clear all logged travel history and reset daily carbon values?')) {
    appState.clearAllData();
    syncPhoneInsightsUI();
    appState.addNotification({
      title: 'History Cleared',
      body: 'All travel histories and custom stats have been cleared.',
      type: 'info'
    });
  }
});

// --- 9. GPS ROUTE SIMULATION ENGINE ---

let gpsInterval = null;
let simulatedTripData = null;

// Route data coordinates setup
const ROUTE_COORDS = {
  college: {
    name: 'Home ➔ College',
    distance: 12.5,
    startCoords: { lat: 37.77492, lng: -122.41942 },
    endCoords: { lat: 37.80761, lng: -122.47413 },
    baseSpeed: 50, // km/h
    normalTime: 25 // mins
  },
  market: {
    name: 'Home ➔ Grocery Store',
    distance: 2.8,
    startCoords: { lat: 37.77492, lng: -122.41942 },
    endCoords: { lat: 37.75830, lng: -122.42840 },
    baseSpeed: 24,
    normalTime: 7
  },
  office: {
    name: 'Home ➔ Office',
    distance: 22.0,
    startCoords: { lat: 37.77492, lng: -122.41942 },
    endCoords: { lat: 37.62130, lng: -122.37900 },
    baseSpeed: 70,
    normalTime: 30
  },
  gym: {
    name: 'Office ➔ Gym',
    distance: 4.5,
    startCoords: { lat: 37.62130, lng: -122.37900 },
    endCoords: { lat: 37.64100, lng: -122.40100 },
    baseSpeed: 32,
    normalTime: 12
  }
};

gpsBtnStart.addEventListener('click', () => {
  const selectedRouteKey = gpsRouteSelect.value;
  const isCongested = gpsCongestionToggle.checked;
  const route = ROUTE_COORDS[selectedRouteKey];

  if (!route) return;

  // Initialize simulated trip metadata
  const distance = route.distance;
  // If traffic congestion is enabled, speed drops by 60% and duration increases by 150%
  const speed = isCongested ? route.baseSpeed * 0.40 : route.baseSpeed;
  const duration = isCongested ? Math.round(route.normalTime * 2.5) : route.normalTime;
  
  // Heuristic mode detection based on average speed rules
  let heuristicMode = 'Car';
  if (speed < 6) heuristicMode = 'Walking';
  else if (speed < 20) heuristicMode = 'Bicycle';
  else if (speed < 45) heuristicMode = 'Transit (Bus)';
  else heuristicMode = 'Car';

  simulatedTripData = {
    routeName: route.name,
    distance,
    speed,
    duration,
    detectedMode: heuristicMode,
    confirmedMode: heuristicMode,
    isCongested
  };

  // Switch panel layouts inside GPS view
  gpsSetupPanel.classList.add('hidden');
  gpsRunningPanel.classList.remove('hidden');
  gpsSummaryPanel.classList.add('hidden');

  // Start ticker animation (accelerated trip simulation over ~7.5 seconds)
  let ticks = 0;
  const totalTicks = 50;
  
  gpsTripBar.style.width = '0%';
  
  gpsInterval = setInterval(() => {
    ticks++;
    const progress = ticks / totalTicks;
    
    // Interpolate lat/lng coords
    const currentLat = route.startCoords.lat + (route.endCoords.lat - route.startCoords.lat) * progress;
    const currentLng = route.startCoords.lng + (route.endCoords.lng - route.startCoords.lng) * progress;
    
    // Add jitter
    const jitterLat = currentLat + (Math.random() - 0.5) * 0.0002;
    const jitterLng = currentLng + (Math.random() - 0.5) * 0.0002;
    const currentSpeedJitter = Math.max(1, Math.round(speed + (Math.random() - 0.5) * 5));

    // Update real-time GPS view meters
    gpsLat.textContent = jitterLat.toFixed(5);
    gpsLng.textContent = jitterLng.toFixed(5);
    gpsStatDistance.textContent = `${(distance * progress).toFixed(1)} km`;
    
    // Format duration count
    const currentMins = Math.floor(duration * progress);
    const currentSecs = Math.floor((duration * progress * 60) % 60);
    gpsStatDuration.textContent = `${currentMins}:${currentSecs < 10 ? '0' + currentSecs : currentSecs}`;
    gpsStatSpeed.textContent = `${currentSpeedJitter} km/h`;
    
    gpsTripBar.style.width = `${progress * 100}%`;
    gpsHeuristicVal.textContent = heuristicMode;

    if (ticks >= totalTicks) {
      clearInterval(gpsInterval);
      showGpsTripSummary();
    }
  }, 150);
});

/**
 * Triggers the trip completion summary panel
 */
function showGpsTripSummary() {
  gpsRunningPanel.classList.add('hidden');
  gpsSummaryPanel.classList.remove('hidden');

  // Fill in complete outputs
  summaryRoute.textContent = simulatedTripData.routeName;
  summaryDistance.textContent = `${simulatedTripData.distance.toFixed(1)} km`;
  summarySpeed.textContent = `${Math.round(simulatedTripData.speed)} km/h`;
  summaryDuration.textContent = `${simulatedTripData.duration} mins`;

  // Display badge
  summaryBadge.textContent = simulatedTripData.detectedMode;
  summaryBadge.className = 'guess-badge';
  
  // Style guess badges based on class
  if (simulatedTripData.detectedMode === 'Car') {
    summaryBadge.style.backgroundColor = 'var(--accent-red)';
    summaryBadge.style.color = '#fff';
  } else if (simulatedTripData.detectedMode.includes('Transit')) {
    summaryBadge.style.backgroundColor = 'var(--accent-blue)';
    summaryBadge.style.color = '#000';
  } else {
    summaryBadge.style.backgroundColor = 'var(--accent-green)';
    summaryBadge.style.color = '#fff';
  }

  // Adjust limitations warn label (known congestion speed overlapping)
  if (simulatedTripData.isCongested) {
    if (simulatedTripData.routeName.includes('College') && simulatedTripData.detectedMode.includes('Transit')) {
      summaryWarning.textContent = 'CONGESTION MISCLASSIFICATION: Car journey slowed to transit speeds. Correct it below.';
      summaryWarning.style.color = 'var(--accent-yellow)';
      overrideSection.classList.remove('hidden');
    } else {
      summaryWarning.textContent = 'Heavy traffic congestion slowed this journey.';
      summaryWarning.style.color = 'var(--accent-yellow)';
      overrideSection.classList.remove('hidden');
    }
  } else {
    summaryWarning.textContent = 'Heuristic matches average speeds.';
    summaryWarning.style.color = 'var(--color-text-dim)';
    overrideSection.classList.add('hidden');
  }
}

// User correction toggle click
gpsBtnOverride.addEventListener('click', () => {
  overrideSection.classList.toggle('hidden');
});

// User confirm and log trip click
gpsBtnConfirm.addEventListener('click', () => {
  // Read confirmed mode (either heuristic or override dropdown)
  let confirmed = simulatedTripData.detectedMode;
  if (!overrideSection.classList.contains('hidden')) {
    confirmed = summaryModeOverride.value;
  }
  
  simulatedTripData.confirmedMode = confirmed;
  
  // Log trip to Central State store
  appState.addTrip(simulatedTripData);

  // Re-sync UI layouts
  gpsSetupPanel.classList.remove('hidden');
  gpsSummaryPanel.classList.add('hidden');
  
  // Go back to phone dashboard
  document.querySelector('.phone-nav-bar [data-view="dashboard"]').click();
});

// --- 10. ATTACH DESKTOP MANUAL OVERRIDE LISTENERS ---
// Sliders & input fields sync
[inputCar, inputTransit, inputActive].forEach(slider => {
  slider.addEventListener('input', () => {
    // Modify Central State totals
    appState.updateDaily(inputCar.value, inputTransit.value, inputActive.value, inputDiet.value);
    updateSimulation();
  });
});

inputDiet.addEventListener('change', () => {
  appState.updateDaily(inputCar.value, inputTransit.value, inputActive.value, inputDiet.value);
  updateSimulation();
});

// Presets click bindings
btnEco.addEventListener('click', () => {
  appState.updateDaily(0, 5, 12, 'vegan');
  updateSimulation();
});

btnAvg.addEventListener('click', () => {
  appState.updateDaily(20, 10, 2, 'balanced');
  updateSimulation();
});

btnHigh.addEventListener('click', () => {
  appState.updateDaily(70, 5, 0, 'meat-heavy');
  updateSimulation();
});

// Regenerate grid layout click binding
btnRegenerate.addEventListener('click', () => {
  cityGenerator.buildCity();
  updateSimulation();
});

// --- 11. RENDERING ANIMATION TICK LOOP ---
const clock = new THREE.Clock();

const animate = () => {
  requestAnimationFrame(animate);

  const daily = appState.state.daily;
  // Fetch current score for spinning turbine / particle soot speed
  carbonEngine.setTransport(daily.carKm, daily.transitKm, daily.activeKm);
  carbonEngine.setFood(daily.foodChoice);
  const carbonScore = carbonEngine.getCarbonScore();
  
  // Animate windmills & chimney particles
  cityGenerator.animate(carbonScore);

  // Update camera controls
  controls.update();

  // Draw scene
  renderer.render(scene, camera);
};

// --- 12. BOOTSTRAP INITIAL RUN ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Trigger initial simulation and animation loop
updateSimulation();
animate();

console.log('EcoSphere 3D Digital Twin - Top Nav Bar, central state, and Phone Companion Mockup fully integrated.');
