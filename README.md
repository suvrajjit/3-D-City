# 3D City Carbon Footprint Visualizer 🌍

## Overview
The **3D City Carbon Footprint Visualizer** is an interactive, gamified web application that helps individuals understand, track, and reduce their carbon footprint through a personalized 3D digital twin of a city. The city's environment dynamically responds to user inputs related to daily travel and dietary habits, visually demonstrating the direct impact of these choices on the global ecosystem.

## Key Features
- **Interactive 3D Digital Twin**: A fully dynamic 3D city scene rendered using `Three.js`, complete with buildings, vegetation, atmospheric effects, and particle systems.
- **Dynamic Environmental Degradation**: The visual state of the city changes in real-time based on the calculated Carbon Score. High emissions result in smog, dead vegetation, dried water, and an overheated atmosphere.
- **Desktop Dashboard**: A sleek control panel allowing users to adjust their daily habits (car travel, public transit, active travel, dietary choices) with instant feedback.
- **Mobile Companion Simulator**: An integrated phone overlay UI that simulates a mobile app for tracking GPS routes, logging diet, and generating travel insights.
- **GPS Heuristic Engine**: Simulates a live GPS tracking journey and intelligently predicts the mode of transport (car vs. transit vs. walking) based on average speed heuristics.

## Technology Stack
- **Frontend Framework**: Vite
- **Languages**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **3D Rendering**: Three.js
- **Testing**: Vitest + JsDOM

## Project Architecture
The codebase adheres strictly to the **Single Responsibility Principle (SRP)**, with highly modular, decoupled logic:
- `src/main.js`: The central orchestrator that wires all controllers together.
- `src/threeSetup.js`: Abstracts all raw `Three.js` boilerplate (scene, camera, renderer, lighting, post-processing).
- `src/cityGenerator.js`: Procedurally generates 3D city assets and handles real-time material degradation.
- `src/uiController.js`: Handles DOM bindings, input sliders, and syncs the UI dials.
- `src/gpsController.js`: Houses the logic for simulating GPS trips, tracking distances, and heuristic mode evaluation.
- `src/appState.js`: Maintains the global state of the application and handles local persistence.
- `src/carbonEngine.js`: Normalizes user inputs and factors into a global 0-100 Carbon Score.
- `src/degradationModel.js`: Maps the Carbon Score into specific visual environmental parameters (smog density, color shifts).
- `src/utils/domUtils.js`: A specialized security utility for executing safe DOM mutations and preventing XSS.

## Security & Accessibility (A11y)
This project is built to enterprise-grade security and accessibility standards:
- **Zero XSS Vulnerabilities**: Complete ban on `.innerHTML` usage. All DOM manipulation flows through a hardened `createSafeElement` utility.
- **Strict Content-Security-Policy (CSP)**: `index.html` implements a strict CSP without `'unsafe-inline'` or `'unsafe-eval'` script directives.
- **Screen Reader Support**: All dynamic metrics and notifications utilize `aria-live="polite"` tags. Decorative SVGs are hidden using `aria-hidden="true"`. Semantic `<main>` and `<label>` elements map all UI controls.
- **Keyboard Navigation**: Fully optimized for keyboard navigation with high-contrast `:focus-visible` states.

## Testing Suite
The application features a robust automated testing suite using **Vitest**. Complex UI logic and fake timers are used to test asynchronous GPS flows instantly without flakiness.

To run the tests:
```bash
npm run test
```

## Running Locally

1. Ensure you have Node.js installed.
2. Clone this repository or navigate to the project directory.
3. Install all dependencies (including `vitest` and `three`):
   ```bash
   npm install
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
5. Open the provided `localhost` URL in your browser to interact with the 3D City.
