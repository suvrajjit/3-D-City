import './style.css';
import { CarbonEngine } from './carbonEngine.js';
import { DegradationModel } from './degradationModel.js';
import { AppState } from './appState.js';
import { ThreeSetup } from './threeSetup.js';
import { UIController } from './uiController.js';

// --- CENTRAL STATE & ENGINES ---
const appState = new AppState();
const carbonEngine = new CarbonEngine();
const degradationModel = new DegradationModel();

// --- THREE.JS WRAPPER ---
const canvas = document.querySelector('#city-canvas');
const threeSetup = new ThreeSetup(canvas);

// --- UI CONTROLLER ---
const uiController = new UIController(appState, carbonEngine, degradationModel, threeSetup);

// --- RENDERING ANIMATION TICK LOOP ---
/**
 * Animation loop to run continuously using requestAnimationFrame.
 * Triggers updates in the 3D scene corresponding to the carbon score.
 */
const animate = () => {
  requestAnimationFrame(animate);

  const daily = appState.state.daily;
  // Make sure engines are fed to retrieve latest score
  carbonEngine.setTransport(daily.carKm, daily.transitKm, daily.activeKm);
  carbonEngine.setFood(daily.foodChoice);
  const carbonScore = carbonEngine.getCarbonScore();
  
  // Render the ThreeJS frame
  threeSetup.animate(carbonScore);
};

// Start the animation loop
animate();

console.log('EcoSphere 3D Digital Twin - Fully refactored and integrated!');
