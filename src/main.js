import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CarbonEngine } from './carbonEngine.js';
import { DegradationModel } from './degradationModel.js';
import { CityGenerator } from './cityGenerator.js';

// --- ENGINE & SIMULATION INSTANCES ---
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
// Angle camera down towards the city
camera.position.set(22, 20, 32);

// Setup Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 10;
controls.maxDistance = 65;
// Prevent camera from going underground
controls.maxPolarAngle = Math.PI / 2 - 0.05; 
// Center controls look-at target
controls.target.set(0, 2, 0);

// --- 2. LIGHTING SETUP ---
// Hemisphere Light: sky color and ground color simulation
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.9);
scene.add(hemiLight);

// Directional Light: Sun casting shadows
const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
sunLight.position.set(20, 35, 20);
sunLight.castShadow = true;

// Setup shadow map dimensions for sharp, performant shadows
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

// --- 4. HTML UI ELEMENTS SELECTION ---
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

// Metric variables
const barHeat = document.querySelector('#bar-heat');
const barVeg = document.querySelector('#bar-veg');
const barAir = document.querySelector('#bar-air');
const barWater = document.querySelector('#bar-water');

const valHeat = document.querySelector('#val-metric-heat');
const valVeg = document.querySelector('#val-metric-veg');
const valAir = document.querySelector('#val-metric-air');
const valWater = document.querySelector('#val-metric-water');

// --- 5. CORE UPDATE FUNCTION ---
function updateSimulation() {
  // A. Fetch input values
  const car = parseFloat(inputCar.value);
  const transit = parseFloat(inputTransit.value);
  const active = parseFloat(inputActive.value);
  const diet = inputDiet.value;

  // Update text badges next to slider inputs
  valCar.textContent = `${car} km`;
  valTransit.textContent = `${transit} km`;
  valActive.textContent = `${active} km`;

  // B. Run Carbon Engine Calculation
  carbonEngine.setTransport(car, transit, active);
  carbonEngine.setFood(diet);
  
  const carbonScore = carbonEngine.getCarbonScore();
  const dailyCO2 = carbonEngine.calculateDailyEmissions().toFixed(1);
  const lifestyle = carbonEngine.getLifestyleDescription(carbonScore);

  // C. Run Degradation Model
  const envVars = degradationModel.calculate(carbonScore);

  // D. Update City Geometries and Colors
  cityGenerator.updateCityState(carbonScore, envVars);

  // E. Update Atmosphere & Lights
  updateAtmosphere(carbonScore, envVars);

  // F. Update HTML Dashboard UI
  updateDashboardUI(carbonScore, dailyCO2, lifestyle, envVars);
}

/**
 * Lerp color helper for 3D environment transition
 */
function lerpColor(color1, color2, t) {
  const c1 = new THREE.Color(color1);
  const c2 = new THREE.Color(color2);
  return c1.lerp(c2, t);
}

/**
 * Updates lighting, sky and fog colors based on the current Carbon Score
 */
function updateAtmosphere(carbonScore, envVars) {
  const t = carbonScore / 100.0; // 0.0 (clean) to 1.0 (dirty)

  // 1. Sky & Fog Color transition
  // Clean: Light sky cyan (0xbae6fd)
  // Moderate: Warm grey/smoggy haze (0xa8a29e)
  // Dirty: Dark orange-charcoal smog (0x292524)
  const cleanSky = new THREE.Color(0xbae6fd);
  const dirtySky = new THREE.Color(0x272522); // dark sepia grey
  const targetSkyColor = cleanSky.clone().lerp(dirtySky, t);
  
  scene.background.copy(targetSkyColor);
  scene.fog.color.copy(targetSkyColor);
  renderer.setClearColor(targetSkyColor);

  // 2. Fog Density transition
  // Clean: 0.008 (very clear)
  // Dirty: 0.038 (thick smog)
  scene.fog.density = 0.008 + (0.030 * t);

  // 3. Sun Light Intensity and Color transition
  // Clean: Bright sunlight (0xffffff) at 1.2
  // Dirty: Dim blood red sun (0xef4444) at 0.5
  const cleanSunColor = new THREE.Color(0xffffff);
  const dirtySunColor = new THREE.Color(0xef4444);
  sunLight.color.copy(cleanSunColor).lerp(dirtySunColor, t);
  sunLight.intensity = 1.2 - (0.7 * t);

  // 4. Ambient/Hemisphere Light transition
  // Clean: bright sky dome reflection
  // Dirty: dim muted brown reflection
  const cleanHemiSky = new THREE.Color(0xffffff);
  const dirtyHemiSky = new THREE.Color(0x57534e);
  const cleanHemiGround = new THREE.Color(0x444444);
  const dirtyHemiGround = new THREE.Color(0x1c1917);
  
  hemiLight.color.copy(cleanHemiSky).lerp(dirtyHemiSky, t);
  hemiLight.groundColor.copy(cleanHemiGround).lerp(dirtyHemiGround, t);
}

/**
 * Updates UI textual elements and progress bars
 */
function updateDashboardUI(score, dailyCO2, lifestyle, envVars) {
  // Update Score and emissions text
  scoreNum.textContent = score;
  co2Label.textContent = `${dailyCO2} kg CO2e / day`;
  lifestyleLabel.textContent = lifestyle;

  // Determine indicator colors based on score levels
  let ratingColor = 'var(--accent-green)';
  if (score >= 75) {
    ratingColor = 'var(--accent-red)';
  } else if (score >= 50) {
    ratingColor = 'var(--accent-yellow)';
  } else if (score >= 25) {
    ratingColor = 'var(--accent-blue)';
  }

  // Update Conic Gradient on Score Circle
  scoreCircleOuter.style.background = `conic-gradient(${ratingColor} ${score}%, rgba(255, 255, 255, 0.05) ${score}%)`;
  
  // Update Status Dots
  statusDot.style.backgroundColor = ratingColor;
  logoDot.style.backgroundColor = ratingColor;
  logoDot.style.boxShadow = `0 0 10px ${ratingColor}`;

  // Update Environmental progress bars
  const { metrics } = envVars;

  // A. Heat Index
  barHeat.style.width = `${metrics.heatIndexPct}%`;
  if (metrics.heatIndexPct < 30) {
    valHeat.textContent = 'Optimal (Cool)';
  } else if (metrics.heatIndexPct < 70) {
    valHeat.textContent = 'Warning (Warm)';
  } else {
    valHeat.textContent = 'Danger (Hot)';
  }

  // B. Vegetation
  barVeg.style.width = `${metrics.vegetationPct}%`;
  valVeg.textContent = `${metrics.vegetationPct}% Cover`;

  // C. Air Quality
  barAir.style.width = `${metrics.airQualityPct}%`;
  if (metrics.airQualityPct > 80) {
    valAir.textContent = 'Pristine';
  } else if (metrics.airQualityPct > 45) {
    valAir.textContent = 'Hazy Smog';
  } else {
    valAir.textContent = 'Toxic Polluted';
  }

  // D. Water Quality
  barWater.style.width = `${metrics.waterQualityPct}%`;
  if (metrics.waterQualityPct > 80) {
    valWater.textContent = 'Excellent';
  } else if (metrics.waterQualityPct > 45) {
    valWater.textContent = 'Murky';
  } else {
    valWater.textContent = 'Acidic/Dead';
  }
}

// --- 6. ATTACH EVENT LISTENERS ---

// Sliders and selects
[inputCar, inputTransit, inputActive].forEach(slider => {
  slider.addEventListener('input', () => {
    // Deselect any active presets when modifying manual sliders
    document.querySelectorAll('.btn-preset').forEach(btn => btn.classList.remove('active'));
    updateSimulation();
  });
});

inputDiet.addEventListener('change', () => {
  document.querySelectorAll('.btn-preset').forEach(btn => btn.classList.remove('active'));
  updateSimulation();
});

// Preset Buttons binding
btnEco.addEventListener('click', () => {
  setActivePreset(btnEco, 0, 5, 12, 'vegan');
});

btnAvg.addEventListener('click', () => {
  setActivePreset(btnAvg, 20, 10, 2, 'balanced');
});

btnHigh.addEventListener('click', () => {
  setActivePreset(btnHigh, 70, 5, 0, 'meat-heavy');
});

function setActivePreset(button, car, transit, active, diet) {
  // Update button classes
  document.querySelectorAll('.btn-preset').forEach(btn => btn.classList.remove('active'));
  button.classList.add('active');

  // Set inputs
  inputCar.value = car;
  inputTransit.value = transit;
  inputActive.value = active;
  inputDiet.value = diet;

  updateSimulation();
}

// Regenerate City Layout (re-randomizes building placement/heights)
btnRegenerate.addEventListener('click', () => {
  cityGenerator.buildCity();
  updateSimulation();
});

// --- 7. ANIMATION LOOP ---
const clock = new THREE.Clock();

const animate = () => {
  requestAnimationFrame(animate);

  const carbonScore = carbonEngine.getCarbonScore();
  
  // 3D Moving Object Animations (Wind turbines, smoke particles)
  cityGenerator.animate(carbonScore);

  // Update Orbit Camera Controls
  controls.update();

  // Render Scene
  renderer.render(scene, camera);
};

// --- 8. INITIALIZE SCREEN AND START ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initial run
updateSimulation();
animate();

console.log('3D City Carbon Visualizer - All modules successfully wired.');
